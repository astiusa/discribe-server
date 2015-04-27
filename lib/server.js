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
        var hrefPath = "http://"+request.info.host+request.path;
        var resp = {
            "href": hrefPath,
            "recordings": hrefPath+"recordings/",
            "archives": hrefPath+"archives/"
        };
        reply(resp);
    }
});

server.route({
    method: 'GET',
    path: '/api/discribe/servers/',
    handler: function (request, reply) {
        var hrefPath = "http://"+request.info.host+request.path;
        discribe.queryServers().then(function(result) {
            var resp = {
                "href": hrefPath,
                "servers": result
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
        var hrefPath = "http://"+request.info.host+request.path;
        discribe.queryArchives()
            .then(function(result) {
                var resp = {
                    "href": hrefPath,
                    "recordings": result
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
    path: '/api/discribe/archives/',
    handler: function (request, reply) {
        var hrefPath = "http://"+request.info.host+request.path;
        discribe.queryArchives()
            .then(function(result) {
                var resp = {
                    "href": hrefPath,
                    "archives": result
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
    path: '/api/discribe/replayers/',
    handler: function (request, reply) {
        var hrefPath = "http://"+request.info.host+request.path;
        discribe.queryReplayers().then(function(result) {
            var resp = {
                "href": hrefPath,
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

server.route({
    method: 'GET',
    path: '/api/discribe/recordings/{id}',
    handler: function (request, reply) {
        var hrefPath = "http://"+request.info.host+request.path;
        archive.query(request.params.id)
            .then(function(result) {
                var resp = {
                    "href": hrefPath,
                    "pduStats": hrefPath+"/pduStats",
                    "exercises": hrefPath+"/exercises",
                    "entities": hrefPath+"/entities",
                    "transmissions": hrefPath+"/transmissions",
                    "pdus": hrefPath+"/pdus",
                    "recording": result
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
        var hrefPath = "http://"+request.info.host+request.path;
        archive.queryPduStats(request.params.id, 'perHour')
            .then(function(result) {
                var resp = {
                    "href": hrefPath,
                    "pduStats": result
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
        var hrefPath = "http://"+request.info.host+request.path;
        archive.queryExercises(request.params.id)
            .then(function(result) {
                var resp = {
                    "href": hrefPath,
                    "exercises": result
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
        var hrefPath = "http://"+request.info.host+request.path;
        archive.queryEntities(request.params.id)
            .then(function(buffer) {
                reply(buffer).type('buffer');
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
        var hrefPath = "http://"+request.info.host+request.path;
        archive.queryTransmissions(request.params.id)
            .then(function(buffer) {
                reply(buffer).type('buffer');
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

        var hrefPath = "http://"+request.info.host+request.path;
        var startTimestamp = request.url.query.hasOwnProperty('start') ? request.url.query.start : null;
        var endTimestamp = request.url.query.hasOwnProperty('end') ? request.url.query.end : null;

        archive.queryPdus(request.params.id, startTimestamp, endTimestamp)
            .then(function(pdus) {
                var resp = {
                    "href": hrefPath,
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
        var hrefPath = "http://"+request.info.host+request.path;
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
