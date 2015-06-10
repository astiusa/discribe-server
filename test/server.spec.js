/**
 * Created by chriscooke on 5/18/15.
 */

var chai = require('chai'),
    should,
    expect,
    request = require('supertest');

should = chai.should();
expect = chai.expect;

describe('server', function() {
    var url = 'http://localhost:3000';
    var id = '1420642699_1420650044';

    describe('/recordings', function() {
        it('should return a list of recordings', function (done) {
            request(url)
                .get('/api/discribe/recordings/')
                .end(function (err, resp) {
                    expect(err).to.be.null;
                    resp.status.should.equal(200);
                    resp.body.should.include.keys('recordings');
                    expect(Array.isArray(resp.body.recordings)).to.be.true;
                    done();
                });
        });
    });

    describe('/recordings/[id]/pdus', function() {
        it('it should return an array of pdus, possibly empty', function (done) {
            request(url)
                .get('/api/discribe/recordings/'+id+'/pdus')
                .end(function (err, resp) {
                    expect(err).to.be.null;
                    resp.status.should.equal(200);
                    resp.body.should.include.keys('pdus');
                    expect(Array.isArray(resp.body.pdus)).to.be.true;
                    done();
                });
        });
    });

    describe('/recordings/[id]/exercises', function() {
        it('it should return an array of exercises, possibly empty', function (done) {
            request(url)
                .get('/api/discribe/recordings/'+id+'/exercises')
                .end(function (err, resp) {
                    expect(err).to.be.null;
                    resp.status.should.equal(200);
                    resp.body.should.include.keys('exercises');
                    expect(Array.isArray(resp.body.exercises)).to.be.true;
                    done();
                });
        });
    });

    describe('/recordings/[id]/pduStats/perMin', function() {
        it('it should return an array of pdu statistics, possibly empty', function (done) {
            request(url)
                .get('/api/discribe/recordings/'+id+'/pduStats/perMin')
                .end(function (err, resp) {
                    expect(err).to.be.null;
                    resp.status.should.equal(200);
                    resp.body.should.include.keys('pduStats');
                    expect(Array.isArray(resp.body.pduStats)).to.be.true;
                    done();
                });
        });
    });

    describe('/recordings/[id]/entitySummary', function() {
        it('it should return an array of entity summary pdus, possibly empty', function (done) {
            request(url)
                .get('/api/discribe/recordings/'+id+'/entitySummary')
                .end(function (err, resp) {
                    expect(err).to.be.null;
                    resp.status.should.equal(200);
                    resp.body.should.include.keys('entitySummary');
                    expect(Array.isArray(resp.body.entitySummary)).to.be.true;
                    done();
                });
        });
    });

    describe('/recordings/[id]transmissions', function() {
        it('it should return an array of transmission summary pdus, possibly empty', function (done) {
            request(url)
                .get('/api/discribe/recordings/'+id+'/transmissions')
                .end(function (err, resp) {
                    expect(err).to.be.null;
                    resp.status.should.equal(200);
                    resp.body.should.include.keys('transmissions');
                    expect(Array.isArray(resp.body.transmissions)).to.be.true;
                    done();
                });
        });
    });
});
