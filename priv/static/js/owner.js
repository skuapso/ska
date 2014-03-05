'use strict';

angular.module('skuapso-init')
.service('skuapso-owners', ['skuapso-init-owner', function() {}])
.service('skuapso-init-owner', [
    'skuapso-init',
    function(Class) {
      var SkuapsoOwner = function(props) {
        props.type = 'owner';
        SkuapsoOwner.superclass.constructor.call(this, props);
      };
      Class.inherit(SkuapsoOwner, Class.Item);
      Object.defineProperty(SkuapsoOwner.prototype, 'parent', {
        get: function() {
          return this.parent_id ? {type: 'owner', id: this.parent_id}
          : {type: 'owner', id: null};
        }
      });

      Class.owner = SkuapsoOwner;
    }]
)
;
