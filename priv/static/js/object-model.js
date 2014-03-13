'use strict';

angular.module('skuapso-init')
.service('skuapso-objects-models', ['skuapso-init-object-model', function() {}])
.service('skuapso-init-object-model', [
    'skuapso-init',
    function(Class) {
      this.new = function(opts) {
        var o = Class.new(opts);
        o.type = 'object_model';
        return o;
      }
      Class.object_model = this.new;
    }]
)
;
