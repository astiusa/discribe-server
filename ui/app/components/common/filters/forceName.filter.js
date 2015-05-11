/*!
 * Force Name filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {forceName: deps.concat(factory)};

function factory() {
  return function (forceId) {
    return forceId;
  };
}

});
