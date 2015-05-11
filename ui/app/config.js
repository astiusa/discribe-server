/**
 * Created by chriscooke on 4/28/15.
 */

define([],function(){
    'use strict';

    function config($routeProvider) {
        $routeProvider
            .when('/recordings', {templateUrl: 'views/recordings.html', controller: 'recordingCtrl'})
            .when('/exercises', {templateUrl: 'views/exercises.html', controller: 'exerciseCtrl'})
            .when('/inspector', {templateUrl: 'views/inspector.html', controller: 'inspectorCtrl'})
            .when('/entities', {templateUrl: 'views/entities.html', controller: 'entitiesCtrl'})
            .when('/comms', {templateUrl: 'views/comms.html', controller: 'commsCtrl'})
            .otherwise({redirectTo: '/recordings'});
    }

    config.$inject=['$routeProvider'];

    return config;
});
