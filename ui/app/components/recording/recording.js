/**
 * Created by chriscooke on 4/29/15.
 */

define([
    './discribe.service',
    './recording.controller',
    './exercise.controller'
], function(discribeService, recordingCtrl, exerciseCtrl) {

    'use strict';

    var module = angular.module('recording', []);

    module.service(discribeService);
    module.controller(recordingCtrl);
    module.controller(exerciseCtrl);
});

