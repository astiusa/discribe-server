/*!
 * Format latitude filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {formatLat: deps.concat(factory)};

function factory() {
  // convert radians into latitude 90 to -90.
  return function (rad) {
    // normalize to range -2pi to 2pi
    rad = rad % (Math.PI*2);

    // convert negatives to equivalent positive angle
    if (rad < 0)
      rad = 2*Math.PI + rad;

    // restict to 0 - 180
    var rad180 = rad % (Math.PI);

    // anything above 90 is subtracted from 180
    if (rad180 > Math.PI/2)
      rad180 = Math.PI - rad180;
    // if it is greater than 180 then make negative
    if (rad > Math.PI)
      rad = -rad180;
    else
      rad = rad180;

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

