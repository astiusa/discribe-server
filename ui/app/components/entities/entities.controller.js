/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope','$location','$filter','svcEntities','svcDiscribe'];

    return {entitiesCtrl: deps.concat(factory)};

    function factory($scope, $location, $filter, svcEntities, svcDiscribe) {
        $scope.current = svcDiscribe.state;
        $scope.discribe = svcEntities.state;

        $scope.discribe.forceLevels = svcEntities.ForceLevels();

        $scope.showSummary = function() {
            if ($scope.current.recordingId) {
                $scope.discribe.entitySummary.length = 0;
                $scope.discribe.positions.length = 0;
                var entitySummary = svcDiscribe.EntitySummary($scope.current.timeSpan).query(function() {
                    Array.prototype.push.apply($scope.discribe.entitySummary, entitySummary);
                });
            }
        };

        $scope.showPositions = function() {
            $scope.discribe.entitySummary.length = 0;
            $scope.discribe.positions.length = 0;
            var timeSpan = {
                startTimestamp: $scope.current.timeSpan.startTimestamp,
                lastTimeStamp: $scope.current.timeSpan.startTimestamp};
            var filterExpr = "pduType=1";
            var fields = [
                "header",
                "entityId",
                "forceId",
                "entityType",
                "marking",
                "entityLocation",
                "entityLinearVelocity",
                "entityOrientation",
                "deadReckoningParameters"
            ];
            var entityPdus = svcDiscribe.PDUs(timeSpan, filterExpr, fields).query(function() {
                angular.forEach(entityPdus, function(pdu) {
                    svcEntities.processEntityStatePdu(pdu);
                });
                svcEntities.updateAll();

                Array.prototype.push.apply($scope.discribe.positions, svcEntities.entities.active);
            });
        };

        $scope.showMap = function() {
            $scope.discribe.entitySummary.length = 0;
            $scope.discribe.positions.length = 0;
            var entitySummary = svcDiscribe.EntitySummary($scope.current.timeSpan).query(function() {
                Array.prototype.push.apply($scope.discribe.entitySummary, entitySummary);
            });
        };

        $scope.pduSearch = svcDiscribe.pduQueries('entities');

        $scope.addSearch = function(entityId) {
            var searchName = $filter('formatEntityId')(entityId);

            var timeSpan = {
                startTimestamp: $scope.current.timeSpan.startTimestamp,
                endTimestamp: $scope.current.timeSpan.endTimestamp};
            var filterExpr = "entityId.site=="+entityId.site+"&&"+
                "entityId.application=="+entityId.application+"&&"+
                "entityId.entity=="+entityId.entity;
            var fields = ["header", "pduType", "pduLength", "entityId"];
            var pageSize = 100;

            $scope.pduSearch.add(searchName, timeSpan, filterExpr, fields, pageSize, entityId);
        };

        $scope.removeSearch = function (event, index) {
            event.preventDefault();
            event.stopPropagation();
            $scope.pduSearch.remove(index);
        };

        if ($scope.current.recordingId) {
            $scope.showSummary();
        } else {
            // No recording, force selection
            $location.path('/');
        }
    }
});

