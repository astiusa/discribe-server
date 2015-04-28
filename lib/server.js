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
server.connection({host: "0.0.0.0", port: 3000});

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
            log.error(err.message);
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
                log.error(err.message);
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
            log.error(err.message);
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
                recording.entities = selfPath+"/entities";
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
                log.error(err.message);
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
        archive.queryPduStats(request.params.id, 'perHour')
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
                log.error(err.message);
                reply(boom.badRequest(err.message));
            });
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/exercises',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace("/exercises", "");
        archive.queryExercises(request.params.id)
            .then(function(exercises) {
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
                log.error(err.message);
                reply(boom.badRequest(err.message));
            });
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}/entities',
    handler: function (request, reply) {
        var selfPath = "http://"+request.info.host+request.path;
        var parentPath = selfPath.replace("/entities", "");
        archive.queryEntities(request.params.id)
            .then(function(entities) {
                //reply(buffer).type('buffer');
                reply(entities);
            })
            .catch(function(err) {
                log.error(err.message);
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
        archive.queryTransmissions(request.params.id)
            .then(function(transmissions) {
                //reply(buffer).type('buffer');
                reply(transmissions);
            })
            .catch(function(err) {
                log.error(err.message);
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

        var startTimestamp = request.url.query.hasOwnProperty('start') ? request.url.query.start : null;
        var endTimestamp = request.url.query.hasOwnProperty('end') ? request.url.query.end : null;

        archive.queryPdus(request.params.id, startTimestamp, endTimestamp)
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
                log.error(err.message);
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
        var selfPath = "http://"+request.info.host+request.path;
        archive.delete(request.params.id)
            .then(function() {
                reply(request.params.id);
            })
            .catch(function(err) {
                log.error(err.message);
                reply(boom.badRequest(err.message));
            });
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
