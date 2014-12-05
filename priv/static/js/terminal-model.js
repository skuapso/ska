'use strict';

angular.module('skuapso-init')
.service('skuapso-terminal-model', ['skuapso-init-terminal-model', function() {}])
.service('skuapso-init-terminal-model', [
    'skuapso-init',
    function(Class) {
      this.new = function(opts) {
        var o = Class.new('terminal_model', opts.id, opts);
        return o;
      }
      Class.terminal_model = this.new;
    }]
)
;
