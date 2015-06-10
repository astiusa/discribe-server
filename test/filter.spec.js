/**
 * Created by chriscooke on 4/23/15.
 */
var chai = require('chai'),
    should,
    expect,
    dis = require('../lib/dis'),
    bv = require('../lib/bv'),
    Filter = require('../lib/filter');

should = chai.should();
expect = chai.expect;

describe('filter', function() {
    describe('valid expression', function () {
        it('it should accept a valid expression', function () {
            new Filter("pduType>6").isValid.should.equal(true);
            new Filter("pduType>=6").isValid.should.equal(true);
            new Filter("pduType==6").isValid.should.equal(true);
            new Filter("pduType=6").isValid.should.equal(true);
            new Filter("pduType<6").isValid.should.equal(true);
            new Filter("pduType<=6").isValid.should.equal(true);
        });
        it('it should not accept an invalid expression', function () {
            new Filter("pduTypexxx6").isValid.should.equal(false);
            new Filter("pduType=<6").isValid.should.equal(false);
            new Filter("pduType=>6").isValid.should.equal(false);
            new Filter("pduType>>6").isValid.should.equal(false);
        });
    });
    describe('filter pass/reject', function () {
        var pdu = {};
        pdu.pduType = 1;
        pdu.exerciseId = 3;
        pdu.forceId = 2;

        var filter = new Filter();
        it('it should pass a pdu that matches the filter expression', function () {
        });
        it('it should reject a pdu that does not match the filter expression', function () {
        });
    });
});

