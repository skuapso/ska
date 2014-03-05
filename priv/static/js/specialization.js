'use sctrict';

angular.module('skuapso-init')
.service('skuapso-specialization', ['skuapso-init-specialization', function() {}])
.service('skuapso-init-specialization', [
    'skuapso-init',
    function(Class) {

      var SkuapsoSpecialization = function(props) {
        props.type = 'specialization';
        SkupasoSpecialization.superclass.constructor.call(this, props);
      };
      Class.inherit(SkuapsoSpecialization, Class.Item);

      Class.specialization = SkuapsoSpecialization;
    }]
)
;