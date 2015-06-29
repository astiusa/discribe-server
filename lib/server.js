/**
 * Created by chriscooke on 4/6/15.
 */

var discribe = require('./discribe');
var recording = require('./recording');
var archive = require('./archive');
var hapi = require('hapi');
var boom = require('boom');
var fs = require('fs');
var uuid = require('node-uuid');
var Q = require('q');

var log = require('./logger').create('DIScribe-server');
var server = new hapi.Server();
server.connection({host: "0.0.0.0", port: 3000});
server.app.searches = {};

server.route({
    method: 'GET',
    path: '/api/discribe/',
    handler: function (request, reply) {
        discribe.queryServers().then(function(list) {
            var selfPath = "http://"+request.info.host+request.path;
            list.unshift({"archives": selfPath+"recordings/"});
            var resp = {
                "_links": {
                    "self": selfPath
                },
                "servers": list
            };
            reply(resp);
        })
        .catch(function(err) {
            log.error(err.stack);
            reply(boom.badRequest(err.message));
        });
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace("/recordings", "");
        discribe.queryArchives()
            .then(function(recordings) {
                for (var i=0; i<recordings.length; i++) {
                    recordings[i].uri = selfPath+recordings[i].id;
                }
                var resp = {
                    "_links": {
                        "self": selfPath,
                        "parent": parentPath
                    },
                    "recordings": recordings
                };
                reply(resp);
            })
            .catch(function(err) {
                log.error(err.stack);
                reply(boom.badRequest(err.message));
            });
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace(request.params.id, "");
        archive.query(request.params.id)
            .then(function(recording) {
                recording.pduStats = selfPath+"/pduStats";
                recording.exercises = selfPath+"/exercises";
                recording.entitySummary = selfPath+"/entitySummary";
                recording.transmissions = selfPath+"/transmissions";
                recording.pdus = selfPath+"/pdus";

                var resp = {
                    "_links": {
                        "self": selfPath,
                        "parent": parentPath
                    },
                    "recording": recording
                };

                reply(resp);
            })
            .catch(function(err) {
                log.error(err.stack);
                reply(boom.badRequest(err.message));
            });
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/pduStats',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace("/pduStats", "");
        var resp = {
            "_links": {
                "self": selfPath,
                "parent": parentPath
            },
            "perSec": selfPath+"/perSec",
            "perMin": selfPath+"/perMin",
            "perHour": selfPath+"/perHour",
            "perDay": selfPath+"/perDay"
        };
        reply(resp);
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/pduStats/{sampleRate}',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace("/"+request.params.sampleRate, "");

        var start = request.url.query.hasOwnProperty('start') ? request.url.query.start : null;
        var end = request.url.query.hasOwnProperty('end') ? request.url.query.end : null;

        if (request.params.sampleRate) {
            archive.queryPduStats(request.params.id, request.params.sampleRate, start, end)
                .then(function(pduStats) {
                    var resp = {
                        "_links": {
                            "self": selfPath,
                            "parent": parentPath
                        },
                        "pduStats": pduStats
                    };
                    reply(resp);
                })
                .catch(function(err) {
                    log.error(err.stack);
                    reply(boom.badRequest(err.message));
                });
        }
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/exercises',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace("/exercises", "");

        var start = request.url.query.hasOwnProperty('start') ? request.url.query.start : null;
        var end = request.url.query.hasOwnProperty('end') ? request.url.query.end : null;

        archive.queryExercises(request.params.id, start, end)
            .then(function(exercises) {
                // construct id, add duration, remove ip to minimise data size
                for (var i=0; i<exercises.length; i++) {
                    exercises[i].id = exercises[i].exercise+'_'+exercises[i].port+'_'+exercises[i].start;
                    exercises[i].duration = exercises[i].end - exercises[i].start;
                    delete exercises[i]['ips'];
                }
                var resp = {
                    "_links": {
                        "self": selfPath,
                        "parent": parentPath
                    },
                    "exercises": exercises
                };
                reply(resp);
            })
            .catch(function(err) {
                log.error(err.stack);
                reply(boom.badRequest(err.message));
            });
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/entitySummary',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace("/entitySummary", "");

        var start = request.url.query.hasOwnProperty('start') ? request.url.query.start : null;
        var end = request.url.query.hasOwnProperty('end') ? request.url.query.end : null;

        archive.queryEntitySummary(request.params.id, start, end)
            .then(function(entitySummary) {
                for (var i=0; i<entitySummary.length; i++) {
                    entitySummary[i].startTime = entitySummary[i].header.timestamp;
                    entitySummary[i].endTime = entitySummary[i].endTimestampSeconds + (entitySummary[i].endTimestampMSeconds*0.000001);
                    entitySummary[i].duration = entitySummary[i].endTime - entitySummary[i].startTime;
                    delete entitySummary[i]['header'];
                    delete entitySummary[i]['endTimestampSeconds'];
                    delete entitySummary[i]['endTimestampMSeconds'];
                }
                var resp = {
                    "_links": {
                        "self": selfPath,
                        "parent": parentPath
                    },
                    "entitySummary": entitySummary
                };
                reply(resp);
            })
            .catch(function(err) {
                log.error(err.stack);
                reply(boom.badRequest(err.message));
            });
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/transmissions',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace("/transmissions", "");

        var start = request.url.query.hasOwnProperty('start') ? request.url.query.start : null;
        var end = request.url.query.hasOwnProperty('end') ? request.url.query.end : null;

        archive.queryTransmissions(request.params.id, start, end)
            .then(function(transmissions) {
                for (var i=0; i<transmissions.length; i++) {
                    transmissions[i].startTime = transmissions[i].header.timestamp;
                    transmissions[i].endTime = transmissions[i].endTimestampSeconds + (transmissions[i].endTimestampMSeconds*0.000001);
                    transmissions[i].duration = transmissions[i].endTime - transmissions[i].startTime;
                    delete transmissions[i]['header'];
                    delete transmissions[i]['endTimestampSeconds'];
                    delete transmissions[i]['endTimestampMSeconds'];
                }
                var resp = {
                    "_links": {
                        "self": selfPath,
                        "parent": parentPath
                    },
                    "transmissions": transmissions
                };
                reply(resp);
            })
            .catch(function(err) {
                log.error(err.stack);
                reply(boom.badRequest(err.message));
            });
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/pdus',
    handler: function (request, reply) {

        try {
            var selfPath = "http://"+request.info.host+request.path;
            var parentPath = selfPath.replace("/pdus", "");

            var start = request.url.query.hasOwnProperty('start') ? request.url.query.start : null;
            var end = request.url.query.hasOwnProperty('end') ? request.url.query.end : null;
            var filterExpr = request.url.query.hasOwnProperty('filter') ? decodeURIComponent(request.url.query.filter) : null;
            var fields = request.url.query.hasOwnProperty('fields') ? JSON.parse(decodeURIComponent(request.url.query.fields)) : null;
            archive.queryPdus(request.params.id, start, end, filterExpr, fields)
                .then(function(pdus) {
                    var resp = {
                        "_links": {
                            "self": selfPath,
                            "parent": parentPath
                        },
                        "pdus": pdus
                    };
                    reply(resp);
                })
                .catch(function(err) {
                    log.error(err.stack);
                    reply(boom.badRequest(err.message));
                });
        }
        catch(err) {
            log.error(err.message);
            reply(boom.badRequest(err.message));
        }
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/pdus/{pduId}',
    handler: function (request, reply) {

        try {
            var selfPath = "http://"+request.info.host+request.path;
            var parentPath = selfPath.replace(request.params.pduId, "");

            var pduId = request.params.pduId;
            var tokens = pduId.split('-');
            var startTime = tokens[2];

            var start = startTime;
            var end = startTime;
            var filterExpr = "id=='"+pduId+"'";
            var fields = request.url.query.hasOwnProperty('fields') ? JSON.parse(decodeURIComponent(request.url.query.fields)) : null;

            archive.queryPdus(request.params.id, start, end, filterExpr, ['pdu'])
                .then(function(pdus) {
                    var resp = {
                        "_links": {
                            "self": selfPath,
                            "parent": parentPath
                        },
                        "pdus": pdus
                    };
                    reply(resp);
                })
                .catch(function(err) {
                    log.error(err.stack);
                    reply(boom.badRequest(err.message));
                });
        }
        catch(err) {
            log.error(err.message);
            reply(boom.badRequest(err.message));
        }
    }
});

var PDUCache = function(searchId, pageSize) {
    /*
        Object to manage caching of PDU searches into a page structure.

        DIS PDU Searches can potentially return a result too large for the browser to handle. Creating a search query
        (POST) performs the DIS search and writes the results to a disk cache, indexed by page. The number of PDUs
        per page defaults to 100. A search ID is returned to the user to request (GET) the search results by page.
    */
    var self = this;

    self.rid = null;
    self.filter = null;
    self.fields = [];
    self.timeSpans = [];
    self.timeSpan = null;
    self.pdus = [];
    self.pageIndex = [];
    self.pageSize = pageSize ? pageSize : 100;
    self.searchId = searchId;
    self.cacheSize = 0;
    self.pduCount = 0;
    self.cancelRequest = false;
    self.searching = false;
    self.timestamp = null;

    self.filePath = "data/search_"+searchId+".txt";

    self.streamWriter = fs.createWriteStream(self.filePath);

    var readDelta = 1;
    var readInProgress = false;

    self.clear = function() {
        self.rid = null;
        self.filter = null;
        self.fields.length = 0;
        self.timeSpans.length = 0;
        self.timeSpan = null;
        self.pdus.length = 0;
        self.pageIndex.length = 0;
        self.cacheSize = 0;
        self.pduCount = 0;
        self.cancelRequest = false;
        self.searching = false;
        self.timestamp = null;
        readInProgress = false;
    };

    self.writeToCache = function() {
        readInProgress = true;
        var start = self.timeSpan.startTimestamp;
        var end = self.timeSpan.startTimestamp + readDelta - 1;
        self.timestamp = start;

        archive.queryPdus(self.rid, start, end, self.filter, self.fields)
            .then(function(pdus) {
                try {
                    // Write pdu fields to disc cache
                    for (var i=0; i<pdus.length; i++) {
                        var values = [];
                        values.push(pdus[i].id);    // PDU ID is mandatory
                        for (var j=0; j<self.fields.length; j++) {
                            values.push(pdus[i][self.fields[j]]);
                        }
                        self.pdus.push(values);
                        if (self.pdus.length===self.pageSize) {
                            var s = JSON.stringify(self.pdus);
                            self.pageIndex.push([self.cacheSize, s.length, self.pdus.length]);
                            self.cacheSize += s.length;
                            self.pduCount += self.pdus.length;
                            self.streamWriter.write(s);
                            self.pdus.length = 0;
                        }
                    }
                    self.timeSpan.startTimestamp = self.timeSpan.startTimestamp + readDelta;
                    readInProgress = false;
                }
                catch(err) {
                    log.error(err.message);
                }
            });
    };

    self.flushCache = function() {
        try {
            var s = JSON.stringify(self.pdus);
            self.pageIndex.push([self.cacheSize, s.length, self.pdus.length]);
            self.cacheSize += s.length;
            self.pduCount += self.pdus.length;
            self.streamWriter.write(s);
            self.pdus.length = 0;
        }
        catch(err) {
            log.error(err.message);
        }
    };

    var monitorQ = function() {
        if (!readInProgress) {
            if (self.cancelRequest) {
                self.clear();
            } else if (self.timeSpan) {
                if (self.timeSpan.startTimestamp <= self.timeSpan.endTimestamp) {
                    self.writeToCache();
                } else {
                    self.timeSpan = null;
                }
            } else if (self.timeSpans.length > 0) {
                self.timeSpan = self.timeSpans.shift();
            } else if (self.pdus.length>0) {
                self.flushCache();
            } else {
                self.searching = false;
            }
        }

        if (self.searching) {
            setTimeout(function() {
                monitorQ();
            }, 250);
        }
    };

    self.fill = function(rid, timeSpan, filter, fields) {
        self.rid = rid;
        self.filter = filter;
        self.fields.length = 0;
        if (fields) {
            Array.prototype.push.apply(self.fields, fields);
        }
        if (Array.isArray(timeSpan)) {
            Array.prototype.push.apply(self.timeSpans, timeSpan);
        } else {
            self.timeSpans.push(timeSpan);
        }

        self.searching = true;

        monitorQ();
    };

    self.query = function(page) {
        var d = Q.defer();

        if (page > 0 && page <= self.pageIndex.length) {
            var position = self.pageIndex[page-1][0];
            var bytes = self.pageIndex[page-1][1];
            var str = "";
            var streamReader = fs.createReadStream(self.filePath, {start: position, end: position+bytes-1});
            var index = 0;

            streamReader.on('data', function(data){
                str+=data;
            });

            streamReader.on('error', function(err){
                d.reject(err);
            });

            streamReader.on('end', function(){
                var test = str.substr(str.length-10, str.length-1);
                var values = JSON.parse(str);
                var pdus = [];
                // Add field names to values
                for (var i=0; i<values.length; i++) {
                    var pdu = {"id": values[i][0]};   // PDU ID is always first
                    for (var j=0; j<self.fields.length; j++) {
                        pdu[self.fields[j]] = values[i][j+1];
                    }
                    pdus.push(pdu);
                }
                d.resolve(pdus);
            });

        } else {
            d.reject(new Error ("Page is out of bounds"));
        }

        return d.promise;
    };

    self.cancel = function() {
        self.cancelRequest = true;
    };
};

server.route({
    method: 'POST',
    path: '/api/discribe/recordings/{id}/searches',
    handler: function (request, reply) {

        try {
            var start = request.payload.hasOwnProperty('start') ? request.payload.start : null;
            var end = request.payload.hasOwnProperty('end') ? request.payload.end : null;
            var filter = request.payload.hasOwnProperty('filter') ? decodeURIComponent(request.payload.filter) : null;
            var fields = request.payload.hasOwnProperty('fields') ? JSON.parse(decodeURIComponent(request.payload.fields)) : null;
            var entityId = request.payload.hasOwnProperty('entityId') ? JSON.parse(decodeURIComponent(request.payload.entityId)) : null;
            var searchId = request.payload.hasOwnProperty('searchId') ? request.payload.searchId : uuid.v4();
            var pageSize = request.payload.hasOwnProperty('pageSize') ? request.payload.pageSize : null;
            var pduCache = server.app.searches[searchId];
            if (!pduCache) {
                pduCache = new PDUCache(searchId, pageSize);
                server.app.searches[searchId] = pduCache;
            } else {
                pduCache.clear();
            }

            if (entityId) {
                // Use entity summary to narrow the slices of the PCAP file to be searched.
                archive.queryEntitySummary(request.params.id, start, end)
                    .then(function(entitySummary) {
                    var timeSpans = [];
                    for(var i=0; i<entitySummary.length; i++) {
                        if (
                            entitySummary[i].entityId.site===entityId.site &&
                            entitySummary[i].entityId.application===entityId.application &&
                            entitySummary[i].entityId.entity===entityId.entity) {
                            // Can be multiple entity spans, so include all
                            var startTime = parseFloat(entitySummary[i].header.timestamp);
                            var endTime = parseFloat(entitySummary[i].endTimestampSeconds + (entitySummary[i].endTimestampMSeconds*0.000001));
                            timeSpans.push({startTimestamp: startTime, endTimestamp: endTime});
                        }
                    };

                    timeSpans.sort(function (a, b) {
                        return a.startTimestamp > b.startTimestamp ? 1 : a.startTimestamp < b.startTimestamp ? -1 : 0;
                    });

                    pduCache.fill(request.params.id, timeSpans, filter, fields);
                });
            } else {
                var timeSpan = {startTimestamp: parseInt(start), endTimestamp: parseInt(end)};
                pduCache.fill(request.params.id, timeSpan, filter, fields);
            }
            var resp = {sid: searchId};
            reply(resp);
        }
        catch(err) {
            log.error(err.message);
            reply(boom.badRequest(err.message));
        }
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/searches/{searchId}',
    handler: function (request, reply) {

        try {
            var selfPath = "http://"+request.info.host+request.path;
            var parentPath = selfPath.substring(0, selfPath.lastIndexOf('/'));

            var page = request.url.query.hasOwnProperty('page') ? parseInt(request.url.query.page) : 1;
            var pduCache = server.app.searches[request.params.searchId];
            if (pduCache) {
                var resp = {
                    "_links": {
                        "self": selfPath,
                        "parent": parentPath
                    },
                    status: {
                        "pduCount": pduCache.pduCount,
                        "pageCount": pduCache.pageIndex.length,
                        "timestamp": pduCache.timestamp,
                        "searching": pduCache.searching
                    }
                };
                reply(resp);
            } else {
                throw (new Error("Invalid or unknown search ID"))
            }
        }
        catch(err) {
            log.error(err.message);
            reply(boom.badRequest(err.message));
        }
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/searches/{searchId}/{page}',
    handler: function (request, reply) {

        try {
            var selfPath = "http://"+request.info.host+request.path;
            var parentPath = selfPath.substring(0, selfPath.lastIndexOf('/'));

            var page = parseInt(request.params.page);
            var pduCache = server.app.searches[request.params.searchId];
            if (!pduCache) {
                throw (new Error("Invalid or unknown search ID"));
            } else {
                pduCache.query(page)
                    .then(function(pdus) {
                        var resp = {
                            "_links": {
                                "self": selfPath,
                                "parent": parentPath
                            },
                            "pdus": pdus
                        };
                        if (page>1) {
                            resp._links.prev = parentPath + "/"+(page-1);
                        }
                        if (page<pduCache.pageIndex.length) {
                            resp._links.next = parentPath + "/"+(page+1);
                        }
                        reply(resp);
                    })
                    .catch(function(err) {
                        log.error(err.stack);
                        reply(boom.badRequest(err.message));
                    });
            }
        }
        catch(err) {
            log.error(err.message);
            reply(boom.badRequest(err.message));
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/api/discribe/recordings/{id}/searches/{searchId}',
    handler: function (request, reply) {
        try {
            var pduCache = server.app.searches[request.params.searchId];
            if (pduCache) {
                fs.unlinkSync(pduCache.filePath);
                delete server.app.searches[request.params.searchId];
            } else {
                throw (new Error("Invalid or unknown search ID"))
            }
            var resp = {sid: request.params.searchId};
            reply(resp);
        }
        catch(err) {
            log.error(err.message);
            reply(boom.badRequest(err.message));
        }
    }
});

server.route({
    method: 'PUT',
    path: '/api/discribe/recordings/{id}',
    handler: function (request, reply) {
        if (request.params.id) {
            reply('put id='+request.params.id);
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/api/discribe/recordings/{id}',
    handler: function (request, reply) {
        archive.delete(request.params.id)
            .then(function() {
                reply(request.params.id);
            })
            .catch(function(err) {
                log.error(err.stack);
                reply(boom.badRequest(err.message));
            });
    }
});

server.route({
    method: 'GET',
    path: '/discribe/{path*}',
    handler: {
        directory: {
            path: 'ui',
            listing: false,
            index: true
        }
        //handler: {
        //file: './ui/index.html'
    }
});

try {
    server.start(function() {
        log.info('Server running at:', server.info.uri);
    });
}
catch(error) {
    log.error(error.message);
}
