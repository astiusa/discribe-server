'use strict';
var dis = exports;

dis.DescriptorRecord = function(dataView, offset) {
    var entityDescriptors = {
        0:dis.MunitionsType,
        1:dis.ExpendableType,
        2:dis.ExplodingObject
    };

    var entityType = dataView.getUint8(offset);
    if (!entityDescriptors.hasOwnProperty(entityType)) {
        console.log('Unsupported entity record type: '+entityType);
        return null;  // entityType not supported
    }

    var entityDescriptor = entityDescriptors[entityType];

    return entityDescriptor(dataView, offset);
};


