'use strict';

angular.module('skuapso-init')
.service('skuapso-groups', ['skuapso-init-group', function() {}])
.service('skuapso-init-group', [
    'skuapso-init',
    function(Class, root, modal, http) {
      this.new = function(props) {
        var o = Class.new(props);
        o.type = 'group';

        Object.defineProperty(o, 'parent', {
          get: function() {
            return this.parent_id ? {type: 'group', id: this.parent_id}
            : {type: 'owner', id: this.owner_id};
          }
        });
        Object.defineProperty(o, 'parent_group', {
          get: function() {
            return Class.data.groups[this.parent_id];
          },
          set: function(parentGroup) {
            this.parent_id = parentGroup ? parentGroup.id : null;
          }
        });

        return o;
      };

      Class.group = this.new;
    }]
)
;
