/**
 * Created by chriscooke on 4/17/15.
 */
'use strict';

var pduView = exports;

var dis = require('./dis');
//var log = require('./logger').create('recording');

pduView.pdus = {
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

pduView.pdu2 = function(pduType, dataView, protocolVersion) {
    var pdu = dis.EntityStatePdu; //pduView.pdus[pduType];
    if (!pdu) {
        // Assign map for either Udp or unknown pdu type
        pdu = (pduType==-1) ? dis.Udp : dis.UnknownPdu;
    }

    return pdu.view(dataView, protocolVersion);
};


// pdu object cache: Each pdu version is instantiated once, on first use.

pduView.cache = {};

pduView.pdu = function(pduType, dataView, protocolVersion) {
    var pdu = pduView.cache[pduType];
    if (!pdu) {
        pdu = {};
        pduView.cache[pduType] = pdu;
    }

    var pduVersion = pdu[protocolVersion];
    if (!pduVersion) {
        if (pduView.pdus.hasOwnProperty(pduType)) {
            pduVersion = pduView.pdus[pduType].version(protocolVersion);
        } else if (pduType===-1) {
            pduVersion = dis.Udp.version(protocolVersion);
        } else {
            pduVersion = dis.UnknownPdu.version(protocolVersion);
        }
        pdu[protocolVersion] = pduVersion.view(dataView);
    }

    return pduVersion;
};
