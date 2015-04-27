'use strict';
var dis = exports;

dis.VariableTransmitterParameter = function(dataView, offset, protocolVersion) {
    var recordTypes = {
        3000:dis.HaveQuickVtp
    };

    var recordType = dataView.getUint8(offset);
    var vtp = recordTypes.hasOwnProperty(recordType) ? recordTypes[recordType] : dis.UnknownVtp;

    return vtp(dataView, offset, protocolVersion);
};

