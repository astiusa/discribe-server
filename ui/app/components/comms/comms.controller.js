/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope','$location','$filter', 'svcDiscribe'];

    return {commsCtrl: deps.concat(factory)};

    function factory($scope, $location, $filter, svcDiscribe) {
        $scope.current = svcDiscribe.state;
        $scope.discribe = {
            pduStats: svcDiscribe.PduStats(),
            transmissions:[]
        };

        $scope.showByEntityId = function() {
            if ($scope.current.recordingId) {
                $scope.discribe.transmissions.length = 0;
                var transmissions = svcDiscribe.Transmissions($scope.current.timeSpan).query(function () {
                    $scope.discribe.transmissions.length = 0;
                    Array.prototype.push.apply($scope.discribe.transmissions, transmissions);
                });
            }
        };

        $scope.showByFrequency = function() {
            $scope.discribe.transmissions.length = 0;
            var transmissions = svcDiscribe.Transmissions($scope.current.timeSpan).query(function() {
                $scope.discribe.transmissions.length = 0;
                Array.prototype.push.apply($scope.discribe.transmissions, transmissions);
            });
        };

        $scope.pduSearch = svcDiscribe.pduQuerySet('comms');

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
            $scope.showByEntityId();
        } else {
            // No recording, force selection
            $location.path('/');
        }

        $scope.$on("$destroy", function() {
        });
    }
});
