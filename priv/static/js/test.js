'use strict';
var tmp;
angular.module('skuapso.test', ['skuapso', 'skuapso-init'])
.run([
    '$rootScope',
    'skuapso-data',
    'skuapso-owners',
    'skuapso-init',
    function($rootScope, d, o, init) {
      $rootScope.test = function() {
        this.add({
          id: 1234,
        no: 'test',
        model_id: 1,
        group_id: 2,
        type: 'object'
        });
      };

      $rootScope.test = function() {
        console.debug('data: %o', d);
        console.debug('objects: %o', o);
        o[13] = new init.owner({id: 13, title: 'кто', parent_id: null});
      }

      $rootScope.rename = function() {
        var $item = this.$item({type: 'object', id: 1});
        $item.model_id=2;
        //    angular.element($rootScope.$($item.parent)).scope().$digest();
      }
    }]
);

var jq_rename = function() {
  console.debug('jquery rename');
/*  var $item = $s().$item({type: 'object', id: 1});
  $item.model_id = 2;
  $s().$digest();
  return false; */
};

$('#rename').on('click', jq_rename);
