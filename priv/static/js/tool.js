'use strict';

angular.module('skuapso-init')
.service('skuapso-object-tool', ['skuapso-init-object-tool', function() {}])
.service('skuapso-init-object-tool', [
    'skuapso-init',
    function(Class) {
      this.new = function(opts) {
        var o = Class.new('object_tool', opts.id, opts);
        return o;
      }
      Class.object_tool = this.new;
    }]
)
;
