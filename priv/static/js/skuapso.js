'use strict';

var $directive = function($type, $childs) {
  console.warn($type + ': надо в сервисы/провайдеры перефигачить');
	$.contextMenu({
		selector: 'div.context-menu.' + $type,
		items: $.contextMenu.fromMenu('menu#' + $type)
	});
  return ['skuapso-data', function(data) {
    var def = {};

    def.link = function($scope, $element, $attrs) {
      var obj = data.get({type: $type, id: $attrs[$type]});
      var d = 'data-type="' + $type + '" data-id="' + $attrs[$type] + '"';
      $element.find('>div.'+obj.type).remove();
      $element.prepend('<div '+ d +' class="context-menu ' + obj.type + '">'
          + obj.title + '</div>');
    };

    return def;
  }]
};

var skuapsoModule = angular.module('skuapso',
    [
    'ui.bootstrap',
    'skuapso-init',
    'skuapso-tree',
    'skuapso-map',
    'skuapso.test'
    ]);

skuapsoModule
.run(['$rootScope', 'skuapso-data', function(root, data) {
  root.data = data;
}])
.run(['$http', '$templateCache', function(http, templateCache) {
  templateCache.put('template/timepicker/timepicker.html', "<span>" +
    "<input type='text' class='timepicker' ng-model='hours' maxlength='2'>" +
    "&nbsp;:&nbsp;" +
    "<input type='text' class='timepicker' ng-model='minutes' maxlength='2'>" +
    "</span>");
}])
.controller('management', ['$rootScope', function(root) {
  root['toDateTime'] = new Date();
  root['fromDateTime'] = new Date();
  root['fromDateTime'].setDate(root['toDateTime'].getDate() - 1);
  root['sensor'] = true;
}])
.controller('listRoot', ['$scope', 'skuapso-data', function(scope, data) {
  var id;
  scope.node = {};
  Object.defineProperty(scope.node, 'childs', {
    get: function() {
      return data.childs({type: 'owner', id: null})
    }
  });
}])
.directive('owner', $directive('owner', ['owner', 'group']))
.directive('group', $directive('group', ['group', 'object']))
.directive('object', $directive('object', []))
.directive('skIf', ['$compile', function(compile) {
  var def = {};

  def.controller = ['$scope', '$element', function(scope, element) {
    scope.$html = element.html();
  }];

  def.link = function(scope, element, attr) {
    scope.$watch(attr.skIf, function(value, oldValue) {
      if (value && !oldValue) {
        element.html(scope.$html);
      } else {
        element.html('');
      }
      compile(element.contents())(scope);
    });
  };

  def.terminal = true;

  def.priority = 10000;

  return def;
}])
.config(['datepickerConfig', function(config) {
  config.showWeeks = false;
  config.startingDay = 1;
}])
.config(['datepickerPopupConfig', function(config) {
  config.dateFormat = 'shortDate';
}])
.config(['timepickerConfig', function(config) {
  console.debug('%o', config);
  config.showMeridian = false;
}])
;
