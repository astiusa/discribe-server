/**
 * Created by chriscooke on 4/22/15.
 */
'use strict';

// Constructor
function Formatter(fields) {
    this.fields = [];
    this.pduFields = [];
    this.isValid = false;
    this.validate(fields);
}

// class methods
Formatter.prototype.pduValues = function(pdu) {
    var fieldValues = {};

    try {
        for (var i=0; i<this.pduFields.length; i++) {
            if (pdu.hasOwnProperty(this.pduFields[i])) {
                var evalString = 'pdu.'+this.fields[i];
                fieldValues[this.fields[i]] = eval(evalString);
            }
        }
    }
    catch(err) {
        //result = false;
        var ccc = 1;
    }

    return fieldValues;
};

Formatter.prototype.validate = function(fields) {
    this.isValid = true;
    this.fields.length = 0;

    try {
        for (var i=0; i<fields.length; i++) {
            this.fields.push(fields[i]);

            // if field is multi depth (entityId.application) need to isolate pdu field for validation
            this.pduFields.push(fields[i].split(".")[0]);
        }
    }
    catch(err) {
        this.isValid = false;
    }

    return (this.isValid);
};

module.exports = Formatter;
