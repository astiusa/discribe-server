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

var pcapFileSlice = function(pcapFilePath, startTime, endTime) {
    var d = Q.defer();
    try {
        var sizeInBytes = endTime-startTime;
        var buffer = new Buffer(sizeInBytes);

        var stream = fs.createReadStream(pcapFilePath, {start: startTime, end: endTime});
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
                    var a = {};
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
                                a.name = archiveName;
                                a.id = archiveId;
                                a.startTimestamp = startTimestamp;
                                a.endTimestamp = endTimestamp;
                                a.duration = endTimestamp-startTimestamp;
                                a.path = archivesPath+archiveFolder;
                            }
                        }
                    }
                    if (!a.hasOwnProperty('id')) {
                        d.reject(new Error('No Archive found for Id '+id));
                    } else {
                        d.resolve(a);
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

archive.queryExercises = function(id, startTime, endTime) {
    var d = Q.defer();

    archive.query(id)
        .then(function(a) {
            startTime = Math.floor((startTime) ? startTime : a.startTimestamp);
            endTime = Math.floor((endTime) ? endTime : a.endTimestamp-1);

            return parseJsonFile(a.path+'/exercise.json');
        })
        .then(function(exercises) {
            try {
                var filteredExercises = [];
                // Filter for time range
                for (var i = 0; i < exercises.length; i++) {
                    var exercise = exercises[i];
                    if (exercise.start < endTime && exercise.end > startTime) {
                        filteredExercises.push(exercise);
                    }
                }
                d.resolve(filteredExercises);

            } catch (err) {
                d.reject(err);
            }
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};

archive.queryPduStats = function(id, sampleRate, startTime, endTime) {
    var d = Q.defer();

    var statsFileName = {
        'perSec':  'packetstats.json',
        'perMin':  'packetstatsmin.json',
        'perHour': 'packetstatshr.json',
        'perDay':  'packetstatsday.json'
    };

    var fileName = statsFileName[sampleRate];
    if (!fileName) {
        throw new Error('Invalid packet stats request. Unsupported sample rate ['+sampleRate+']')
    }

    archive.query(id, startTime, endTime)
        .then(function(a) {
            startTime = Math.floor((startTime) ? startTime : a.startTimestamp);
            endTime = Math.floor((endTime) ? endTime : a.endTimestamp-1);

            return parseJsonFile(a.path+'/'+fileName);
        })
        .then(function(pduStats) {
            try {
                var filtered = [];
                // Filter for time range
                for (var i = 0; i < pduStats.length; i++) {
                    var pduCount = pduStats[i];
                    if (pduCount[0]>=startTime && pduCount[0]<=endTime) {
                        filtered.push(pduCount);
                    }
                }
                d.resolve(filtered);

            } catch (err) {
                d.reject(err);
            }
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};

archive.queryEntitySummary = function(id, startTime, endTime, filter) {
    var d = Q.defer();

    archive.query(id)
        .then(function(a) {
            startTime = Math.floor((startTime) ? startTime : a.startTimestamp);
            endTime = Math.floor((endTime) ? endTime : a.endTimestamp-1);

            return readBinaryFile(a.path+'/entitystate.bin');
        })
        .then(function(buffer) {
            var fields = ['header','entityId','entityType','forceId','marking','endTimestampSeconds','endTimestampMSeconds'];
            return disParser.parse(buffer, filter, fields, true);   // true = Has global header
        })
        .then(function(entitySummary) {
            var filtered = [];
            // Filter for time range
            for (var i = 0; i < entitySummary.length; i++) {
                var endTimestamp = entitySummary[i].endTimestampSeconds + (entitySummary[i].endTimestampMSeconds*0.000001);
                if (entitySummary[i].header.timestamp>=startTime && endTimestamp<=endTime) {
                    filtered.push(entitySummary[i]);
                }
            }
            d.resolve(filtered);
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};

archive.queryTransmissions = function(id, startTime, endTime, filter) {
    var d = Q.defer();

    archive.query(id)
        .then(function(a) {
            startTime = Math.floor((startTime) ? startTime : a.startTimestamp);
            endTime = Math.floor((endTime) ? endTime : a.endTimestamp-1);

            return readBinaryFile(a.path+'/txbin.bin');
        })
        .then(function(buffer) {
            var fields = ['header','entityId','radioId','frequency','endTimestampSeconds','endTimestampMSeconds'];
            return disParser.parse(buffer, filter, fields, true);   // true = Has global header
        })
        .then(function(transmissions) {
            var filtered = [];
            // Filter for time range
            for (var i = 0; i < transmissions.length; i++) {
                var endTimestamp = transmissions[i].endTimestampSeconds + (transmissions[i].endTimestampMSeconds*0.000001);
                if (transmissions[i].header.timestamp>=startTime && endTimestamp<=endTime) {
                    filtered.push(transmissions[i]);
                }
            }
            d.resolve(filtered);
        })
        .catch(function(error) {
            d.reject(error);
        });

    return d.promise;
};

archive.queryPdus = function(id, startTime, endTime, filter, fields) {
    var d = Q.defer();
    var _a = null;

    archive.query(id)
        .then(function(a) {
            _a = a;

            // Force int for index, default to archive limits if no start/end specified
            startTime = Math.floor((startTime) ? startTime : a.startTimestamp);
            endTime = Math.floor((endTime) ? endTime : startTime);

            // Read pcap index file
            return readBinaryFile(a.path+'/'+a.startTimestamp+'.tidx');
        })
        .then(function(indexBuffer) {
            // Get pcap file slice start/end indices
            try {
                validatePcapIndices(indexBuffer, _a.startTimestamp, _a.endTimestamp);


                //log.info("startTime="+startTime+", endTime="+endTime);
                return pcapFileIndices(indexBuffer, startTime, endTime);
            }
            catch (err) {
                d.reject(err);
            }
        })
        .then(function(pcapSlice) {
            // Read pcap file slice
            var pcapFilePath = _a.path+'/'+_a.startTimestamp+".pcap";
            return pcapFileSlice(pcapFilePath, pcapSlice.start, pcapSlice.end);
        })
        .then(function(buffer) {
            if (!fields || fields.length===0) {
                // Return default pdu fields
                fields = ["header", "pduType", "pduLength", "entityId"];
            }
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
        .then(function(a) {
            try {
                fs.readdir(a.path, function(err, fileList) {
                    for (var i=0; i<fileList.length; i++) {
                        var filePath = a.path+"/"+fileList[i];
                        fs.unlinkSync(filePath);
                    }

                    fs.rmdir(a.path);
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
