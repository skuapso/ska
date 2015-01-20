'use strict';

var $directive = function($type, $w) {
  var $watch = $w || {};
	$.contextMenu({
		selector: 'div.context-menu.' + $type,
		items: $.contextMenu.fromMenu('menu#' + $type),
    events: {
      show: function() {
        _root.data.get(this.data()).selected = true;
      }
    }
	});
  return ['skuapso-data', '$compile', '$rootScope', function(data, compile, root) {
    var def = {};

    console.warn('надо как-то автоматизировать получение наблюдаемых частей');
    def.link = function($scope, $element, $attrs) {
      var obj = data.get({type: $type, id: $attrs[$type]});
      var div = $('<div class="context-menu ' + $type
            + '" data-type="' + $type
            + '" data-id="{{id}}"'
            + 'ng-click="selected=1"'
            + '>'
            + '{{title}}'
            + '</div>');
      var key;

      div.on('$destroy', function() {
        $(this).data().$scope.$emit('destroed', 'id', 'title');
      });

      $element.find('>div.' + $type).remove();
      compile(div)(obj);
      $element.prepend(div);

      Object.defineProperties(obj, {
        'selected': {
          'configurable': true,
          get: function() {
            return angular.equals(root.selected, this.ref);
          },
          set: function() {
            root.selected = this.ref;
          }
        }
      });
      obj.listSelected = function(newS, oldS, ele) {
        if (oldS == newS) return;
        if (newS) {
          div.addClass('selected');
        } else {
          div.removeClass('selected');
        }
      };
      $watch.selected = 'listSelected';

      for (key in $watch) {
        obj.$watch(key, obj[$watch[key]]);
      }
      obj.$digest();
    }

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
.run([
    '$rootScope',
    'skuapso-data',
    'skuapso-map',
    function(root, data, map) {
  var selected = null;
  _root = root;
  root.map = map;
  root.data = data;
  root.controls = {};
  root.controls.toDateTime = new Date();
  root.controls.fromDateTime = new Date();
  root.controls.fromDateTime.setDate(root.controls.toDateTime.getDate() - 1);
  root.controls.sensor = true;
  Object.defineProperty(root, 'selected', {
    get: function() {
      return selected;
    },
    set: function(ref) {
      var old = this.data.get(selected);
      selected = ref;
      if (old) old.$digest();
      if (ref) this.data.get(ref).$digest();
      this.$digest();
    }
  });
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
.directive('object', $directive('object', {'data.1': 'setLocation'}))
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
.directive('skSelected', [
    function() {
      var def = {};

      def.templateUrl = '/static/tpl/skuapso/state.tpl.html'

      return def;
}])
.controller('menu', ['$scope', function(scope) {
  scope.editUsers = function() {
  };
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
