/**
 * Created by chriscooke on 4/15/15.
 */
'use strict';

var fs = require('fs');
var Q = require('q');
var bv = require('./bv');
var disParser = require('./disParser');
//var log = require('./logger').create('archive');

var archive = module.exports;

var parseJsonFile = function(filePath) {
    // Just wrap in a promise
    var d = Q.defer();
    try {
        fs.readFile(filePath, function(error, jsonData) {
            if (error) {
                d.reject(error);
            } else {
                var data = JSON.parse(jsonData);
                d.resolve(data);
            }
        });
    }
    catch(err) {
        d.reject(err);
    }
    return d.promise;
};

var readBinaryFile = function(filePath) {
    // Just wrap in a promise
    var d = Q.defer();
    try {
        fs.readFile(filePath, function(error, buffer) {
            if (error) {
                d.reject(error);
            } else {
                d.resolve(buffer);
            }
        });
    }
    catch(err) {
        d.reject(err);
    }
    return d.promise;
};

var validatePcapIndices = function(buffer, startTimestamp, endTimestamp) {
    /* Validate file contains valid indices */

    var minIndex = 0;
    var maxIndex = (buffer.length/16) - 1;

    var dataView = bv.dataView(buffer, 0, false);

    for (var i=minIndex; i<=maxIndex; i++) {
        var offset = i*16;
        var ts = dataView.getLong(offset);
        if (ts<startTimestamp || ts>endTimestamp) {
            throw (new Error("PCAP Index file is corrupt"))
        }
    }

};

var pcapFileIndices = function(buffer, startSecond, endSecond) {
    /*
     * Performs a binary search on the pcap index file.
     * return start and end offsets for pcap slice
     */

    startSecond = Math.floor(startSecond);
    endSecond = Math.floor(endSecond);

    var minIndex = 0;
    var maxIndex = (buffer.length/16) - 1;
    var currentIndex;
    var currentSecond;

    //search for pcap index equal to startSecond or closest above
    var dataView = bv.dataView(buffer, 0, false);

    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentSecond = dataView.getLong(currentIndex*16);

        if (currentSecond < startSecond) {
            minIndex = currentIndex + 1;
        }
        else if (currentSecond > startSecond) {
            maxIndex = currentIndex - 1;
        }
        else {
            break;
        }
    }

    var sliceStart = dataView.getLong((currentIndex*16)+8);
    while (currentSecond <= endSecond) {
        currentIndex++;
        currentSecond = dataView.getLong(currentIndex*16);
    }

    var sliceEnd = dataView.getLong((currentIndex*16)+8);

    return {start: sliceStart, end: sliceEnd};
};

var pcapFileSlice = function(pcapFilePath, start, end) {
    var d = Q.defer();
    try {
        var sizeInBytes = end-start;
        var buffer = new Buffer(sizeInBytes);

        var stream = fs.createReadStream(pcapFilePath, {start: start, end: end});
        var index = 0;

        stream.on('data', function(data){
            for (var i = 0; i < data.length; i++) {
                buffer[index++] = data[i];
            }
        });

        stream.on('error', function(err){
            d.reject(err);
        });

        stream.on('end', function(){
            d.resolve(buffer);
        });
    }
    catch(err) {
        d.reject(err);
    }

    return d.promise;
};

archive.query = function (id) {
    var d = Q.defer();

    var archivesPath = "data/recordings/";

    try {
        // Iterate through archive directory to find archive id
        fs.readdir(archivesPath, function(err, folders) {
            if (err) {
                d.reject(err);
            } else {
                try {
                    var archive = {};
                    for (var i=0; i< folders.length; i++) {
                        var archiveFolder = folders[i];
                        // Check for valid archive folder
                        if (archiveFolder.indexOf('a_')===0) {
                            var detail = archiveFolder.split('_');
                            var startTimestamp = parseInt(detail[detail.length-2]);
                            var endTimestamp = parseInt(detail[detail.length-1]);
                            // Handle possible '_' in name
                            var archiveId, archiveName;
                            if (detail.length>4) {
                                archiveName = detail.slice(1,detail.length-3).toString().replace(",","_");
                                archiveId = detail[detail.length-3];
                            } else {
                                archiveName = detail.slice(1,detail.length-2).toString().replace(",","_");
                                archiveId = startTimestamp+"_"+endTimestamp;
                            }

                            if (archiveId === id) {
                                archive.name = archiveName;
                                archive.id = archiveId;
                                archive.startTimestamp = startTimestamp;
                                archive.endTimestamp = endTimestamp;
                                archive.duration = endTimestamp-startTimestamp;
                                archive.path = archivesPath+archiveFolder;
                            }
                        }
                    }
                    if (!archive.hasOwnProperty('id')) {
                        d.reject(new Error('No Archive found for Id '+id));
                    } else {
                        d.resolve(archive);
                    }
                } catch (err) {
                    d.reject(err);
                }
            }
        });
    } catch (err) {
        d.reject(err);
    }

    return d.promise;
};

