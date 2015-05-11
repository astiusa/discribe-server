/*!
 * Format DateTime filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {formatDateTime: deps.concat(factory)};

function factory() {
    return function(timestamp) {
        var dt = new Date (timestamp*1000);
        return dt.toDateString()+', '+
            dt.getHours()+':'+(dt.getMinutes()<10?'0':'') + dt.getMinutes();
    };
}

});