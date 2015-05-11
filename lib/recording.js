/**
 * Created by chriscooke on 4/4/15.
 *
 * API to DIScribe server recordings
 */
'use strict';

var Q = require('q');
var http = require('http');
var request = require('request');
//var log = require('./logger').create('recording');

var recording = module.exports;

var domain = 'http://localhost:3000';   // local testing

recording.queryRecordings = function() {
    var d = Q.defer();

    request.get({
        uri: '/api/discribe/recordings/',
        baseUrl: domain
    }, function(err, response, data) {
        if (err) {
            d.reject(err);
        } else {
            try {
                var resp = JSON.parse(data);
                d.resolve(resp.recordings);
            } catch (err) {
                d.reject(err);
            }
        }
    });

    return d.promise;
};

recording.query = function(id) {
    var d = Q.defer();

    request.get({
        uri: '/api/discribe/recordings/'+id,
        baseUrl: domain
    }, function(err, response, data) {
        if (err) {
            d.reject(err);
        } else {
            try {
                var resp = JSON.parse(data);
                d.resolve(resp.recording);
            } catch (err) {
                d.reject(err);
            }
        }
    });

    return d.promise;
};

recording.queryExercises = function (id, startTime, endTime) {
    var d = Q.defer();

    request.get({
        uri: '/api/discribe/recordings/'+id+'/exercises',
        baseUrl: domain
    }, function(err, response, data) {
        if (err) {
            d.reject(err);
        } else {
            try {
                var resp = JSON.parse(data);
                d.resolve(resp.exercises);
            } catch (err) {
                d.reject(err);
            }
        }
    });

    return d.promise;
};

recording.queryPduStats = function(id, sampleRate, startTime, endTime) {
    var d = Q.defer();

    var pluginNames = {
        'perSec':  'packetstats',
        'perMin':  'packetstatsmin',
        'perHour': 'packetstatshr',
        'perDay':  'packetstatsday'
    };

    var pluginName = pluginNames[sampleRate];
    if (!pluginName) {
        throw new Error('Invalid packet stats request. Unsupported sample rate ['+sampleRate+']')
    }

    request.get({
        //uri: '/api/discribe/recordings/'+id+'/'+pluginName,   // Commented out for testing
        uri: '/api/discribe/recordings/'+id+'/pduStats/'+sampleRate,
        baseUrl: domain
    }, function(err, response, data) {
        if (err) {
            d.reject(err);
        } else {
            try {
                var resp = JSON.parse(data);
                d.resolve(resp.pduStats);
            } catch (err) {
                d.reject(err);
            }
        }
    });

    return d.promise;
};

recording.queryEntitySummary = function(id, startTime, endTime) {
    var d = Q.defer();

    request.get({
        // uri: '/api/discribe/recordings/'+id+'/entitySummary',   // Commented out for testing
        uri: '/api/discribe/recordings/'+id+'/entitySummary',
        baseUrl: domain,
        encoding: null
    }, function(err, response, data) {
        if (err) {
            d.reject(err);
        } else {
            try {
                var resp = JSON.parse(data);
                d.resolve(resp.entitySummary);
            } catch (err) {
                d.reject(err);
            }
        }
    });

    return d.promise;
};

recording.queryTransmissions = function(id, startTime, endTime) {
    var d = Q.defer();

    request.get({
        //uri: '/api/discribe/recordings/'+id+'/transmissionSummary',   // Commented out for testing
        uri: '/api/discribe/recordings/'+id+'/transmissions',
        baseUrl: domain,
        encoding: null
    }, function(err, response, data) {
        if (err) {
            d.reject(err);
        } else {
            try {
                var resp = JSON.parse(data);
                d.resolve(resp.transmissions);
            } catch (err) {
                d.reject(err);
            }
        }
    });

    return d.promise;
};

recording.queryPdus = function(id, startTime, endTime) {
    var d = Q.defer();

    request.get({
        //uri: '/api/discribe/recordings/'+id+'/pcap?start='+startTimestamp+'&end='+endTimestamp,
        uri: '/api/discribe/recordings/'+id+'/pdus?start='+startTime+'&end='+endTime,
        baseUrl: domain,
        encoding: null
    }, function(err, response, data) {
        if (err) {
            d.reject(err);
        } else {
            try {
                var resp = JSON.parse(data);
                d.resolve(resp.pdus);
            } catch (err) {
                d.reject(err);
            }
        }
    });

    return d.promise;
};

