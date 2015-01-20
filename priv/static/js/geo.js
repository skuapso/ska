'use strict';

angular.module('skuapso-init')
.service('skuapso-geo', ['skuapso-init-geo', function(){}])
.service('skuapso-init-geo', [
    'skuapso-init',
    function(Class) {
      this.new = function(opts) {
        var o = Class.new('geo', opts.id, opts);
        return o;
      }
      Class.geo = this.new;
    }]
)
;
