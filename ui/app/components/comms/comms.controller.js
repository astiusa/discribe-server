/**
 * Created by chriscooke on 4/29/15.
 */

define([], function() {

    'use strict';

    var deps = ['$scope','$filter', 'svcDiscribe'];

    return {commsCtrl: deps.concat(factory)};

    function factory($scope, $filter, svcDiscribe) {
        $scope.current = svcDiscribe.state;
        $scope.discribe = {
            pduStats: svcDiscribe.PduStats(),
            transmissions:[],
            pdus:[],
            showPdus: false
        };

        $scope.pduView = {'fields':[], 'typeName':'', 'raw':[], 'showRaw': false};

        $scope.showByEntityId = function() {
            $scope.discribe.showPdus = false;
            $scope.discribe.transmissions.length = 0;
            $scope.discribe.pdus.length = 0;
            var transmissions = svcDiscribe.Transmissions($scope.current.timeSpan).query(function() {
                $scope.discribe.transmissions.length = 0;
                Array.prototype.push.apply($scope.discribe.transmissions, transmissions);
            });
        };

        $scope.showByFrequency = function() {
            $scope.discribe.showPdus = false;
            $scope.discribe.transmissions.length = 0;
            $scope.discribe.pdus.length = 0;
            var transmissions = svcDiscribe.Transmissions($scope.current.timeSpan).query(function() {
                $scope.discribe.transmissions.length = 0;
                Array.prototype.push.apply($scope.discribe.transmissions, transmissions);
            });
        };

        var pduReader = new svcDiscribe.PduReader($scope.discribe.pdus);

        $scope.showEntityIdPdus = function(tab) {
            $scope.discribe.showPdus = true;
            $scope.discribe.transmissions.length = 0;
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

        $scope.showByEntityId();
    }
});
