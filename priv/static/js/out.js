var t = 0;
var toJson = angular.toJson;
var $a = function(el) {return angular.element($(el));};
var $s = function() {return $a('html').scope();};
var $i = function(el) {return $s().$item(el);};
var root = function() {return $('html').data('$scope');};

var contextMenuClick = function(ev) {
  var $item = $('.context-menu-active').data();
  console.debug('item is %o', $item);
  var $action = $(this).data('action'),
      $callback = root().data[$item.type + 's'][$item.id][$action];
  if ($callback) {
    $callback($item);
  }
};

$('menu>command').on('click', contextMenuClick);
