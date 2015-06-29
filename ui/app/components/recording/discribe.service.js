/**
 * Created by chriscooke on 4/29/15.
 */

define(['bower_components/d3/d3.min'], function(d3) {

    'use strict';

    var deps = ['$resource', '$http', '$q', '$timeout', '$filter'];

    return {svcDiscribe: deps.concat(factory)};

    function factory($resource, $http, $q, $timeout, $filter) {
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
            timeSpan: service.TimeSpan(),
            queries: {}
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

        service.getSearchStatus = function(sid) {
            var d = $q.defer();
            try {
                var url = service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/searches/'+sid;
                $http.get(url)
                    .success(function (data) {
                        d.resolve(data.status);
                    })
                    .error(function (data, status) {
                        d.reject(new Error("Failed to get search status: "+ status));
                    });
            }
            catch (err) {
                d.reject(err);
            }
            return d.promise;
        };

        service.searchResults = function(sid, page) {
            var d = $q.defer();
            try {
                var url = service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/searches/'+sid+"/"+page;
                $http.get(url)
                    .success(function (data) {
                        d.resolve(data.pdus);
                    })
                    .error(function (data, status) {
                        d.reject(new Error("Failed to get search results: "+ status));
                    });
            }
            catch (err) {
                d.reject(err);
            }
            return d.promise;
        };

        service.removeSearch = function(sid) {
            var d = $q.defer();
            try {
                var url = service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/searches/'+sid;
                $http.delete(url)
                    .success(function (data) {
                        d.resolve(data.sid);
                    })
                    .error(function (data, status) {
                        d.reject(new Error("Failed to delete search: "+ status));
                    });
            }
            catch (err) {
                d.reject(err);
            }
            return d.promise;
        };

        var PduQueries = function(name) {
            /* Collection of PduQueries */
            var self = this;

            self.name = name;
            self.views = [];
            var _views = {};

            self.add = function(searchName, timeSpan, filterExpr, fields, pageSize, entityId) {
                if (!_views.hasOwnProperty(searchName)) {
                    service.queryPdus(timeSpan, filterExpr, fields, pageSize, entityId).then(function(pduQuery) {
                        var view = {name: searchName, query: pduQuery};
                        _views[searchName] = view;
                        self.views.push(view);
                    });
                }
            };

            self.remove = function(index) {
                var pduSearch = _views[self.views[index].name].query;
                pduSearch.delete();
                delete _views[self.views[index].name];
                self.views.splice(index, 1);
            };
        };

        var _pduQueries = {};
        service.pduQueries = function (name) {
            var queries = _pduQueries[name];
            if (!queries) {
                queries = new PduQueries(name);
                _pduQueries[name] = queries;
            }
            return queries;
        };

        var PduQuery = function(sid, pageSize) {
            /* Query object that manages a server side PDU search cache. On starting a search query, search status is
               polled until the search has completed, which may take some time. Search status returns current
               search metrics, including the count of pdus that match the search criteria and available pages
               of results. Results are returned by querying by page.
             */
            var self = this;

            self.sid = sid;
            self.pageSize = pageSize ? pageSize : 100;
            self.pdus = [];
            self.currentPage = 1;
            self.pageCount = 0;
            self.pduCount = 0;
            self.position = 0;
            self.searching = true;
            self.hasUpdate = 0;

            self.pduView = {'fields':[], 'typeName':'', 'raw':[], 'showRaw': false};

            self.poll = function() {
                if (self.searching) {
                    service.getSearchStatus(self.sid).then(function(status) {
                        if (status.pduCount > self.pduCount && self.currentPage===status.pageCount) {
                            // Current page has changed
                            self.notifyUpdate();
                        }
                        self.searching = status.searching;
                        self.pageCount = status.pageCount;
                        self.pduCount = status.pduCount;
                        self.position = status.timestamp;
                    });
                    $timeout(function() {
                        self.poll();
                    }, 500);
                }
            };

            self.getResults = function() {
                if (self.pageCount > 0) {
                    service.searchResults(self.sid, self.currentPage).then(function(pdus) {
                        //pduArray.length = 0;
                        //Array.prototype.push.apply(pduArray, pdus);
                        self.pdus.length = 0;
                        Array.prototype.push.apply(self.pdus, pdus);
                    });
                }
            };

            self.loadPdu = function(pdu) {
                var pdus = service.PDU(pdu.id).query(function() {
                    // Should only be one ... but
                    if (pdus.length>0 && pdus[0].hasOwnProperty('pdu')) {
                        self.pduView.fields.length = 0;
                        self.pduView.raw.length = 0;
                        self.pduView.pduType = pdu.pduType;
                        self.pduView.typeName = $filter('pduTypeName')(pdu.pduType);

                        Array.prototype.push.apply(self.pduView.fields, pdus[0].pdu);
                    }
                });
            };

            self.notifyUpdate = function() {
                self.hasUpdate++;
                if (self.hasUpdate > 10) {
                    self.hasUpdate = 0;
                }
            };

            self.delete = function() {
                self.searching = false;
                service.removeSearch(self.sid)
            };

            self.searching = true;

            self.poll();
        };

        service.queryPdus = function(timeSpan, filterExpr, fields, pageSize, entityId) {
            /* Request a query of PDU's that match a specified criteria. Creates an asynchronous
               server side search cache that can be accessed by results page. Returns a PDU cache object.
             */
            var d = $q.defer();

            var params = {
                responseType: "json",
                start: timeSpan.startTimestamp,
                end: timeSpan.endTimestamp,
                pageSize: pageSize
            };

            if (filterExpr) {
                params.filter = encodeURIComponent(filterExpr);
            }
            if (fields) {
                params.fields = encodeURIComponent(JSON.stringify(fields));
            }

            if (entityId) {
                params.entityId = encodeURIComponent(JSON.stringify(entityId));
            }

            try {
                var url = service.state.server+'api/discribe/recordings/'+service.state.recordingId+'/searches';
                $http.post(url, params)
                    .success(function (data) {
                        var pduQuery = new PduQuery(data.sid, pageSize);
                        d.resolve(pduQuery);
                    })
                    .error(function (data, status) {
                        d.reject(new Error("Failed to get search object: "+ status));
                    });
            }
            catch (err) {
                d.reject(err);
            }
            return d.promise;
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

        return service;
    }
});

