/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    'use strict';

    var deps = ['$scope', 'svcDiscribe'];

    return {recordingCtrl: deps.concat(factory)};

    function factory($scope, svcDiscribe) {
        $scope.discribe = {recordings:[]};
        $scope.current = svcDiscribe.state;

        var recordings = svcDiscribe.Recordings().query(function() {
            $scope.discribe.recordings.length = 0;
            Array.prototype.push.apply($scope.discribe.recordings, recordings);
        });

        $scope.selectRecording = function(recording) {
            svcDiscribe.selectRecording(recording);
        };
    }
});
