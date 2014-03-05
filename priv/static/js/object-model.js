'use strict';

angular.module('skuapso-init')
.service('skuapso-objects-models', ['skuapso-init-object-model', function() {}])
.service('skuapso-init-object-model', [
    'skuapso-init',
    function(Class) {
      var SkuapsoObjectModel = function(props) {
        props.type = 'object_model';
        SkuapsoObjectModel.superclass.constructor.call(this, props);
      };
      Class.inherit(SkuapsoObjectModel, Class.Item);

      Class.object_model = SkuapsoObjectModel;
    }]
)
;
