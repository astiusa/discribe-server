/*!
 * aliasNames directive.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 */
define([], function() {

    'use strict';

    var deps = [];

    return {pduView: deps.concat(factory)};

    function factory() {
        return {
            restrict: 'A',
            scope: {
                view: "="
            },
            controller:  function($scope) {
                $scope.maxPagesVisible = 5;

                $scope.setPage = function (page) {
                    $scope.view.query.currentPage = pageNo;
                };

                $scope.pageChanged = function() {
                    $scope.view.query.getResults();
                };

                $scope.showPduDetail = function(pdu) {
                    $scope.view.query.loadPdu(pdu);
                };
            },
            templateUrl: 'app/components/common/views/pduView.html',
            link: function(scope) {
                var update = function() {
                    scope.view.query.getResults();
                };

                var _watchUpdateFirst = true;
                scope.$watch('view.query.hasUpdate', function() {
                    if (_watchUpdateFirst) {
                        _watchUpdateFirst = false;
                        return;
                    }

                    update();
                });
            }
        };
    }

});
