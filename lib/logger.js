/**
 * Created by chriscooke on 4/10/15.
 */
var bunyan = require('bunyan');

var logger = module.exports;

logger.create = function(moduleName) {
    var log =  bunyan.createLogger({
        name: moduleName
    })

    return log;
}

