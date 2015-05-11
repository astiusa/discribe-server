/*!
 * Entity Type Id filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = [];
return {formatEntityType: deps.concat(factory)};

function factory() {
    return function (entityType) {
        var typeId;
        if (typeof entityType.subcategory==='undefined') {
            typeId = entityType.entityKind+"."+
                entityType.domain+"."+
                entityType.country+"."+
                entityType.category;
        } else {
            typeId =
                entityType.entityKind+"."+
                entityType.domain+"."+
                entityType.country+"."+
                entityType.category+"."+
                entityType.subcategory;
        }
    //entityType.spec+"."+
    //entityType.extra;

    return typeId;
    };
}

});
