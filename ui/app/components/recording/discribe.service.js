/**
 * Created by chriscooke on 4/29/15.
 */

define(['bower_components/d3/d3.min'], function(d3) {

    'use strict';

    var deps = ['$resource','$q', '$timeout'];

    return {svcDiscribe: deps.concat(factory)};

    function factory($resource, $q, $timeout) {
        var options = {stripTrailingSlashes:false};
        var service = {};

        service.TimeSpan = function() {
            var timeSpan = {};
            timeSpan.startTimestamp = null;
            timeSpan.endTimestamp = null;
            timeSpan.maxTimestamp = 0;
            timeSpan.duration = 0;
            timeSpan.savedRanges = [];
            timeSpan.canRevert = false;
            timeSpan.hasUpdate = false;
            timeSpan.hasLiveUpdate = false;

            timeSpan.updateRange = function(startTimestamp, endTimestamp, maxTimestamp) {
                // Set new range
                timeSpan.startTimestamp = startTimestamp;
                timeSpan.endTimestamp = endTimestamp;
                if (typeof maxTimestamp != "undefined") {
                    timeSpan.maxTimestamp = maxTimestamp;
                }

                timeSpan.duration = timeSpan.endTimestamp-timeSpan.startTimestamp;
                timeSpan.isLive = false; //service.current.recording.inprogress && ((timeSpan.maxTimestamp-timeSpan.endTimestamp)<15);
            };
            timeSpan.saveCurrentRange = function() {
                // Remember recording end for possible live tailing test on revert
                timeSpan.savedRanges.push({
                    startTimestamp: timeSpan.startTimestamp,
                    endTimestamp: timeSpan.endTimestamp,
                    maxTimestamp: timeSpan.maxTimestamp,
                    duration: timeSpan.duration
                });
                timeSpan.canRevert = true;
            };
            timeSpan.setRange = function(startTimestamp, endTimestamp, maxTimestamp) {
                timeSpan.updateRange(startTimestamp, endTimestamp, maxTimestamp);
                timeSpan.notifyUpdated();
            };
            timeSpan.setClosestRange = function() {
                // Calculates best zoom range to set from dateTime and current range (duration)
                var startTimestamp;
                var endTimestamp;
                if (timeSpan.duration<7201) {
                    // zoom to 60 secs range
                    dt = d3.time.minute(dt);
                    startTimestamp = Math.floor(dt.getTime()/1000);
                    endTimestamp = startTimestamp+60;

                } else if (timeSpan.duration<86401) {
                    // zoom to 60 mins range
                    dt = d3.time.hour(dt);
                    startTimestamp = Math.floor(dt.getTime()/1000);
                    endTimestamp = startTimestamp+3600;

                } else {
                    // zoom to 24 hours
                    dt = d3.time.day(dt);
                    startTimestamp = Math.floor(dt.getTime()/1000);
                    endTimestamp = startTimestamp+86400;
                }

                // Clamp to current limits
                if (startTimestamp < timeSpan.startTimestamp) {
                    startTimestamp = timeSpan.startTimestamp;
                }
                if (endTimestamp > timeSpan.endTimestamp) {
                    endTimestamp = timeSpan.endTimestamp;
                }
                timeSpan.saveCurrentRange();
                timeSpan.setRange(startTimestamp, endTimestamp);
            };
            timeSpan.revertRange = function(itemIndex) {
                if (itemIndex && timeSpan.savedRanges.length>(itemIndex+1)) {
                    // Remove history items newer than indexed item
                    var itemsToRemove = timeSpan.savedRanges.length-itemIndex-1;
                    timeSpan.savedRanges.splice(itemIndex+1, itemsToRemove);
                }
                var historyItem = timeSpan.savedRanges.pop();
                var startTimestamp = historyItem.startTimestamp;
                var endTimestamp = historyItem.endTimestamp;
                var maxTimestamp = historyItem.maxTimestamp;
/*
                if (timeSpan.exercises.length>0) {
                    // Assume reverting from exercise
                    timeSpan.exercises.length = 0;
                    timeSpan.ports.length = 0;
                }
                // if live, update with latest.
                timeSpan.isLive = service.current.recording.inprogress && ((timeSpan.maxTimestamp-timeSpan.endTimestamp)<15);
                if (timeSpan.isLive) {
                    endTimestamp = service.current.recording.endTimestamp;
                    maxTimestamp = service.current.recording.endTimestamp;
                }
 */

                timeSpan.setRange(startTimestamp, endTimestamp, maxTimestamp);

                timeSpan.canRevert = timeSpan.savedRanges.length > 0;
                timeSpan.notifyUpdated();
            };

            timeSpan.notifyUpdated = function () {
                if (timeSpan.hasUpdate++ > 10) {
                    timeSpan.hasUpdate = 0;
                }
            };

            return timeSpan;
        };

        service.state = {
            server: 'http://localhost:3000/',
            recordingId: null,
            exerciseId: null,
            timeSpan: service.TimeSpan()
        };

        service.selectRecording = function(recording) {
            service.state.recordingId = recording.id;
            service.state.exerciseId = null;
            service.state.timeSpan.setRange(recording.startTimestamp, recording.endTimestamp, recording.endTimestamp);
        };

        service.selectExercise = function(exerciseId) {
            service.state.exerciseId = exerciseId;
        };

        service.Recordings = function() {
            return $resource(
                service.state.server+'api/discribe/recordings/',
                {},
                {
                    'query': {
                        method: 'GET',
                        transformResponse: function(data) {return angular.fromJson(data).recordings},
                        isArray: true
                    }
                },
                options
            );
        };

        service.Exercises = function() {
            var exercises = {};

            exercises.filter = {
                exercises: [],
                ports: [],
                minDuration: 5,
                shortOnly: false
            };

            exercises.Data = function(timeSpan) {
                return $resource(
                    service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/exercises',
                    {
                        start: timeSpan.startTimestamp,
                        end: timeSpan.endTimestamp
                    },
                    {
                        'query': {
                            method: 'GET',
                            transformResponse: function(data) {return angular.fromJson(data).exercises},
                            isArray: true
                        }
                    },
                    options
                );
            };

            exercises.query = function(timeSpan) {
                var d = $q.defer();
                var results = exercises.Data(timeSpan).query(function() {
                    var filtered = [];
                    angular.forEach(results, function (exercise) {
                        var validExercise = (exercises.filter.exercises.length===0 || exercises.filter.exercises.indexOf(exercise.exercise)!==-1);
                        var validPort = (exercises.filter.ports.length===0 || exercises.filter.ports.indexOf(exercise.port)!==-1);
                        var duration = exercise.end - exercise.start;
                        var validDuration = (exercises.filter.shortOnly)
                            ? duration <= (exercises.filter.minDuration*60)
                            : duration > (exercises.filter.minDuration*60);

                        if (validExercise && validPort && validDuration) {
                            exercise.duration = exercise.end - exercise.start;
                            //exercise.inprogress = false;
                            if (exercise.duration > 2678400) {
                                // Date of 2**32-1 signify 'recording in progress, so check if > 1 month (60*60*24*31)
                                var dt = new Date();
                                exercise.end = Math.floor(dt.getTime()/1000);
                                exercise.duration = exercise.end - exercise.start;
                                exercise.inprogress = true;
                            }
                            filtered.push(exercise);
                        }
                    });

                    d.resolve(filtered);
                });

                return d.promise;
            };

            exercises.hasUpdate = 0;
            exercises.notifyUpdated = function () {
                if (exercises.hasUpdate++ > 10) {
                    exercises.hasUpdate = 0;
                }
            };

            return exercises;
        };

        service.PduStats = function() {
            var pduStats = {};
            pduStats.interval = 1;
            pduStats.pduType = "Total";
            pduStats.sampleRate = "perMin";
            pduStats.pduTypesAvailable = [];
            pduStats.pduTypeCounts = {"Total": {"totalCount": 0, "counts": {}}};

            var updatePduCounts = function (data) {
                angular.forEach(data, function (timestampCounts) {
                    // data format is [[timestamp, [{pduType, pduTypeCount}]]]
                    var timestamp = timestampCounts[0];
                    var pduCounts = timestampCounts[1];
                    var timestampTotalCount = 0;

                    angular.forEach(pduCounts, function (count, pduType) {
                        if (!pduStats.pduTypeCounts.hasOwnProperty(pduType)) {
                            pduStats.pduTypeCounts[pduType] = { "totalCount": 0, "counts": {} };
                        }

                        pduStats.pduTypeCounts[pduType].counts[timestamp] = count;
                        pduStats.pduTypeCounts[pduType].totalCount += count;
                        timestampTotalCount += count;
                    });

                    pduStats.pduTypeCounts["Total"].counts[timestamp] = timestampTotalCount;
                    pduStats.pduTypeCounts["Total"].totalCount += timestampTotalCount;
                });

                // Update pduType List
                pduStats.pduTypesAvailable.length = 0;
                angular.forEach(pduStats.pduTypeCounts, function (count, pduType) {
                    //pduStats.pduTypesAvailable.push({'name': svcDisEnums.pduTypeName(pduType), 'pduType': pduType});
                    pduStats.pduTypesAvailable.push({'name': 'pduType_'+pduType, 'pduType': pduType});
                });
            };

            pduStats.Data = function(timeSpan) {
                return $resource(
                    service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/pduStats/'+pduStats.sampleRate,
                    {
                        start: timeSpan.startTimestamp,
                        end: timeSpan.endTimestamp,
                        pduType: function() {return pduStats.pduType;}
                    },
                    {
                        'query': {
                            method: 'GET',
                            transformResponse: function(data) {return angular.fromJson(data).pduStats},
                            isArray: true
                        }
                    },
                    options
                );
            };

            pduStats.query = function(timeSpan) {
                var d = $q.defer();
                if (timeSpan.duration < 601) {   // < 10 mins
                    pduStats.interval = 1;
                    pduStats.units = "second";
                    pduStats.sampleRate = "perSec";
                } else if (timeSpan.duration < 86401) {  // < 24 hours
                    pduStats.interval = 60;
                    pduStats.units = "minute";
                    pduStats.sampleRate = "perMin";
                } else {
                    pduStats.interval = 3600;
                    pduStats.units = "hour";
                    pduStats.sampleRate = "perHour";
                }
                var data = pduStats.Data(timeSpan).query(function() {
                    updatePduCounts(data);
                    if (pduStats.pduType && pduStats.pduTypeCounts.hasOwnProperty(pduStats.pduType)) {
                        d.resolve(pduStats.pduTypeCounts[pduStats.pduType].counts);
                    } else {
                        d.resolve([]);
                    }
                });

                return d.promise;
            };

            pduStats.selectPduType = function(pduType) {
                pduStats.pduType = pduType;
                //if (pduStats.applyToFilter) {
                //    pduStats.notifyUpdated();
                //}
            };

            pduStats.clearCache = function() {

            };

            return pduStats;
        };

        service.EntitySummary = function(timeSpan) {
            return $resource(
                service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/entitySummary',
                {
                    start: timeSpan.startTimestamp,
                    end: timeSpan.endTimestamp
                },
                {
                    'query': {
                        method: 'GET',
                        transformResponse: function(data) {return angular.fromJson(data).entitySummary},
                        isArray: true
                    }
                },
                options
            );
        };

        service.Transmissions = function(timeSpan) {
            return $resource(
                service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/transmissions',
                {
                    start: timeSpan.startTimestamp,
                    end: timeSpan.endTimestamp
                },
                {
                    'query': {
                        method: 'GET',
                        transformResponse: function(data) {return angular.fromJson(data).transmissions},
                        isArray: true
                    }
                },
                options
            );
        };

        service.PDUs = function(timeSpan, filterExpr, fields) {
            var params = {
                start: timeSpan.startTimestamp,
                end: timeSpan.endTimestamp
            };

            if (filterExpr) {
                params.filter = encodeURIComponent(filterExpr);
            }
            if (fields) {
                params.fields = encodeURIComponent(JSON.stringify(fields));
            }
            return $resource(
                service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/pdus',
                params,
                {
                    'query': {
                        method: 'GET',
                        transformResponse: function(data) {return angular.fromJson(data).pdus},
                        isArray: true
                    }
                },
                options
            );
        };

        service.PDU = function(pduId) {
            var params = {};
            return $resource(
                service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/pdus/'+pduId,
                params,
                {
                    'query': {
                        method: 'GET',
                        transformResponse: function(data) {return angular.fromJson(data).pdus},
                        isArray: true
                    }
                },
                options
            );
        };

        service.PduReader = function(pdus) {
            var self = this;
            self.pdus = pdus;
            self.count = 0;
            self.filter = null;
            self.fields = null;

            self.timeSpan = null;
            self.readSpan = {startTimestamp:0, endTimestamp:0};

            var readDelta = 1;
            var dataComplete = false;
            var readInProgress = false;

            var checkRead = function() {
                if (!dataComplete && !readInProgress) {
                    readInProgress = true;
                    var pdus = service.PDUs(self.readSpan, self.filter, self.fields).query(function() {
                        Array.prototype.push.apply(self.pdus, pdus);
                        self.readSpan.startTimestamp += readDelta;
                        self.readSpan.endTimestamp = self.readSpan.startTimestamp + readDelta -1;
                        dataComplete = (self.pdus.length>=self.count ||
                        self.readSpan.startTimestamp >= self.timeSpan.endTimestamp);
                        readInProgress = false;
                    });
                }
                if (!dataComplete) {
                    $timeout(function() {
                        checkRead();
                    }, 500);
                } else {

                }
            };

            self.read = function(timeSpan, filter, fields, count) {
                self.pdus.length = 0;
                self.timeSpan = timeSpan;
                self.readSpan.startTimestamp = timeSpan.startTimestamp;
                self.readSpan.endTimestamp = self.readSpan.startTimestamp + readDelta -1;
                self.count = count;
                self.filter = filter;
                self.fields = (fields) ? fields : [];

                dataComplete = false;
                readInProgress = false;

                checkRead();
            };

            self.cancel = function() {
                self.pdus.length = 0;
                dataComplete = true;
            };

        };


        return service;
    }
});

