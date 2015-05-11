/*!
 * Entity Marking String filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {formatEntityMarking: deps.concat(factory)};

function factory() {
  return function(entityMarking) {
      var i;
      var result = entityMarking.characters; //"";
      //for (i = 0; i < entityMarking.characters.length; i++) {
      //    result += String.fromCharCode(entityMarking.characters[i]);
      //}
      return result;
  };
}

});
