/**
 * Created by chriscooke on 4/9/15.
 */
var chai = require('chai'),
    should,
    expect,
    archive = require('../lib/archive');

should = chai.should();
expect = chai.expect;

describe('archive', function() {
    var id = '1420642699_1420650044';
    describe('query', function() {
        it('it should return a archive object', function () {
            return archive.query(id).then(function(archive) {
                archive.should.include.keys('id');
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryExercises', function() {
        it('it should return a list of exercises, possibly empty', function () {
            return archive.queryExercises(id).then(function(exercises) {
                expect(Array.isArray(exercises)).to.be.true;
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryPduStats', function() {
        it('it should return a pdu statistics object', function () {
            return archive.queryPduStats(id, 'perHour').then(function(pduStats) {
                expect(Array.isArray(pduStats)).to.be.true;
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryEntities', function() {
        it('it should return a buffer of entity summary pdus', function () {
            return archive.queryEntities(id).then(function(entities) {
                expect(entities).to.be.an.instanceof(Buffer);
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryTransmissions', function() {
        it('it should return a buffer transmission summary pdus', function () {
            return archive.queryTransmissions(id).then(function(transmissions) {
                expect(transmissions).to.be.an.instanceof(Buffer);
            })
            .catch(function(error) {
                expect(error).to.be.null;
            });
        });
    });

    describe('queryPdus', function() {
        it('it should return an array of pdus', function () {
            return archive.query(id)
                .then(function(rec) {
                    return archive.queryPdus(id, rec.startTimestamp, rec.startTimestamp).then(function(pdus) {
                        expect(Array.isArray(pdus)).to.be.true;
                    })
                    .catch(function(error) {
                        expect(error).to.be.null;
                    });
                });
        });
    });
/*
    describe('delete', function() {
        it('it should delete a archive and return the archive id', function () {
            return archive.delete(id).then(function(deletedId) {
                expect(deletedId).to.equal(id);
            });
        });
    });
    */
});

