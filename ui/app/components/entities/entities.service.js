/**
 * Created by chriscooke on 5/6/15.
 */

define([], function() {

    'use strict';

    var deps = ['$q', 'svcDiscribe'];

    return {svcEntities: deps.concat(factory)};

    function factory($q, svcDiscribe) {

        var service = {};
        
        service.ForceLevels = function() {
            var forceLevels = {};

            forceLevels.interval = 0;
            forceLevels.units = "";

            forceLevels.query = function(timeSpan) {
                var d = $q.defer();

                if (timeSpan.duration < 601) {   // < 10 mins
                    forceLevels.interval = 1;
                    forceLevels.units = "second";
                } else if (timeSpan.duration < 86401) {  // < 24 hours
                    forceLevels.interval = 60;
                    forceLevels.units = "minute";
                } else {
                    forceLevels.interval = 3600;
                    forceLevels.units = "hour";
                }

                var entitySummary = svcDiscribe.EntitySummary(timeSpan).query(function() {
                    var dataBySample = {};
                    var samples = Math.ceil(timeSpan.duration/forceLevels.interval);
                    for (var i=0; i<samples; i++) {
                        dataBySample[i] = [0,0,0,0];
                    }

                    // Update force count for each time sample, for each force
                    angular.forEach(entitySummary, function(entity){
                        var startBucket = (entity.startTime<timeSpan.startTimestamp)
                            ? 0
                            : Math.floor((entity.startTime-timeSpan.startTimestamp)/forceLevels.interval);
                        var endBucket = (entity.endTime>timeSpan.endTimestamp)
                            ? samples-1
                            : Math.floor((entity.endTime-timeSpan.startTimestamp)/forceLevels.interval);

                        for (var i=startBucket; i<endBucket; i++) {
                            dataBySample[i][entity.forceId] += 1;
                        }
                    });

                    var results = {};
                    angular.forEach(dataBySample, function(counts, bucket) {
                        var timestamp = timeSpan.startTimestamp + (bucket*forceLevels.interval);
                        results[timestamp] = counts;
                    });

                    d.resolve(results);
                });

                return d.promise;
            };

            return forceLevels;
        };
        
        return service;
    }
});
