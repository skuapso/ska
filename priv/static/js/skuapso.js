'use strict';

var $directive = function($type) {
	$.contextMenu({
		selector: 'div.context-menu.' + $type,
		items: $.contextMenu.fromMenu('menu#' + $type)
	});
  return ['skuapso-data', '$compile', function(data, compile) {
    var def = {};

    console.warn('надо как-то автоматизировать получение наблюдаемых частей');
    def.link = function($scope, $element, $attrs) {
      var obj = data.get({type: $type, id: $attrs[$type]});
      var div = $('<div class="context-menu ' + $type
            + '" data-type="' + $type
            + '" data-id="{{id}}">'
            + '{{title}}'
            + '</div>');
      div.on('$destroy', function() {
        $(this).data().$scope.$emit('destroed', 'id', 'title');
      });
      $element.find('>div.' + $type).remove();
      compile(div)(obj);
      $element.prepend(div);
      obj.$digest();
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
  root.controls = {};
  root.controls.toDateTime = new Date();
  root.controls.fromDateTime = new Date();
  root.controls.fromDateTime.setDate(root.controls.toDateTime.getDate() - 1);
  root.controls.sensor = true;
}])
.run(['$http', '$templateCache', function(http, templateCache) {
  templateCache.put('template/timepicker/timepicker.html', "<span>" +
    "<i class='glyphicon glyphicon-time'></i>&nbsp;" +
    "<input type='text' class='timepicker' ng-model='hours' maxlength='2'>" +
    "&nbsp;:&nbsp;" +
    "<input type='text' class='timepicker' ng-model='minutes' maxlength='2'>" +
    "</span>");
}])
.controller('management', ['$rootScope', '$scope', function(root, scope) {
  scope.controls = root.controls;
}])
.directive('group', $directive('group'))
.directive('object', $directive('object'))
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
  config.dateFormat = 'mediumDate';
}])
.config(['timepickerConfig', function(config) {
  config.showMeridian = false;
}])
.filter('toArray', function() {
  return function(input) {
    var i, output = [];
    for (i in input) {
      output.push(input[i]);
    }
    return output;
  }
})
.config(['$modalProvider', function(config) {
  config.options.backdrop = 'static';
}])
;
