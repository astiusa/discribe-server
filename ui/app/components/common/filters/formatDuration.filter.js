/*!
 * formatDuration filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 */
define([], function() {

    'use strict';

    var deps = [];
    return {formatDuration: deps.concat(factory)};

    function factory() {
        return function(totalSec, pretty) {
            var days = parseInt( totalSec / 86400 );
            var hours = parseInt( (totalSec % 86400)  / 3600 );
            var minutes = parseInt( (totalSec % 3600) / 60 );
            var seconds = Math.floor(totalSec) % 60;

            var dayLabel = (days>1) ? " days " : " day  ";

            var result;

            if (pretty) {
                result = (days > 0 ? days + dayLabel : "") +
                    (hours < 10 ? "0" + hours : hours) + "hr " +
                    (minutes < 10 ? "0" + minutes : minutes) + "m " +
                    (seconds  < 10 ? "0" + seconds : seconds) + "s";
            } else {
                result = (days > 0 ? days + dayLabel : "") +
                    (hours < 10 ? "0" + hours : hours) + ":" +
                    (minutes < 10 ? "0" + minutes : minutes) + ":" +
                    (seconds  < 10 ? "0" + seconds : seconds);
            }

            return result;
        };
    }
});

