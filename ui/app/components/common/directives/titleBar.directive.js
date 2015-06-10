/*!
 * aliasNames directive.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 */
define([], function() {

    'use strict';

    var deps = ['$timeout'];

    return {titleBar: deps.concat(factory)};

    function factory($timeout) {
        return {
            restrict: 'A',
            scope: {
                timeSpan: "="
            },
            controller:  'recordingCtrl',
            templateUrl: 'app/components/common/views/titleBar.html',
            link: function($scope) {
                var clickWait = null;
                var isClick = false;
                $scope.isOpen = false;
                $scope.mouseDown = function() {
                    isClick = true;
                    clickWait = $timeout(function() {
                        isClick = false;
                        $scope.isOpen=true;
                    },500);
                };
                $scope.mouseUp = function() {
                    if (isClick) {
                        $timeout.cancel(clickWait);
                        //$scope.isOpen=false;
                        $scope.timeSpan.revertRange();
                    }

                    return isClick;
                };
           }
        };
    }

});
