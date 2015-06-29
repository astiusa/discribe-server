/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope', '$location', '$window', 'svcDiscribe'];

    return {navbarCtrl: deps.concat(factory)};

    function factory($scope, $location, $window, svcDiscribe) {
        $scope.location = {'path':""};
        $scope.discribe = svcDiscribe.state;
        $scope.changeLocation = function(page) {
            $scope.location.path = page;
            $location.path(page);
        };

        $window.onbeforeunload = function (e) {
            svcDiscribe.shutdown();
        };

        $scope.$on("$destroy", function() {
        });
    }
});

