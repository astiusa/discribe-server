'use strict';
var dis = exports;

dis.VariableParameter = function(dataView, offset, protocolVersion) {

    var recordTypes = {
        0:dis.ArticulatedPart,
        1:dis.AttachedPart
    };

    var recordType = dataView.getUint8(offset);
    if (!recordTypes.hasOwnProperty(recordType)) {
        console.log('Unsupported variable Parameter record type: '+recordType);
        return null;  // recordType not supported
    }

    var _variableParameter = recordTypes[recordType];

    return _variableParameter(dataView, offset, protocolVersion);
};

