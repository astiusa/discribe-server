/**
         * Created by chriscooke on 4/29/15.
         */

        define([], function() {

            'use strict';

            var deps = ['$resource','$q'];

            return {svcDiscribe: deps.concat(factory)};

            function factory($resource, $q) {
                var options = {stripTrailingSlashes:false};
                var service = {};

        service.TimeSpan = function() {
            var timeSpan = {};
            timeSpan.startTimestamp = null;
            timeSpan.endTimestamp = null;
            timeSpan.duration = 0;
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

            };
            timeSpan.setRange = function(startTimestamp, endTimestamp, maxTimestamp) {
                timeSpan.updateRange(startTimestamp, endTimestamp, maxTimestamp);
            };
            timeSpan.setClosestRange = function() {

            };
            timeSpan.revertRange = function() {

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
                service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/entities',
                {
                    start: timeSpan.startTimestamp,
                    end: timeSpan.endTimestamp
                },
                {
                    'query': {
                        method: 'GET',
                        transformResponse: function(data) {return angular.fromJson(data).entities},
                        isArray: true
                    }
                },
                options
            );
        };

        service.Transmissions = function() {
            return $resource(
                service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/transmissions',
                {},
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

        service.PDUs = function(timeSpan) {
            return $resource(
                service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/pdus',
                {
                    start: timeSpan.startTimestamp,
                    end: timeSpan.startTimestamp    //timeSpan.endTimestamp
                },
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

        return service;
    }
});

