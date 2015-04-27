/**
 * Created by chriscooke on 4/9/15.
 */
var chai = require('chai'),
    should,
    expect,
    discribe = require('../lib/discribe');

should = chai.should();
expect = chai.expect;

describe('discribe', function() {
    describe('queryServers', function() {
        it('it should return a list of servers, possibly empty', function () {
            return discribe.queryServers().then(function(servers) {
                expect(Array.isArray(servers)).to.be.true;
            });
        });
    });

    describe('queryRecordings', function() {
        it('it should return a list of recordings, possibly empty', function () {
            return discribe.queryArchives().then(function(recordings) {
                expect(Array.isArray(recordings)).to.be.true;
            });
        });
    });

    describe('queryArchives', function() {
        it('it should return a list of recordings, possibly empty', function () {
            return discribe.queryArchives().then(function(archives) {
                expect(Array.isArray(archives)).to.be.true;
            });
        });
    });

    describe('queryReplayers', function() {
        it('it should return a list of replayers, possibly empty', function () {
            return discribe.queryReplayers().then(function(replayers) {
                expect(Array.isArray(replayers)).to.be.true;
            });
        });
    });
});

