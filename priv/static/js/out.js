var t = 0;
var toJson = angular.toJson;
var $a = function(el) {return angular.element($(el));};
var $s = function() {return $a('html').scope();};
var $i = function(el) {return $s().$item(el);};

var contextMenuClick = function(ev) {
  var $item = $('.context-menu-active').data(),
      $action = $(this).data('action'),
      $callbacks = $s()['callbacks'],
      $callback =
        $callbacks[$item.type]
        ? $callbacks[$item.type][$action]
        : $callbacks[$action];
  if ($callback) {
    $callback($item);
  }
};

$('menu>command').on('click', contextMenuClick);
