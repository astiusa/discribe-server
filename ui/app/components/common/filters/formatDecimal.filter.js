/*!
 * Format decimal filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {formatDecimal: deps.concat(factory)};

function factory() {
  // convert radians into latitude 90 to -90.
  return function (num, truncate) {
    return num.toFixed(truncate);
  };
}

});


