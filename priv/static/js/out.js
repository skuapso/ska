var t = 0;
var toJson = angular.toJson;
var $a = function(el) {return angular.element($(el));};
var $s = function() {return $a('html').scope();};
var $i = function(el) {return $s().$item(el);};
var root = function() {return $('html').data('$scope');};

var contextMenuClick = function(ev) {
  root().data.get($('.context-menu-active').data())[$(this).data('action')]();
};

$('menu>command').on('click', contextMenuClick);
