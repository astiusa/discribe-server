/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope','$filter','svcEntities','svcDiscribe'];

    return {entitiesCtrl: deps.concat(factory)};

    function factory($scope, $filter, svcEntities, svcDiscribe) {
        $scope.current = svcDiscribe.state;
        $scope.discribe = {
            entitySummary: [],
            positions: [],
            pdus:[],
            showPdus: false
        };
        $scope.discribe.forceLevels = svcEntities.ForceLevels();

        $scope.pduView = {'fields':[], 'typeName':'', 'raw':[], 'showRaw': false};

        $scope.showSummary = function() {
            $scope.discribe.showPdus = false;
            $scope.discribe.entitySummary.length = 0;
            $scope.discribe.positions.length = 0;
            $scope.discribe.pdus.length = 0;
            var entitySummary = svcDiscribe.EntitySummary($scope.current.timeSpan).query(function() {
                Array.prototype.push.apply($scope.discribe.entitySummary, entitySummary);
            });
        };

        $scope.showPositions = function() {
            $scope.discribe.showPdus = false;
            $scope.discribe.entitySummary.length = 0;
            $scope.discribe.positions.length = 0;
            $scope.discribe.pdus.length = 0;
            var timeSpan = {
                startTimestamp: $scope.current.timeSpan.startTimestamp,
                lastTimeStamp: $scope.current.timeSpan.startTimestamp};
            var filterExpr = "pduType=1";
            var fields = [
                "header",
                "entityId",
                "forceId",
                "entityType",
                "marking",
                "entityLocation",
                "entityLinearVelocity",
                "entityOrientation",
                "deadReckoningParameters"
            ];
            var entityPdus = svcDiscribe.PDUs(timeSpan, filterExpr, fields).query(function() {
                angular.forEach(entityPdus, function(pdu) {
                    svcEntities.processEntityStatePdu(pdu);
                });
                svcEntities.updateAll();

                Array.prototype.push.apply($scope.discribe.positions, svcEntities.entities.active);
                var ccc = 1;
            });
        };

        $scope.showMap = function() {
            $scope.discribe.showPdus = false;
            $scope.discribe.entitySummary.length = 0;
            $scope.discribe.positions.length = 0;
            $scope.discribe.pdus.length = 0;
            var entitySummary = svcDiscribe.EntitySummary($scope.current.timeSpan).query(function() {
                Array.prototype.push.apply($scope.discribe.entitySummary, entitySummary);
            });
        };

        var pduReader = new svcDiscribe.PduReader($scope.discribe.pdus);

        $scope.showEntityIdPdus = function(tab) {
            $scope.discribe.showPdus = true;
            $scope.discribe.entitySummary.length = 0;
            $scope.discribe.pdus.length = 0;
            var filterExpr = "entityId.site=="+tab.entityId.site+"&&"+
                "entityId.application=="+tab.entityId.application+"&&"+
                "entityId.entity=="+tab.entityId.entity;
            var fields = ["header", "pduType", "pduLength", "entityId"];
            pduReader.read($scope.current.timeSpan, filterExpr, fields, 1000);
        };

        $scope.showPduDetail = function(pdu) {
            var pdus = svcDiscribe.PDU(pdu.id).query(function() {
                // Should only be one ... but
                if (pdus.length>0 && pdus[0].hasOwnProperty('pdu')) {
                    $scope.pduView.fields.length = 0;
                    $scope.pduView.raw.length = 0;
                    $scope.pduView.pduType = pdu.pduType;
                    $scope.pduView.typeName = $filter('pduTypeName')(pdu.pduType);

                    Array.prototype.push.apply($scope.pduView.fields, pdus[0].pdu);
                }
            });
        };

        var _entityIds = {};
        $scope.tabs = [];

        $scope.removeTab = function (event, index) {
            event.preventDefault();
            event.stopPropagation();
            delete _entityIds[$scope.tabs[index].name];
            $scope.tabs.splice(index, 1);
        };

        $scope.addTab = function(entityId) {
            var entityIdName = $filter('formatEntityId')(entityId);
            if (!_entityIds.hasOwnProperty(entityIdName)) {
                var item = {name: entityIdName, entityId: entityId};
                _entityIds[entityIdName] = item;
                $scope.tabs.push(item);
            }
        };

        $scope.showSummary()
    }
});

