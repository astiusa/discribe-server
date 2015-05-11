/**
 * Created by chriscooke on 4/9/15.
 */
var chai = require('chai'),
    should,
    expect,
    recording = require('../lib/recording');

should = chai.should();
expect = chai.expect;

describe('recording', function() {
    var id = '1420642699_1420650044';
    describe('query', function() {
        it('it should return a recording object', function () {
            return recording.query(id).then(function(result) {
                result.should.include.keys('id');
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryExercises', function() {
        it('it should return an array of exercises, possibly empty', function () {
            return recording.queryExercises(id).then(function(exercises) {
                expect(Array.isArray(exercises)).to.be.true;
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryPduStats', function() {
        it('it should return an array of pdu statistics, possibly empty', function () {
            return recording.queryPduStats(id, 'perHour').then(function(pduStats) {
                expect(Array.isArray(pduStats)).to.be.true;
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryEntitySummary', function() {
        it('it should return an array of entity summary pdus, possibly empty', function () {
            return recording.queryEntitySummary(id).then(function(entitySummary) {
                expect(Array.isArray(entitySummary)).to.be.true;
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryTransmissions', function() {
        it('it should return an array of transmission summary pdus, possibly empty', function () {
            return recording.queryTransmissions(id).then(function(transmissions) {
                expect(Array.isArray(transmissions)).to.be.true;
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryPdus', function() {
        it('it should return an array of pdus, possibly empty', function () {
            return recording.query(id)
                .then(function(rec) {
                    return recording.queryPdus(id, rec.firstTimestamp, rec.firstTimestamp).then(function(pdus) {
                        expect(Array.isArray(pdus)).to.be.true;
                    });
                })
                .catch(function(error) {
                    expect(error).to.be.null;
                });
        });
    });
});

