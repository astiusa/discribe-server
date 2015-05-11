/**
 * Created by chriscooke on 4/29/15.
 */

define(['./navbar/navbar',
        './common/common',
        './recording/recording',
        './entities/entities',
        './comms/comms',
        './inspector/inspector'],
    function(){

        'use strict';

        angular.module('app.components', Array.prototype.slice.call(arguments, 1));

        angular.module('app.components', [
            'navbar',
            'common',
            'recording',
            'entities',
            'comms',
            'inspector'
        ]);
});

