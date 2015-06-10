/**
 * Created by chriscooke on 4/22/15.
 */
'use strict';

// Constructor
function Filter(expression) {
    this.expression = expression;
    this.evalExpression = expression;
    this.isValid = false;
    this.conditions = [];
    this.parseExpression();
}

// class methods
Filter.prototype.passes = function(pdu) {
    var result = true;

    try {
        // Always let summary pduTypes through
        if (pdu.pduType===212 || pdu.pduType===213) {
            result =  true;
        } else if (this.evalExpression && this.evalExpression.length>0) {
            var pduHasFields = true;
            for (var i=0; i<this.conditions.length; i++) {
                if (!pdu.hasOwnProperty(this.conditions[i].pduFieldName)) {
                    pduHasFields = false;
                }
            }

            // reject if field(s) not present in pdu

            //if (pdu.entityId.site==127&&pdu.entityId.application==34&&pdu.entityId.entity==62749) {
            //    var ccc=1;
            //}
            result = (pduHasFields) ? eval(this.evalExpression) : false;
            if (result) {
                var aaa=1;
            } else {
                var bbb = 1;
            }
        } else {
            // pass if no expression
            result = true;
        }
    }
    catch(err) {
        result = false;
    }

    return result;
};

Filter.prototype.parseExpression = function() {
    this.isValid = true;
    this.conditions.length = 0;

    try {
        // Remove all spaces
        this.expression = this.expression.replace(/ /g,'');

        // Force correct eval syntax for executable expression
        this.evalExpression = this.expression
            .replace(/&&/g, '&')
            .replace(/&/g, '&&')
            .replace(/\|\|/g, '|')
            .replace(/\|/g, '||');

        // Normalize expressions to comma delimited
        var clean = this.expression
            .replace(/!=/g, '#ne#')
            .replace(/[!()]+/g, '')
            .replace(/#ne#/g, '!=')
            .replace(/&&/g, '&')
            .replace(/&/g, ',')
            .replace(/\|\|/g, '|')
            .replace(/\|/g, ',');

        // parse fieldExpressions to fieldname, operand and value
        this.conditions.length = 0;
        var exprNo = 0;
        var regex = /[><=!]+/;
        var fieldExpressions = clean.split(',');
        var i;
        for (i=0; i<fieldExpressions.length; i++) {
            // Parse filter expression into field, operand and value parts
            var condition = {};

            condition.expression = fieldExpressions[i];
            var parts = condition.expression.split(regex);

            // split to field, equality, value
            condition.fieldName = parts[0];
            condition.value = (parts.length>1) ? parts[1] : null;
            condition.op = condition.expression
                .replace(condition.fieldName,"")
                .replace(condition.value,"");

            if (condition.op==="=") {
                // Replace display syntax with evaluation syntax
                condition.expression = condition.expression.replace("=", "==");
                condition.op = "=="
            }

            if (['<','<=','==','>','>='].indexOf(condition.op)===-1) {
                this.isValid = false; //throw new Error("Invalid expression: "+condition.expression);
            }

            /*  If not top level pdu field (i.e. entityId.application), keep top
             level name for pdu field name validation */
            condition.pduFieldName = condition.fieldName.split(".")[0];

            condition.exprKey = "expr"+exprNo++;
            this.evalExpression = this.evalExpression.replace(fieldExpressions[i], condition.exprKey);
            this.conditions.push(condition);
        }
        
        // prepend field names with 'pdu.' for pdu field evaluation
        for (i=0; i<this.conditions.length; i++) {
            this.evalExpression = this.evalExpression.replace(this.conditions[i].exprKey, 'pdu.'+this.conditions[i].expression);
        }
    }

    catch(err) {
        this.isValid = false;
    }

    return (this.isValid);
};

module.exports = Filter;
