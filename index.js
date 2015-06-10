/**
 * Created by chriscooke on 4/4/15.
 */

'use strict';

var bv = require('./lib/bv');
var pduView = require('./lib/pduView');
var log = require('./lib/logger').create('pduTest');

var buffer = new Buffer(1000);
var bufferIndex = 0;
var st = Date.now();
var dv = bv.dataView(buffer, bufferIndex, false);
for (var i=0; i<50000; i++) {
    var pdu = dv.pduView(1, 6);
    var ccc = 1;
}
var dt = Date.now()-st;
log.info("elapsed time:"+dt);

/*
var Formatter = require('./lib/formatter');
var pdu = {pduType:6, pduLength:32, entityId:{site:101, application: 9, entity:1002}, eventId:{site:101, application: 9, eventNumber:11}};
var fields = ["pduType", "pduLength", "entityId.application", "eventId"];
var formatter = new Formatter(fields);
var pduValues = formatter.pduValues(pdu);
var c = pduValues.pduLength;
var d = pduValues['entityId.application'];
var ccc=1;

var disUtils = require('./lib/disSupporting/UtilityFunctions');
disUtils.createTestEnv();

var archive = require('./lib/archive');
var timestamp = 1420642699.515529;
var pduType = 26;
archive.queryPdus()
    */