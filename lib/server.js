/**
 * Created by chriscooke on 4/6/15.
 */

var discribe = require('./discribe');
var recording = require('./recording');
var archive = require('./archive');
var hapi = require('hapi');
var boom = require('boom');

var log = require('./logger').create('DIScribe-server');
var server = new hapi.Server();
server.connection({port: 3000});

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
/*
server.route({
    method: 'GET',
    path: '/api/discribe/replayers/',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        discribe.queryReplayers().then(function(result) {
            var resp = {
                "href": selfPath,
                "replayers": result
            };
            reply(resp);
        })
        .catch(function(err) {
            log.error(err.stack);
            reply(boom.badRequest(err.message));
        });
    }
});
*/
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

        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace("/pdus", "");

        var start = request.url.query.hasOwnProperty('start') ? request.url.query.start : null;
        var end = request.url.query.hasOwnProperty('end') ? request.url.query.end : null;

        archive.queryPdus(request.params.id, start, end)
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

/*
server.route({
    method: 'GET',
    path: '/discribe/home/{path*}',
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
*/
try {
    server.start(function() {
        log.info('Server running at:', server.info.uri);
    });
}
catch(error) {
    log.error(error.message);
}
