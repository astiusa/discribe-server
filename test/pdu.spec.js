/**
 * Created by chriscooke on 4/21/15.
 */

'use strict';

var chai = require('chai'),
    should,
    expect,
    archive = require('../lib/archive');

should = chai.should();
expect = chai.expect;

var bv = require('../lib/bv');
var dis = require('../lib/dis');

var getPdu = function(pduName, pduType, protocolVersion, exerciseId) {
    var buffer = new Buffer(1000);
    var dv = bv.dataView(buffer, 0, false);

    var pdu = dis[pduName].version(protocolVersion).view(dv);
    pdu.pduType = pduType;
    pdu.protocolVersion = protocolVersion;
    pdu.exerciseId = exerciseId;

    return pdu;
}

describe('PDU', function() {
    describe('EntityStatePdu', function () {
        it('it should return a valid pdu', function () {
            var pdu = getPdu('EntityStatePdu', 1, 6, 9)
            pdu.should.include.keys('pduType');
        });
    });
});


