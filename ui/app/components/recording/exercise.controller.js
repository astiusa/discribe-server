/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope', '$location', 'svcDiscribe'];

    return {exerciseCtrl: deps.concat(factory)};

    function factory($scope, $location, svcDiscribe) {
        $scope.current = svcDiscribe.state;
        $scope.discribe = {};
        $scope.discribe.exercises = [];
        $scope.discribe.exerciseStats = svcDiscribe.Exercises();

        $scope.selectExercise = function(exerciseId) {
            svcDiscribe.selectExercise(exerciseId);
        };

        var update = function() {
            $scope.discribe.exerciseStats.query($scope.current.timeSpan).then(function(exercises) {
                $scope.discribe.exercises.length = 0;
                Array.prototype.push.apply($scope.discribe.exercises, exercises);
            });
        };

        var _watchUpdateFirst = true;
        $scope.$watch('discribe.exerciseStats.hasUpdate', function() {
            if (_watchUpdateFirst) {
                _watchUpdateFirst = false;
                return;
            }
            update();
        });

        if (!$scope.current.recordingId) {
            // No recording, force selection
            $location.path('/');
        } else {

            update();
        }
    }
});
