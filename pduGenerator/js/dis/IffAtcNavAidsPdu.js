// This module is auto generated. Do not modify.
'use strict';
var dis = dis || {};

dis.IffAtcNavAidsPdu = function(dataView, protocolVersion)
{
    var pduLength = dataView.getUint16(8);

    if (pduLength===60) {
        return dis.IffAtcNavAidsLayer1Pdu(dataView, protocolVersion);
    } else{
        return dis.IffAtcNavAidsLayer2Pdu(dataView, protocolVersion);
    }
};
