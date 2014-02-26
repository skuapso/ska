'use strict';

angular.module('skuapso.test', ['skuapso'])
.run(function($rootScope) {
  $rootScope.test = function() {
    this.add({
      id: 1234,
      no: 'test',
      model_id: 1,
      group_id: 2,
      type: 'object'
    });
  };

  $rootScope.rename = function() {
    var $item = this.$item({type: 'object', id: 1});
    $item.model_id=2;
//    angular.element($rootScope.$($item.parent)).scope().$digest();
  }

});

var jq_rename = function() {
  console.debug('jquery rename');
  var $item = $s().$item({type: 'object', id: 1});
  $item.model_id = 2;
  $s().$digest();
  return false;
};

$('#rename').on('click', jq_rename);

var model = new SkuapsoObject({id: 1, no: 'Камаз'});
