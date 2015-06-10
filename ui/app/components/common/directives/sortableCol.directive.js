/*!
 * Sortable column directive.
 *
 * Copyright (c) 2014 ASTi. All rights reserved.
 *
 * @author Chris Cooke
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = ['$compile'];

return {sortableCol: deps.concat(factory)};

function factory($compile) {
  var getTemplate = function (subtext) {
    var template = "<span data-ng-class='textClass'>{{title}}</span>";
    if (subtext) {
      template = template + "<br/>{{subtext}}";
    }
    template = template + " {{units}} <span style='padding-left:5px;'><i data-ng-show='sortPredicate!=predicate' class='fa fa-sort'></i>" +
      "<i data-ng-show='sortPredicate==predicate'" +
      "data-ng-class='{\"fa fa-sort-up\":reverse, \"fa fa-sort-down\":!reverse}'>" +
      "</i></span>";
    return template
  };

  return {
    scope: {
      sortPredicate: '=predicate',
      reverse: '=reverse',
      predicate: '@sortableCol',
      title: "@text",
      textClass: "@textClass",
      subtext : "@subtext",
      units: "@units"
    },
    replace: false,
    transclude: true,
    link: function (scope, element, attr) {
      element.html(getTemplate(attr.subtext)); //.show();
      $compile(element.contents())(scope);
      element.bind('click', function () {
        scope.sortPredicate = scope.predicate;
        scope.reverse = !scope.reverse;
        scope.$apply();
      });
    }
  };
  
}

});