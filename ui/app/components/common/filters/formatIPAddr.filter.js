/*!
 * formatIp filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 */
define([], function() {

    'use strict';

    var deps = [];
    return {formatIPAddr: deps.concat(factory)};

    function factory() {
        return function(num) {
            var ipAddr = num%256;
            for (var i = 3; i > 0; i--) {
                num = Math.floor(num/256);
                ipAddr = num%256 + '.' + ipAddr;}

            return ipAddr;
        };
    }
});

