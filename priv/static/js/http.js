'use strict';

angular.module('skuapso-http', [])
.service('skuapso-http', [
    '$http',
    '$q',
    function(http, q) {
      var pendingRequests = [];

      function skuapsoHttp(reqConfig) {
        var promise;
        if (pendingRequests.indexOf(reqConfig.url) >= 0) {
          promise = q.when(reqConfig);

          promise.success = function(fn) {
            promise.then(function() {});
            return promise;
          };

          promise.error = function(fn) {
            promise.then(function() {});
            return promise;
          };
        } else {
          pendingRequests.push(reqConfig.url);
          var promise = q.when(http(reqConfig));

          promise.success = function(fn) {
            promise.then(function(response) {
              pendingRequests.remove(reqConfig.url);
              fn(response.data, response.status, response.headers, response.config);
            });

            return promise;
          };

          promise.error = function(fn) {
            promise.then(null, function(response) {
              pendingRequests.remove(reqConfig.url);
              fn(response.data, response.status, response.headers, response.config);
            });
          }
          return promise;
        };

        return promise;
      };

      function createShortMethods(names) {
        angular.forEach(names, function(name) {
          skuapsoHttp[name] = function(url, config) {
            return skuapsoHttp(angular.extend(config || {}, {
              method: name,
              url: url
            }));
          }
        });
      };
      function createShortMethodsWithData(names) {
        angular.forEach(names, function(name) {
          skuapsoHttp[name] = function(url, data, config) {
            return skuapsoHttp(angular.extend(config || {}, {
              method: name,
              url: url,
              data: data
            }));
          }
        })
      };
      createShortMethods(['get', 'delete', 'head', 'jsonp']);
      createShortMethodsWithData(['put', 'post', 'patch']);
      skuapsoHttp['create']  = skuapsoHttp['put'];
      skuapsoHttp['read']    = skuapsoHttp['get'];
      skuapsoHttp['update']  = skuapsoHttp['patch'];
      skuapsoHttp['delete']  = skuapsoHttp['delete'];
      return skuapsoHttp;
    }
]);
