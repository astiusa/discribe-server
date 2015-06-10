/**
 * Created by chriscooke on 5/6/15.
 */

define([], function() {

    'use strict';

    var deps = ['$q', '$filter', 'svcDiscribe', 'svcDisEnums', 'svcMapUtils'];

    return {svcEntities: deps.concat(factory)};

    function factory($q, $filter, svcDiscribe, svcDisEnums, svcMapUtils) {

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

        service.entities = {active:[], dataId:"", positionQueue: [], position: 0};
        service._entities = {};
        service._activeEntities = {};     // Entities in play
        service.entityPosition = {};   // Entity positions by time slot

        service.reset = function() {
            service._entities = {};
            service.resetActive();
        };

        service.resetActive = function() {
            service.entities.active.length = 0;
            service._activeEntities = {};
            service.entityPosition = {};
        };

        service.processEntityStatePdu = function(pdu) {
            try {
                // Ignore munitions for now
                if (pdu.entityType.entityKind===2) {
                    return;
                }

                var entityId = pdu.entityId.site.toString()+":"+
                    pdu.entityId.application.toString()+":"+
                    pdu.entityId.entity.toString();

                var entity = service._entities[entityId];
                if (!entity) {
                    entity = {};
                    service._entities[entityId] = entity;

                    entity.entityId = entityId;
                    entity.marking = $filter('formatEntityMarking')(pdu.marking);
                    //entity.marking = pdu.marking;
                    entity.forceId = pdu.forceId;
                    entity.entityType = $filter('formatEntityType')(pdu.entityType);
                    entity.entityTypeId = $filter('formatEntityType')(pdu.entityType);
                    entity.entityKind = pdu.entityType.entityKind;

                    var icon = svcDisEnums.entityTypeIcon(
                        pdu.forceId,
                        pdu.entityType.entityKind,
                        pdu.entityType.domain,
                        pdu.entityType.country,
                        pdu.entityType.category,
                        pdu.entityType.subcategory
                    );
                    entity.mapIcon = icon[0];
                    entity.sideIcon = icon[1];
                    entity.firstTimestamp = pdu.header.timestamp;
                    entity.lastTimestamp = pdu.header.timestamp;
                    entity.M = {};
                    entity.p = {};
                } else {
                    entity.lastTimestamp = pdu.header.timestamp;
                }

                // Add entity position to time slot
                var timeTag = service.timeMarker(pdu.header.timestamp);
                var timePositions = service.entityPosition[timeTag];
                if (!timePositions) {
                    timePositions = [];
                    service.entityPosition[timeTag] = timePositions;
                }

                var m = svcMapUtils.MotionBuffer(pdu.header.timestamp,
                    pdu.entityLocation,
                    pdu.entityLinearVelocity,
                    pdu.entityOrientation,
                    pdu.deadReckoningParameters);

                timePositions.push({"entityId": entityId, "m":m});
            }
            catch(err) {
                console.log(err.message);
            }
        };

        service.updateAll = function() {
            // 'Play' all entities in position Q to display initial positions
            angular.forEach(service.entityPosition, function(positions, timestamp){
                service.update(timestamp, false);
            });
        };

        service.update = function(time, prune) {
            //svcUtils.startTimeTrace('entities.update');
            var timeTag = service.timeMarker(time);
            var timePositions = service.entityPosition[timeTag];
            var processed = {};
            if (timePositions) {
                angular.forEach(timePositions, function(position){
                    try {
                        var entity = service._activeEntities[position.entityId];
                        if (!entity) {
                            entity = service._entities[position.entityId];
                            service._activeEntities[position.entityId] = entity;
                            service.entities.active.push(entity);

                            //console.log('entity now active:'+position.entityId);
                        }

                        // Update entity with latest position
                        angular.extend(entity.M, position.m);

                        service.updatePosition(entity, time);
                        processed[position.entityId] = true;
                    }
                    catch(err) {
                        console.log(err.message);
                    }
                });

                if(prune) {
                    delete service.entityPosition[timeTag];
                }
            }

            angular.forEach(service.entities.active, function(entity){
                if (!processed.hasOwnProperty(entity.entityId))
                {
                    // Update entity via dead reckoning parameters
                    service.updatePosition(entity, time);
                }
            });
            //svcUtils.endTimeTrace('entities.update');
        };

        service.updatePosition = function(entity, time) {
            // Updates entity with new position or interpolation of last position
            try {
                var p = svcMapUtils.entityPosition(entity.M, time);

                if (p) {
                    angular.extend(entity, p)
                } else {
                    // Assume entity has timed out
                    var index = service.entities.active.indexOf(entity);
                    if (index>-1) {
                        service.entities.active.splice(index, 1);
                    }
                    delete service._activeEntities[entity.entityId];
                    //console.log('entity timed out:'+entity.entityId);
                }
            }
            catch(err) {
                console.log(err.message);
            }
        };

        service.timeMarker = function(time) {
            //return Math.max( Math.ceil(time * 10) / 10 ).toFixed(2);
            return (Math.ceil(time * 10) / 10 ).toFixed(2);
        };

        return service;
    }
});
