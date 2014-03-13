'use strict';

angular.module('skuapso-init')
.service('skuapso-owners', ['skuapso-init-owner', function() {}])
.service('skuapso-init-owner', [
    'skuapso-init',
    function(Class) {
      this.new = function(props) {
        var o = Class.new(props);
        o.type = 'owner';
        Object.defineProperty(o, 'parent', {
          get: function() {
            return this.parent_id ? {type: 'owner', id: this.parent_id}
            : {type: 'owner', id: null};
          }
        });

        return o;
      };

      Class.owner = this.new;
    }]
)
;
