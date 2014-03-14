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
        o[13] = init.owner({id: 13, title: 'кто', parent_id: null});
      }

      $rootScope.rename = function() {
        var obj = $('[object]>div').data().$scope;
        obj.model_id = 1;
        obj.$digest();
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