archive.queryExercises = function(id, filter) {
    var d = Q.defer();

    archive.query(id)
        .then(function(archive) {
            return parseJsonFile(archive.path+'/exercise.json');
        })
        .then(function(exercises) {
            try {
                if (typeof filter !== 'undefined') {
                    var filteredExercises = [];
                    // Filter for time range
                    for (var i = 0; i < exercises.length; i++) {
                        var exercise = exercises[i];
                        if (exercise.start < filter.endTimestamp && exercise.end > filter.startTimestamp) {
                            filteredExercises.push(exercise);
                        }
                    }
                    d.resolve(filteredExercises);
                } else {
                    d.resolve(exercises);
                }

            } catch (err) {
                d.reject(err);
            }
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};

archive.queryPduStats = function(id, frequency, filter) {
    var d = Q.defer();

    var statsFileName = {
        'perSec':  'packetstats.json',
        'perMin':  'packetstatsmin.json',
        'perHour': 'packetstatshr.json',
        'perDay':  'packetstatsday.json'
    };

    var fileName = statsFileName[frequency];
    if (!fileName) {
        throw new Error('Invalid packet stats request. Unsupported sample rate ['+frequency+']')
    }

    archive.query(id)
        .then(function(archive) {
            return parseJsonFile(archive.path+'/'+fileName);
        })
        .then(function(pduStats) {
            try {
                if (typeof filter !== 'undefined') {
                    var filteredPduStats = [];
                    // Filter for time range
                    for (var i = 0; i < pduStats.length; i++) {
                        var pduCount = pduStats[i];
                        if (pduCount[0]>=filter.startTimestamp && pduCount[0]<=filter.endTimestamp) {
                            filteredPduStats.push(pduCount);
                        }
                    }
                    d.resolve(filteredPduStats);
                } else {
                    d.resolve(pduStats);
                }

            } catch (err) {
                d.reject(err);
            }
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};

archive.queryEntities = function(id) {
    var d = Q.defer();

    archive.query(id)
        .then(function(archive) {
            return readBinaryFile(archive.path+'/entitystate.bin');
        })
        .then(function(buffer) {
            d.resolve(buffer);
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};

archive.queryTransmissions = function(id) {
    var d = Q.defer();

    archive.query(id)
        .then(function(archive) {
            return readBinaryFile(archive.path+'/txbin.bin');
        })
        .then(function(buffer) {
            d.resolve(buffer);
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};

archive.queryPdus = function(id, startTimestamp, endTimestamp, filter, fields) {
    var d = Q.defer();

    var rec = null;

    archive.query(id)
        .then(function(archive) {
            // Read pcap index file
            rec = archive;
            return readBinaryFile(rec.path+'/'+rec.startTimestamp+'.tidx');
        })
        .then(function(indexBuffer) {
            // Get pcap file slice start/end indices
            try {
                validatePcapIndices(indexBuffer, rec.startTimestamp, rec.endTimestamp);

                // Force int for index, default to archive limits if no start/end specified
                startTimestamp = Math.floor((startTimestamp) ? startTimestamp : rec.startTimestamp);
                endTimestamp = Math.floor((endTimestamp) ? endTimestamp : rec.endTimestamp);

                //log.info("start="+startTimestamp+", end="+endTimestamp);
                return pcapFileIndices(indexBuffer, startTimestamp, endTimestamp);
            }
            catch (err) {
                d.reject(err);
            }
        })
        .then(function(pcapSlice) {
            // Read pcap file slice
            var pcapFilePath = rec.path+'/'+rec.startTimestamp+".pcap";
            return pcapFileSlice(pcapFilePath, pcapSlice.start, pcapSlice.end);
        })
        .then(function(buffer) {
            return disParser.parse(buffer, filter, fields, false);   // false = No global header
        })
        .then(function(pdus) {
            d.resolve(pdus);
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};

archive.delete = function(id) {
    var d = Q.defer();

    archive.query(id)
        .then(function(archive) {
            try {
                fs.readdir(archive.path, function(err, fileList) {
                    for (var i=0; i<fileList.length; i++) {
                        var filePath = archive.path+"/"+fileList[i];
                        fs.unlinkSync(filePath);
                    }

                    fs.rmdir(archive.path);
                    d.resolve(id);
                });
            }
            catch(err) {
                d.reject(err);
            }
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};
