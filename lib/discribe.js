/**
 * Created by chriscooke on 4/4/15.
 */
'use strict';

var fs = require('fs');
var Q = require('q');
var log = require('./logger').create('discribe');

var discribe = module.exports;

var recordingsPath = "data/recordings";

discribe.queryServers = function() {
    var d = Q.defer();

    try {
        var list = [];
        d.resolve(list);
    } catch (err) {
        d.reject(err);
    }

    return d.promise;
};

discribe.queryArchives = function() {
    var d = Q.defer();

    // Iterate through recording directory for latest recordings
    fs.readdir(recordingsPath, function(err, folders) {
        if (err) {
            d.reject(err);
        } else {
            try {
                var recordings = [];
                for (var i=0; i< folders.length; i++) {
                    var recordingFolder = folders[i];
                    // Check for valid recording folder
                    if (recordingFolder.indexOf('a_')===0) {
                        var detail = recordingFolder.split('_');
                        var startTimestamp = parseInt(detail[detail.length-2]);
                        var endTimestamp = parseInt(detail[detail.length-1]);
                        // Handle possible '_' in name
                        var recordingId, recordingName;
                        if (detail.length>4) {
                            recordingName = detail.slice(1,detail.length-3).toString().replace(",","_");
                            recordingId = detail[detail.length-3];
                        } else {
                            recordingName = detail.slice(1,detail.length-2).toString().replace(",","_");
                            recordingId = startTimestamp+"_"+endTimestamp;
                        }

                        var recording = {}; //LocalRecording(Base);
                        recording.name = recordingName;
                        recording.id = recordingId;
                        recording.startTimestamp = startTimestamp;
                        recording.endTimestamp = endTimestamp;
                        recording.duration = endTimestamp-startTimestamp;

                        recordings.push(recording);
                    }
                    d.resolve(recordings);
                }
            } catch (err) {
                d.reject(err);
            }
        }
    });

    return d.promise;
};


discribe.queryReplayers = function() {
    var d = Q.defer();

    try {
        var list = [];
        d.resolve(list);
    } catch (err) {
        d.reject(err);
    }

    return d.promise;
};

