/**
 * Created by chriscooke on 4/22/15.
 */
'use strict';

// Constructor
function Formatter(fields) {
    this.fields = [];
    this.isValid = false;
    this.showAllFields = false;
    if (fields && fields.length>0) {
        this.add(fields);
        this.showAllFields = fields[0]==='pdu';
    }
}

var getFieldValueAsObject = function(fieldValue) {
    if (typeof fieldValue==='object') {
        if (fieldValue.hasOwnProperty('fieldOrder')) {  // DIS object
            var fieldValues = {};
            for (var i=0; i<fieldValue.fieldOrder.length; i++) {
                fieldValues[fieldValue.fieldOrder[i]] = getFieldValueAsObject(fieldValue[fieldValue.fieldOrder[i]]);
            }
            return fieldValues;
        } else {
            return fieldValue;
        }
    } else {
        return fieldValue;
    }
};

var getFieldValueAsTree = function(fieldLabel, fieldValue) {
    // Returns field value(s) with correct field order
    if (typeof fieldValue==='object') {
        if (fieldValue.hasOwnProperty('fieldOrder')) {  // DIS object
            var fieldValues = [];
            for (var i=0; i<fieldValue.fieldOrder.length; i++) {
                fieldValues.push(getFieldValueAsTree(fieldValue.fieldOrder[i], fieldValue[fieldValue.fieldOrder[i]]));
            }
            return {name: fieldLabel, children: fieldValues};
        } else {
            return {name: fieldLabel, value: fieldValue};
        }
    } else {
        return {name: fieldLabel, value: fieldValue};
    }
};

// class methods
Formatter.prototype.pduValues = function(pdu) {
    var fieldValues = {};
    if (this.showAllFields) {
        // Add header ordering to pdu
        pdu.header.fieldOrder = ['srcAddress', 'dstAddress', 'port', 'timestamp'];
        pdu.fieldOrder.unshift("header");
        var pduValues = getFieldValueAsTree("pdu", pdu);
        fieldValues["pdu"] = pduValues.children;
    } else {
        for (var i=0; i<this.fields.length; i++) {
            if (pdu.hasOwnProperty(this.fields[i].pduField)) {
                var fieldValue = (this.fields[i].isPduField)
                    ? pdu[this.fields[i].pduField]
                    : eval('pdu.'+this.fields[i].path);
                fieldValues[this.fields[i].path] = getFieldValueAsObject(fieldValue);
            }
        }

        fieldValues.id = pdu.id;    // Mandatory field
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
