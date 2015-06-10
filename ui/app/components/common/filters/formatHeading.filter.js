/*!
 * Format heading filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {formatHeading: deps.concat(factory)};

function factory() {
    // convert radians into latitude 90 to -90.
    return function (rad) {

        var degrees = rad/Math.PI*180;

        // format to 2 decimal places
        return degrees.toFixed(0);
    };
}

});
