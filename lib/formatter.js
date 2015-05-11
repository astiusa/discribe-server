/**
 * Created by chriscooke on 4/22/15.
 */
'use strict';

// Constructor
function Formatter(fields) {
    this.fields = [];
    this.isValid = false;
    this.add(fields);
}

var getFieldValue = function(fieldValue) {
    if (typeof fieldValue==='object') {
        if (fieldValue.hasOwnProperty('fieldOrder')) {  // DIS object
            var fieldValues = {};
            for (var i=0; i<fieldValue.fieldOrder.length; i++) {
                fieldValues[fieldValue.fieldOrder[i]] = getFieldValue(fieldValue[fieldValue.fieldOrder[i]]);
            }
            return fieldValues;
        } else {
            return fieldValue;
        }
    } else {
        return fieldValue;
    }
};

// class methods
Formatter.prototype.pduValues = function(pdu) {
    var fieldValues = {};

    for (var i=0; i<this.fields.length; i++) {
        if (pdu.hasOwnProperty(this.fields[i].pduField)) {
            var fieldValue = (this.fields[i].isPduField)
                ? pdu[this.fields[i].pduField]
                : eval('pdu.'+this.fields[i].path);
            fieldValues[this.fields[i].path] = getFieldValue(fieldValue);
        }
    }

    return fieldValues;
};

Formatter.prototype.add = function(fields) {
    this.fields.length = 0;

    for (var i=0; i<fields.length; i++) {
        var field = {};
        field.path = fields[i];

        // if field is a dot notation field path (entityId.application) parse pdu field name for validation
        field.pduField = fields[i].split(".")[0];
        field.isPduField = (field.pduField.length===field.path.length);

        this.fields.push(field);
    }
};

module.exports = Formatter;
