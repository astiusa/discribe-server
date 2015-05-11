/**
 * Created by chriscooke on 4/29/15.
 */

define([
    './entities.controller',
    './entities.service'
], function(entitiesCtrl, entitiesService) {

    'use strict';

    var module = angular.module('entities', []);

    module.controller(entitiesCtrl);
    module.service(entitiesService);
});
