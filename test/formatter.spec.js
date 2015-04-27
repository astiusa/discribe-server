/**
 * Created by chriscooke on 4/26/15.
 */
var chai = require('chai'),
    should,
    expect,
    Formatter = require('../lib/formatter');

should = chai.should();
expect = chai.expect;

describe('formatter', function() {
    describe('valid formatter', function () {
        it('it should accept valid pdu fields', function () {
            var pdu = {pduType:6, pduLength:32, entityId:{site:101, application: 9, entity:1002}, eventId:{site:101, application: 9, eventNumber:11}};
            var fields = ["pduType", "pduLength", "entityId.application", "eventId"];
            var formatter = new Formatter(fields);
            var pduValues = formatter.pduValues(pdu);
            expect(pduValues.pduType).to.equal(6);
            expect(pduValues.pduLength).to.equal(32);
            expect(pduValues['entityId.application']).to.equal(9);
            expect(pduValues.eventId.eventNumber).to.equal(11);
        });
    });
});

