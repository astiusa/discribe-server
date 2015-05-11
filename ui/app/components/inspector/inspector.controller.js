/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope','svcDiscribe'];

    return {inspectorCtrl: deps.concat(factory)};

    function factory($scope, svcDiscribe) {
        $scope.current = svcDiscribe.state;
        $scope.discribe = {
            pduStats: svcDiscribe.PduStats(),
            pdus:[]
        };

        var pdus = svcDiscribe.PDUs($scope.current.timeSpan).query(function() {
            $scope.discribe.pdus.length = 0;
            Array.prototype.push.apply($scope.discribe.pdus, pdus);
        });
    }
});
