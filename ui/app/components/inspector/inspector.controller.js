/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope', '$location','$filter','svcDiscribe'];

    return {inspectorCtrl: deps.concat(factory)};

    function factory($scope, $location, $filter, svcDiscribe) {
        $scope.current = svcDiscribe.state;
        $scope.discribe = {
            pduStats: svcDiscribe.PduStats()
        };


        $scope.pduSearch = svcDiscribe.pduQuerySet('inspector');

        $scope.addSearch = function(entityId) {
            var searchName;
            var filterExpr;
            if (entityId) {
                searchName = $filter('formatEntityId')(entityId);
                filterExpr = "entityId.site=="+entityId.site+"&&"+
                    "entityId.application=="+entityId.application+"&&"+
                    "entityId.entity=="+entityId.entity;
            } else {
                searchName = "All PDUs";
                filterExpr = null;
            }

            var fields = ["header", "pduType", "pduLength", "entityId"];
            var pageSize = 100;

            var timeSpan = {
                startTimestamp: $scope.current.timeSpan.startTimestamp,
                endTimestamp: $scope.current.timeSpan.endTimestamp};

            $scope.pduSearch.add(searchName, timeSpan, filterExpr, fields, pageSize, entityId);
        };

        $scope.removeSearch = function (event, index) {
            event.preventDefault();
            event.stopPropagation();
            $scope.pduSearch.remove(index);
        };

        if ($scope.current.recordingId) {
            $scope.addSearch();
        } else {
            // No recording, force selection
            $location.path('/');
        }

        $scope.$on("$destroy", function() {
        });
    }
});
