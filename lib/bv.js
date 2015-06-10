/**
 * Created by chriscooke on 4/13/15.
 * ArrayBuffer DataView replacement object that uses node Buffer and maintains littleEndian within the module.
 */

'use strict';

var bv = module.exports;

var dis = require('./dis');

bv.pduViews = {
    0:dis.UnknownPdu,
    1:dis.EntityStatePdu,
    2:dis.FirePdu,
    3:dis.DetonationPdu,
    4:dis.CollisionPdu,
    5:dis.ServiceRequestPdu,
    6:dis.ResupplyOfferPdu,
    7:dis.ResupplyReceivedPdu,
    8:dis.ResupplyCancelPdu,
    9:dis.RepairCompletePdu,
    //10:dis.Repair ResponsePdu,
    11:dis.CreateEntityPdu,
    12:dis.RemoveEntityPdu,
    13:dis.StartResumePdu,
    14:dis.StopFreezePdu,
    15:dis.AcknowledgePdu,
    16:dis.ActionRequestPdu,
    17:dis.ActionResponsePdu,
    18:dis.DataQueryPdu,
    19:dis.SetDataPdu,
    20:dis.DataPdu,
    21:dis.EventReportPdu,
    22:dis.CommentPdu,
    23:dis.ElectromagneticEmissionPdu,
    24:dis.DesignatorPdu,
    25:dis.TransmitterPdu,
    26:dis.SignalPdu,
    27:dis.ReceiverPdu,
    28:dis.IffAtcNavAidsLayer1Pdu,
    //29:dis.Underwater AcousticPdu,
    //30:dis.Supplemental Emission / Entity StatePdu,
    31:dis.IntercomSignalPdu,
    //32:dis.Intercom ControlPdu,
    //33:dis.Aggregate StatePdu,
    //34:dis.IsGroupOfPdu,
    //35:dis.Transfer ControlPdu,
    //36:dis.IsPartOfPdu,
    //37:dis.Minefield StatePdu,
    //38:dis.Minefield QueryPdu,
    //39:dis.Minefield DataPdu,
    //40:dis.Minefield Response NAKPdu,
    //41:dis.Environmental ProcessPdu,
    //42:dis.Gridded DataPdu,
    //43:dis.Point Object StatePdu,
    //44:dis.Linear Object StatePdu,
    //45:dis.Areal Object StatePdu,
    //46:dis.TSPIPdu,
    //47:dis.AppearancePdu,
    //48:dis.Articulated PartsPdu,
    //49:dis.LE FirePdu,
    55:dis.AcknowledgeRPdu,
    56:dis.ActionRequestRPdu,
    57:dis.ActionResponseRPdu,
    58:dis.DataQueryRPdu,
    59:dis.SetDataRPdu,
    60:dis.DataRPdu,
    61:dis.EventReportRPdu,
    62:dis.CommentRPdu,
    63:dis.RecordRPdu,
    64:dis.SetRecordRPdu,
    65:dis.RecordQueryRPdu,
    66:dis.CollisionElasticPdu,
    67:dis.EntityStateUpdatePdu,
    68:dis.DirectedEnergyFirePdu,
    69:dis.EntityDamageStatusPdu,
    212:dis.TransmissionSummaryPdu,
    213:dis.EntityStateSummaryPdu
};

// bufferView LE/BE function overides
var setLEBufferView = function(view) {
    view.getUint16 = function(offset) {return view.buffer.readUInt16LE(view.bufferIndex+offset);};
    view.getInt16 = function(offset) {return view.buffer.readInt16LE(view.bufferIndex+offset);};
    view.getUint32 = function(offset) {return view.buffer.readUInt32LE(view.bufferIndex+offset);};
    view.getInt32 = function(offset) {return view.buffer.readInt32LE(view.bufferIndex+offset);};
    view.getFloat32 = function(offset) {return view.buffer.readFloatLE(view.bufferIndex+offset);};
    view.getFloat64 = function(offset) {return view.buffer.readFloatLE(view.bufferIndex+offset);};
    view.getLong = function(offset) {
        var m = Math.pow(2,31);
        var data1 = view.buffer.readUInt32LE(view.bufferIndex+offset);
        var data2 = view.buffer.readUInt32LE(view.bufferIndex+offset+4);
        return data1*m + data2;
    };

    view.setUint8 = function(offset, val) {view.buffer.writeUInt8(val, view.bufferIndex+offset);};
    view.setInt8 = function(offset, val) {view.buffer.writeInt8(val, view.bufferIndex+offset);};
    view.setUint16 = function(offset, val) {view.buffer.writeUInt16LE(val, view.bufferIndex+offset);};
    view.setInt16 = function(offset, val) {view.buffer.writeInt16LE(val, view.bufferIndex+offset);};
    view.setUint32 = function(offset, val) {view.buffer.writeUInt32LE(val, view.bufferIndex+offset);};
    view.setInt32 = function(offset, val) {view.buffer.writeInt32LE(val, view.bufferIndex+offset);};
    view.setFloat32 = function(offset, val) {view.buffer.writeFloatLE(val, view.bufferIndex+offset);};
    view.setFloat64 = function(offset, val) {view.buffer.writeFloatLE(val, view.bufferIndex+offset);};
    view.setLong = function(offset, val) {
        /*
         var m = Math.pow(2,31);
         var valMs = Math.floor(val/m);
         var valLs = val;
         view.buffer.writeUInt32LE(valMs, view.bufferIndex+offset);
         view.buffer.writeUInt32LE(valLs, view.bufferIndex+offset+4);
         */
    };
};

