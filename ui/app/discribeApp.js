/**
 * Created by chriscooke on 4/28/15.
 */

define(['app/config',
        'app/components/components'],
    function(config, components){
        'use strict';

        var app = angular.module('discribeApp', ['ngRoute','ngResource','ngGrid','ui.bootstrap','app.components']);

        app.config(config);
    });
