'use sctrict';

angular.module('skuapso-init')
.service('skuapso-terminals', ['skuapso-init-terminal', function() {}])
.service('skuapso-init-terminal', [
    'skuapso-init',
    function(Class) {
      this.new = function(props) {
        var o = Class.new('terminal', props.id, props);

        Object.defineProperty(o, 'title', {
          get: function() {
            return this.uin + '';
          }
        });

        return o;
      };


      Class.terminal = this.new;
    }]
)
;
