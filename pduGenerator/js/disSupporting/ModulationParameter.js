'use strict';
var dis = exports;

dis.ModulationParameter = function(dataView, offset, protocolVersion) {
    var recordTypes = {
        3000:dis.HaveQuickMp
    };

    var recordType = dataView.getUint8(offset);
    if (!recordTypes.hasOwnProperty(recordType)) {
        console.log('Unsupported Variable Transmitter Parameter record type: '+recordType);
        return null;  // recordType not supported
    }

    var mp = recordTypes[recordType];

    return mp(dataView, offset, protocolVersion);
};


