'use sctrict';

angular.module('skuapso-init')
.service('skuapso-terminals', ['skuapso-init-terminal', function() {}])
.service('skuapso-init-terminal', [
    'skuapso-init',
    function(Class) {

      var Skuapsoterminal = function(props) {
        props.type = 'terminal';
        Skuapsoterminal.superclass.constructor.call(this, props);
      };
      Class.inherit(Skuapsoterminal, Class.Item);

      Class.terminal = Skuapsoterminal;
    }]
)
;

