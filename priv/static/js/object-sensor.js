'use sctrict';

angular.module('skuapso-init')
.service('skuapso-object-sensor', ['skuapso-init-object-sensor', function() {}])
.service('skuapso-init-object-sensor', [
    'skuapso-init',
    function(Class) {
      this.new = function(props) {
        var o = Class.new('object_sensor', props.id, props);
        var object = Class.data.objects[o.object_id];
        var tool = Class.data.object_tools[o.provides];

        object.sensors[o.id] = o;
        Object.defineProperty(object.state, tool.title, {
          enumerable: true,
          get: function() {
            return object.data ? object.data[o.provides] : null;
          }
        });

        return o;
      };

      Class.object_sensor = this.new;
    }]
)
;
