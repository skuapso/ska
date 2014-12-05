'use strict';

angular.module('skuapso-init')
.service('skuapso-sensor', ['skuapso-init-sensor', function() {}])
.service('skuapso-init-sensor', [
    'skuapso-init',
    function(Class) {
      this.new = function(opts) {
        var o = Class.new('sensor', opts.id, opts);
        return o;
      }
      Class.sensor = this.new;
    }]
)
;
