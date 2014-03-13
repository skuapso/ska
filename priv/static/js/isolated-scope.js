'use strict';

angular.module('isolated-scope', [])
.provider('isolatedScope', ['$rootScopeProvider', function(rootProvider) {
  this.$get = ['$injector', '$rootScope', function(injector) {
    return function() {return injector.invoke(rootProvider.$get)};
  }];
}])
/*.run(['$rootScope', function(root, skRoot) {
  var oldNew = root.constructor.prototype.$new;
  root.constructor.prototype.$new = function(isolated) {
    var scope = oldNew.call(this, isolated);
    if (isolated) {
      scope.$$isolated = true;
      scope.$root = null;
      scope.$parent = null;
    } else {
      if (scope.$$isolated) delete scope.$$isolated;
    }
    return scope;
  };

}])
.service('isolateScopeProvider', function() {})
.config(['$rootScopeProvider', 'isolateScopeProvider', function(rsp, skRoot) {
  angular.extend(skRoot, rsp);
}])
.service('sk-root', function() {}) */
;