var setBEBufferView = function(view) {
    view.getUint8 = function(offset) {return view.buffer.readUInt8(view.bufferIndex+offset);};
    view.getInt8 = function(offset) {return view.buffer.readInt8(view.bufferIndex+offset);};
    view.getUint16 = function(offset) {return view.buffer.readUInt16BE(view.bufferIndex+offset);};
    view.getInt16 = function(offset) {return view.buffer.readInt16BE(view.bufferIndex+offset);};
    view.getUint32 = function(offset) {return view.buffer.readUInt32BE(view.bufferIndex+offset);};
    view.getInt32 = function(offset) {return view.buffer.readInt32BE(view.bufferIndex+offset);};
    view.getFloat32 = function(offset) {return view.buffer.readFloatBE(view.bufferIndex+offset);};
    view.getFloat64 = function(offset) {return view.buffer.readFloatBE(view.bufferIndex+offset);};
    view.getLong = function(offset) {
        var m = Math.pow(2,31);
        var data1 = view.buffer.readUInt32BE(view.bufferIndex+offset);
        var data2 = view.buffer.readUInt32BE(view.bufferIndex+offset+4);
        return data1*m + data2;
    };

    view.setUint8 = function(offset, val) {view.buffer.writeUInt8(val, view.bufferIndex+offset);};
    view.setInt8 = function(offset, val) {view.buffer.writeInt8(val, view.bufferIndex+offset);};
    view.setUint16 = function(offset, val) {view.buffer.writeUInt16BE(val, view.bufferIndex+offset);};
    view.setInt16 = function(offset, val) {view.buffer.writeInt16BE(val, view.bufferIndex+offset);};
    view.setUint32 = function(offset, val) {view.buffer.writeUInt32BE(val, view.bufferIndex+offset);};
    view.setInt32 = function(offset, val) {view.buffer.writeInt32BE(val, view.bufferIndex+offset);};
    view.setFloat32 = function(offset, val) {view.buffer.writeFloatBE(val, view.bufferIndex+offset);};
    view.setFloat64 = function(offset, val) {view.buffer.writeFloatBE(val, view.bufferIndex+offset);};
    view.setLong = function(offset, val) {
        /*
         var m = Math.pow(2,31);
         var valMs = Math.floor(val/m);
         var valLs = val;
         view.buffer.writeUInt32BE(valMs, view.bufferIndex+offset);
         view.buffer.writeUInt32BE(valLs, view.bufferIndex+offset+4);
         */
    };
};

var BufferView = function(buffer, bufferIndex, le) {
    this.buffer = buffer;

    this.map = function(bufferIndex, le) {
        this.bufferIndex = bufferIndex;
        this.le = le;

        if (le) {
            setLEBufferView(this);
        } else {
            setBEBufferView(this);
        }

        return this;
    };

    var pduCache = {};

    this.pduView = function(pduType, protocolVersion) {
        var pdu = pduCache[pduType];
        if (!pdu) {
            pdu = {};
            pduCache[pduType] = pdu;
        }

        var view = pdu[protocolVersion];
        if (!view) {
            var version;
            if (bv.pduViews.hasOwnProperty(pduType)) {
                version = bv.pduViews[pduType].version(protocolVersion);
            } else if (pduType===-1) {
                version = dis.Udp.version(protocolVersion);
            } else {
                version = dis.UnknownPdu.version(protocolVersion);
            }
            view = version.view(this);
            pdu[protocolVersion] = view;
        }

        return view;
    };

    this.map(bufferIndex, le);
};

bv.dataView = function(buffer, bufferIndex, le) {
    return new BufferView(buffer, bufferIndex, le);
};
