'use strict';

angular.module('skuapso-init')
.service('skuapso-object-model', ['skuapso-init-object-model', function() {}])
.service('skuapso-init-object-model', [
    'skuapso-init',
    function(Class) {
      this.new = function(opts) {
        var o = Class.new('object_model', opts.id, opts);
        return o;
      }
      Class.object_model = this.new;
    }]
)
;
