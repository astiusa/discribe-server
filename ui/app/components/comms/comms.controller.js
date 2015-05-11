/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope','svcDiscribe'];

    return {commsCtrl: deps.concat(factory)};

    function factory($scope, svcDiscribe) {
        $scope.current = svcDiscribe.state;
        $scope.discribe = {
            pduStats: svcDiscribe.PduStats(),
            transmissions:[]
        };

        var transmissions = svcDiscribe.Transmissions().query(function() {
            $scope.discribe.transmissions.length = 0;
            Array.prototype.push.apply($scope.discribe.transmissions, transmissions);
        });
    }
});
