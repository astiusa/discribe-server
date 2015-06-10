/*!
 * Format longitude filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {formatLon: deps.concat(factory)};

function factory() {
  // convert radians into longitude 180 to -180
  return function (rad) {
    // normalize to range -2pi to 2pi
    rad = rad % (Math.PI*2);
    if (rad < 0)
      rad = 2*Math.PI + rad;

    // convert negatives to equivalent positive angle
    var rad360 = rad % (Math.PI*2);

    // anything above 90 is subtracted from 360
    if (rad360 > Math.PI)
      rad360 = Math.PI*2 - rad360;

    // if it is greater than 180 then make negative
    if (rad > Math.PI)
      rad = -rad360;
    else
      rad = rad360;

    var degrees = rad/Math.PI*180;

    var nDegrees   = Math.floor(degrees);
    var minutes = (degrees - nDegrees) * 60;
    var nMinutes   = Math.floor(minutes);
    var seconds = (minutes - nMinutes) * 60;
    seconds = seconds.toFixed(3);

    if (nMinutes<10) {
      nMinutes = '0'+nMinutes;
    }
    if (seconds<10) {
      seconds = '0'+seconds;
    }

    return(nDegrees+':'+nMinutes+':'+seconds);
  };
}

});

