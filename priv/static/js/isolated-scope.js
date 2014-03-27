'use strict';

angular.module('isolated-scope', [])
.service('digest', [
    '$rootScope',
    '$exceptionHandler',
    function(root, exception) {
      var scopes = [];
      var ttl = 10;

      this.add = function(scope) {
        if (scopes.length > ttl) {
          exception('isolated-scope digest ttl excided ', ttl);
          return this;
        }
        scopes.push(scope);
        setTimeout(run, 0);
        return this;
      };

      function run() {
        if (scopes.length == 0) return;
        if (root.$$phase || scopes[0].$$phase) {return;}
        var scope = scopes.shift();
        scope.$digest();
        setTimeout(run, 0);
      };

      this.install = function(scope) {
        function newDigest() {
          var i = 0, l = scopes.length;
          if (this.$$phase) {
            for (i; i < l; i++)
              if (scopes[i] === this)
                return;
            scopes.push(this);
            return;
          }
          this.$$oldDigest();
        };

        scope.$$oldDigest = scope.$digest;
        scope.$digest = newDigest;
      }

      this.install(root);
    }
])
.provider('isolatedScope', ['$rootScopeProvider', function(rootProvider) {
  this.$get = ['$injector', 'digest', function(injector, digest) {
    return function() {
      var scope = injector.invoke(rootProvider.$get);
      digest.install(scope);
      return scope;
    };
  }];
}])
.service('watcherExp', [function() {
  return function watcherExp(watcher) {
    if (!watcher.exp) throw('watcherExp: no exp');
    if (!angular.isFunction(watcher.exp)) {
      if (watcher.parts) {
        if (watcher.parts[1]) {
          throw ('watcherExp: to many parts');
        } else {
          return watcher.parts[0].exp;
        }
      } else {
        return watcher.exp;
      }
    }
    return watcherExp(watcher.exp);
  }
}])
;
