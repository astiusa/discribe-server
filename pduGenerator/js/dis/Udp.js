// This module is auto generated. Do not modify.
'use strict';

var dis = require('../disSupporting');

var body = function() {    // size: 144 bytes
    var self = {};

    self.view = function(dataView) {

        // Getter & setters
        var view = {
            get pduType() {return -1;},
            get data() {return dis.UtilityFunctions.Uint8Array.get(dataView, 0, 16);},
            set data(list) {dis.UtilityFunctions.Uint8Array.set(dataView, 0, list);}
        };

        // Helper functions
        view.asByteArray = function() {return dataView.byteArray(0, this.pduLength)};
        view.asArrayBuffer = function() {return dataView.arrayBuffer(0, this.pduLength)};

        // Field order for formatter
        view.fieldOrder = [
            'data'
        ];

        return view;
    };

    // Field properties for formatter
    self.fieldProperties = {
        data:{ offset:0, fieldSize:16, fieldType:'Uint8Array' }
    };

    return self;
};

exports.version = function(protocolVersion) {
    // protocolVersion n/a here
    return body.call(this);
};

exports.view = function(dataView, protocolVersion) {
    return exports.version(protocolVersion).view(dataView);
};

