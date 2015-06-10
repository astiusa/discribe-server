/*!
 * DIS Enums Service.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$modal', '$q'];
return {svcModals: deps.concat(factory)};

function factory($modal, $q) {
    var service = this;
    var DialogCtrl = function ($scope, $modalInstance, options) {
        $scope.data = options;
        $scope.sortKey = options.nameKey;
        $scope.onClose = function (result) {
            $scope.$close(result);
        };
    };

    var dialogOpts = {
        backdrop:      true,
        keyboard:      true,
        backdropClick: false,
        templateUrl:   "/app/components/discribeUtil/views/dialog.html",
        controller:    DialogCtrl
    };

    var defaultOps = {
        title:       "Confirm",
        message:     "Please confirm action",
        items:       {},
        nameKey:     'name',
        postmessage: "",
        yes:         "Confirm",
        no:          "Cancel"
    };

    var getModal = function (d, opts, callback) {
        d.resolve = {
            options: function () {
                return opts;
            }
        };
        var deferred = $q.defer();
        var modal = $modal.open(d);
        modal.result.then(function (result) {
            deferred.resolve(result);
            if (angular.isFunction(callback)) {
                callback(result);
            }
        });
        deferred.close = function (result) {
            modal.close(result);
        };
        return deferred.promise;
    };

    service.modal = function (opts, callback) {
        var d = angular.extend({}, dialogOpts, opts);
        return getModal(d, opts, callback);
    };

    service.confirm = function (data, callback) {
        var opts = _.extend({}, defaultOps, data);
        var d = angular.extend({}, dialogOpts);
        return getModal(d, opts, callback);
    };

    service.confirmDelete = function (data, callback) {
        var myD = {
            title:       "Delete " + data.title,
            message:     "Are you sure you want to delete?",
            postmessage: "This operation cannot be undone.",
            yes:         "Delete"
        };
        var opts = angular.extend({}, defaultOps, myD, data);
        var d = angular.extend({}, dialogOpts);
        return getModal(d, opts, callback);

    };

    service.showFilter = function (data, callback) {
        var myD = {
            title:       "Display Filter",
            message:     "",
            postmessage: "",
            yes:         "Apply"
        };
        var opts = angular.extend({}, defaultOps, myD, data);
        var templateOpt = {
            templateUrl:"/app/components/discribeUtil/views/filterDialog.html"
        };
        var d = angular.extend({}, dialogOpts, templateOpt);
        return getModal(d, opts, callback);

    };

    service.showReplayDialog = function (data, callback) {
        var myD = {
            title:       "Start Replay",
            message:     "",
            postmessage: "",
            yes:         "Start"
        };
        var opts = angular.extend({}, defaultOps, myD, data);
        var templateOpt = {
            templateUrl:"/app/components/discribeUtil/views/replayDialog.html"
        };
        var d = angular.extend({}, dialogOpts, templateOpt);
        return getModal(d, opts, callback);

    };

    service.showArchiveDialog = function (data, callback) {
        var myD = {
            title:       "Archive",
            message:     "",
            postmessage: "",
            yes:         "Archive"
        };
        var opts = angular.extend({}, defaultOps, myD, data);
        var templateOpt = {
            templateUrl:"/app/components/discribeUtil/views/archiveDialog.html"
        };
        var d = angular.extend({}, dialogOpts, templateOpt);
        return getModal(d, opts, callback);

    };

    return service;
}

});
