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
        Object.defineProperty(o, 'parent_owner', {
          get: function() {
            return Class.data.owners[this.parent_id];
          },
          set: function(parentOwner) {
            this.parent_id = parentOwner ? parentOwner.id : null;
          }
        });

        return o;
      };

      Class.owner = this.new;
    }]
)
;
