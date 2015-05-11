/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope','svcEntities','svcDiscribe'];

    return {entitiesCtrl: deps.concat(factory)};

    function factory($scope, svcEntities, svcDiscribe) {
        $scope.current = svcDiscribe.state;
        $scope.discribe = {};
        $scope.discribe.entitySummary = [];
        $scope.discribe.forceLevels = svcEntities.ForceLevels();

        var entitySummary = svcDiscribe.EntitySummary($scope.current.timeSpan).query(function() {
            $scope.discribe.entitySummary.length = 0;
            Array.prototype.push.apply($scope.discribe.entitySummary, entitySummary);
        });
    }
});

