'use sctrict';

angular.module('skuapso-init')
.service('skuapso-object-sensor', ['skuapso-init-object-sensor', function() {}])
.service('skuapso-init-object-sensor', [
    'skuapso-init',
    function(Class) {
      this.new = function(props) {
        var o = Class.new('object_sensor', props.id, props);

        return o;
      };

      Class.object_sensor = this.new;
    }]
)
;
