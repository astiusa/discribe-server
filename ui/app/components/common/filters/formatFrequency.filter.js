/*!
 * Format frequency filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {formatFrequency: deps.concat(factory)};

function factory() {
  // convert radians into latitude 90 to -90.
  return function (frequency) {
      var result;
      if (frequency===0) {
          result = "0Hz";
      } else if ((frequency % 1000000)===0) {
          result = frequency/1000000 + 'MHz'
      } else if ((frequency % 1000)===0) {
          result = frequency/1000 + 'KHz'
      } else {
          result = frequency + 'Hz'
      }

      return result;
  };
}

});