var writeJsonFile = function(filePath, data) {
    // Just wrap in a promise
    var d = Q.defer();
    try {
        fs.writeFile(filePath, data, function (err) {
            if (err) {
                d.reject(error);
            } else {
                d.resolve(data);
            }
        });
    }
    catch(err) {
        d.reject(err);
    }
    return d.promise;
};

var writeBinaryFile = function(filePath, buffer) {
    // Just wrap in a promise
    var d = Q.defer();
    try {
        fs.writeFile(filePath, buffer, "binary", function (err) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve();
            }
        });
    }
    catch(err) {
        d.reject(err);
    }
    return d.promise;
};
/*
var downloadPCAPFile = function (filter, path) {
    var d = Q.defer();
    var result = {};

    try {
        var apiUrl = self.pcapUrl + "index";

        var params = self.getFilterParams(filter);
        if (params.length > 0) {
            apiUrl += params;
        }

        var file = fs.createWriteStream(path, { encoding: 'binary' });
        var options = {
            host: url.parse(apiUrl).host,
            strictSSL: false,
            rejectUnauthorized: false,
            path: url.parse(apiUrl).path
        };

        var req = https.get(options, function (res) {
            res.on('data', function (data) {
                file.write(data);
                self.download.bytesDownloaded+=data.length;
                self.download.percent = Math.floor(self.download.bytesDownloaded*100/self.download.size)+" %";
            }).on('end', function () {
                //console.log('http.get on end');
                file.on('finish', function () {
                    d.resolve(result);
                });
                file.end();
            });
        });

        req.on( 'response', function ( data ) {
            if (data.headers.hasOwnProperty("x-est-size")) {
                self.download.size = data.headers["x-est-size"];
                self.download.message = "Downloading ... "+(self.download.size*0.000001).toFixed(0)+"Mb";

            }
            //console.log( data.headers[ 'content-length' ] );
        });
    }
    catch (err) {
        result.error = { 'message': err.message };
        d.resolve(result);
    }

    return d.promise;
};
*/
recording.save = function (archiveName, archiveId, filter) {
    /* Save to local storage the following files:
     exercises (json)
     pduCounts (4 files) (json)
     entity summary (binary)
     transmission summary (binary)
     zipped file containing:
     pcap file (pcap)
     pcap index file (binary)
     */
/*
    var d = Q.defer();

    var download = {};

    download.id = archiveId;
    download.bytesDownloaded = 0;
    download.size = 0;
    download.percent = "0 %";
    download.message = "Creating archive ... ";

    try {
        // Create new archive folder, prefixed by 'a_' for read validation, post-fixed by start & end times
        var archiveFolderName = 'r_' + archiveName + '_' + archiveId + '_' + filter.startTimestamp + '_' + filter.endTimestamp;
        var archivePath = "data/recordings/" + archiveFolderName;
        fs.mkdir(archivePath, function (err) {
            if (err && (err.code !== 'EEXIST')) {
                d.reject(err);
            } else {
                self.queryExercises(archiveId).then(function (data) {
                    return writeJsonFile(archivePath + "/exercise.json", data);
                }).then(function() {
                    d.resolve();
                });

                var stats = ['perSec','perMin','perHour','perDay'];
                for (var i=0; i<stats.length; i++) {
                    self.queryPduStats(archiveId, stats[i]).then(function (data) {
                        return writeJsonFile(archivePath + "/exercise.json", data);
                    }).then(function() {
                        d.resolve();
                    });
                }

                self.queryEntities(archiveId).then(function (data) {
                    return writeBinaryFile(archivePath + "/entitystate.bin", data)
                }).then(function() {
                    d.resolve();
                });

                self.queryTransmissions(archiveId).then(function (data) {
                    writeBinaryFile(archivePath + "/txbin.bin", data)
                }).then(function() {
                    d.resolve();
                });

                downloadPCAPFile(filter, archivePath + "/pcapindex.tar")
                    .then(function (result) {
                        self.download.message = "Unpacking ... ";
                        fs.createReadStream(archivePath + "/pcapindex.tar")
                            .pipe(tar.Extract({ path: archivePath }))
                            .on("error", function (err) {
                                d.reject(err);
                            })
                            .on("end", function () {
                                d.resolve({});
                            });
                    }, function (errback) {
                        result.error = "PCAP index download failed";
                        svcStatus.logError("Remote Recording", "Archive", result.error);
                        d.resolve(result);
                    }, function (progress) {
                        //nothing, for now
                    });
            }
        });
    }
    catch (err) {
        d.reject(err);
    }
*/
    return d.promise;
};



