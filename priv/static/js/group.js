'use strict';

angular.module('skuapso-init')
.service('skuapso-groups', ['skuapso-init-group', function() {}])
.service('skuapso-init-group', [
    'skuapso-init',
    function(Class) {
      var SkuapsoGroup = function(props) {
        props.type = 'group';
        SkuapsoGroup.superclass.constructor.call(this, props);
      };
      Class.inherit(SkuapsoGroup, Class.Item);
      Object.defineProperty(SkuapsoGroup.prototype, 'parent', {
        get: function() {
          return this.parent_id ? {type: 'group', id: this.parent_id}
          : {type: 'owner', id: this.owner_id};
        }
      });

      Class.group = SkuapsoGroup;
    }]
)
