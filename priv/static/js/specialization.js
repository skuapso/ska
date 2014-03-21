'use sctrict';

angular.module('skuapso-init')
.service('skuapso-specializations', ['skuapso-init-specialization', function() {}])
.service('skuapso-init-specialization', [
    'skuapso-init',
    function(Class) {
      this.new = function(props) {
        var o = Class.new('specialization', props.id, props);

        return o;
      };

      Class.specialization = this.new;
    }]
)
;
