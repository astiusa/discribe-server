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
            return recording.query(id).then(function(recording) {
                recording.should.include.keys('id');
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryExercises', function() {
        it('it should return a list of exercises, possibly empty', function () {
            return recording.queryExercises(id).then(function(exercises) {
                expect(Array.isArray(exercises)).to.be.true;
            });
        });
    });

    describe('queryPduStats', function() {
        it('it should return a pdu statistics object', function () {
            return recording.queryPduStats(id, 'perHour').then(function(pduStats) {
                expect(Array.isArray(pduStats)).to.be.true;
            });
        });
    });

    describe('queryEntities', function() {
        it('it should return a buffer of entity summary pdus', function () {
            return recording.queryEntities(id).then(function(entities) {
                expect(entities).to.be.an.instanceof(Buffer);
            });
        });
    });

    describe('queryTransmissions', function() {
        it('it should return a buffer transmission summary pdus', function () {
            return recording.queryTransmissions(id).then(function(transmissions) {
                expect(transmissions).to.be.an.instanceof(Buffer);
            });
        });
    });

    describe('queryPdus', function() {
        it('it should return a buffer of pdus', function () {
            return recording.query(id)
                .then(function(rec) {
                    return recording.queryPdus(id, rec.firstTimestamp, rec.firstTimestamp).then(function(pdus) {
                        expect(Array.isArray(pdus)).to.be.true;
                    });
                });
        });
    });
});

