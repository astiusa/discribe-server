/*!
 * PDU type name filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

var deps = [];
return {pduTypeName: deps.concat(factory)};

function factory() {
  return function (pduType) {
    return pduType; //svcDisEnums.pduTypeName(pduType);
  };
}

});
