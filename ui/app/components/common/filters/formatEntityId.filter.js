/*!
 * EntityId filter.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 */
define([], function() {

    'use strict';

    var deps = [];
    return {formatEntityId: deps.concat(factory)};

    function factory() {
        return function (entityId) {
            if (!entityId) {
                return "";
            }

            return entityId.site+":"+
                entityId.application+":"+
                entityId.entity;
        };
    }
});

