'use strict';

var tmp;
angular.module('skuapso.test', ['skuapso', 'skuapso-init'])
;

var objs = [];
function probj(obj, nesting) {
  var id, n = typeof nesting === 'undefined' ? 0 : nesting;
  objs.push(obj);
  for (id in obj) {
    console.debug('%o, %o: %o', n, id, obj[id]);
    if (angular.isArray(obj[id])) continue;
    if (angular.isString(obj[id])) continue;
    if (objs.indexOf(obj[id]) == -1) {
      probj(obj[id], n + 1);
    }
  }
  objs.pop();
};
