'use strict';

var map = L.map('map').setView([55.75, 80.17], 7);
var cloudMadeApiKey = '548f0a06c2ed4b34aefe2a2a5bca5c08',
    cloudMadeUrl = 'http://{s}.tile.cloudmade.com/{apiKey}/{styleId}/256/{z}/{x}/{y}.png',
    cloudMadeAttr = 'Map data &copy; '
    + '<a href="http://openstreetmap.org">OpenStreetMap</a> contributors, '
    + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, '
    + 'Imagery © <a href="http://cloudmade.com">CloudMade</a>';

L.tileLayer(cloudMadeUrl, {
  apiKey: cloudMadeApiKey,
  styleId: 22677,
  attribution: cloudMadeAttr,
  maxZoom: 18
})
.addTo(map)
;

var t = 0;
var toJson = angular.toJson;
var $a = function(el) {return angular.element($(el));};
var $s = function() {return $a('html').scope();};
var $i = function(el) {return $s().$item(el);};

var $$item = function(opts) {
  var $opts = opts || {}, $rootScope = angular.element($('html')).scope(),
      $item_class = function(opts, prop) {
        var $opts = opts || {}, $prop = prop || [], i;
        var $parent =
          ($opts.type == 'owner') ?
            function() {return {type: 'owner', id: this.parent_id}}
          : ($opts.type == 'object') ?
              function() {return {type: 'group', id: this.group_id}}
          : ($opts.type == 'group')
            ? function() {
                return (this.parent_id != null)
                  ? {type: 'group', id: this.parent_id}
                  : {type: 'owner', id: this.owner_id}}
            : undefined;
        if (!$opts.type || !$opts.id) return null;
        $prop['type'] = {
          get: function() {return $opts['type'];}
        };
        $prop['parent'] = {
          get: $parent
        };
        $prop['toString'] = {
          get: function() {
            return this.type + '_' + this.id;
          }
        };

        for (i in $prop)
          Object.defineProperty(this, i, $prop[i]);

        for (i in $opts) if (!$prop[i]) this[i] = $opts[i];

        return this;
      };

  if ($opts.type == 'object') {
    return new $item_class($opts, {
      model: {
        get: function() {
          return $rootScope.object.model(this.model_id).title;}
      }
      ,title: {
        get: function() {return this.model + ' ' + this.no;}
      }
    });
  } else {
    return new $item_class($opts);
  }
};

var $directive = function($type, $childs) {
  console.warn($type + ': надо в сервисы/провайдеры перефигачить');
	$.contextMenu({
		selector: 'div[' + $type + ']',
		items: $.contextMenu.fromMenu('menu#' + $type)
	});
  return function($compile, $templateCache) {
    var def = {};

    def.link = function($scope, $element, $attrs) {
      var $obj = {};
      $obj[$type] = $scope.$root.$item({type: $type, id: $attrs[$type]});
      angular.extend($scope, $obj);
      $element.html($scope.$eval($type + '.title'));
      $compile($element.contents())($scope);
    };

    return def;
  }
};

angular.module('skuapso', ['mgcrea.ngStrap', 'skuapso.test'])
.run(function($http, $rootScope, $templateCache, $filter, $modal, $log) {
  var $preload = function(file) {
    var $file = '/static/tpl/' + file.replace(/\./g, '/') + '.tpl.html';
    $log.debug('$http: %o', $http.pendingRequests);
    $http.get($file)
    .success(function(data) {
      $templateCache.put($file, data);
    });
  };
  $preload('skuapso.owner');
  $preload('skuapso.group');
  $preload('skuapso.object');
  $preload('mgcrea.ngStrap.datepicker');
  $preload('mgcrea.ngStrap.timepicker');

  $rootScope['callbacks'] = {};
  $rootScope['callbacks']['object'] = {};
  $rootScope['sensor'] = true;
  $rootScope['$scopes'] = {};
  $rootScope['toDateTime'] = new Date();
  $rootScope['fromDateTime'] = new Date();
  $rootScope['fromDateTime'].setDate($rootScope['toDateTime'].getDate() - 1);
  $rootScope['paths'];

  function check_dest(arr, el) {
    if (arr.length == 0) return null;
    var p = arr.shift();
    if (arr.length == 0) {
      if (!el[p]) el[p] = function(i) {
        return el[p].filter(function(ele) {return ele.id == i}).pop();
      }
      p += 's';
      if (!el[p]) el[p] = [];
      return el[p];
    } else {
      if (!el[p]) el[p] = {};
      return check_dest(arr, el[p]);
    }
  };
  check_dest(['owner'], $rootScope);
  check_dest(['group'], $rootScope);
  check_dest(['object'], $rootScope);

  $rootScope['t1'] = {t1: "hello"};
  $rootScope['t2'] = {t: "t2"};
  $rootScope['callbacks']['object']['show_track'] = function($obj) {
    if ($obj.type != 'object') return;
    if (!$rootScope.$item($obj)) return;
    var $from = $filter('date')($rootScope['fromDateTime'], 'psql');
    var $to   = $filter('date')($rootScope['toDateTime'], 'psql');
    var $url = '/object/' + $obj.id + '/track/'
              + $from + '/' + $to;
    if ($rootScope['sensor']) $url += '/sensor/1/>/70';
    $http.get($url).success(function(data) {
      var i, line, lines;
      for (i = 0; i < data.length; i++) {
        line = L.polyline(data[i].track);
        line.bindPopup(data[i].object_id + '<br>' + data[i].min + '>>' + data[i].max);
        line.addTo(map);
      }
      //          map.fitBounds(lines.getBounds());
    });
  };
  $rootScope['callbacks']['object']['edit'] = function(opts) {
    if (opts.type != 'object') return;
    var object = $rootScope.$item(opts);
    if (!object) return;
    if (!$rootScope.edit) $rootScope.edit = {};
    $rootScope.edit.object = object;
    var modalOpts = {
      template: '/static/tpl/skuapso/object.edit.tpl.html',
      scope: $rootScope,
      show: true
    };
    var modal = $modal(modalOpts);
  };

  $rootScope['$item'] = function(el) {
    return $rootScope[el['type'] + 's'].filter(function(element) {
      return element.id == el['id'];
    })[0];
  };

  $rootScope['$'] = function(el) {
    return $(el && el.type && el.id) ? $('[' + el.type + '="' + el.id +'"]') : undefined;
  };

  $rootScope['$childs'] = function(filter) {
    var i, arr = [], $sub_types = (filter.type == 'owner') ? ['owner', 'group'] :
      (filter.type == 'group') ? ['group', 'object'] : [];

    for (i = 0; i < $sub_types.length; i++) {
      var fun = (filter.type == $sub_types[i])
        ? function(el) {return el.parent_id == filter.id;}
        : function(el) {return (el[filter.type + '_id'] == filter.id) && (el.parent_id == null);};
      arr = arr.concat(this[$sub_types[i] + 's'].filter(fun));
    }
    return arr;
  };

  $rootScope['add'] = function(el) {
    var e = $$item(el), $type, $dest, $str;
    if (e) {
      $type = e.type
        .split('_')
        .filter(function(el) {return el != '';});
      $dest = check_dest($type, $rootScope);

      $dest.push(e);
      if (e.parent) {
        $str = e.parent.type + '_' + e.parent.id;
        $dest = $rootScope.$scopes[$str];
        if ($dest == undefined)
          $dest = $rootScope.$scopes[$str] = new Array();
        $dest.push(e);
      }
    } else $log.error('rejected %o', data[i]);
    if ($rootScope.$loaded) {
      if (e.parent) {
        if ($dest) {
          $rootScope.$scopes[$str] = $filter('orderBy')($dest, 'title');
        }
//        angular.element($rootScope.$(e.parent)).scope().$digest();
      }
    }
  };

  $http.get('/items').success(function(data) {
    var i;
    for (i = 0; i < data.length; i++)
      $rootScope.add(data[i]);
    $rootScope.$loaded = true;
    for (i in $rootScope.$scopes) {
      $rootScope.$scopes[i] = $filter('orderBy')($rootScope.$scopes[i], 'title');
    }
		$('body').fadeIn('slow');
		map.invalidateSize();
  });
})
.filter('is_null', function() {
  return function(input, expression) {
    var out = new Array(), i = 0;
    for (i; input != undefined && i < input.length; i++) {
      if (input[i][expression] == null) {
        out.push(input[i]);
      }
    }
    return out;
  }
})
.directive('management', function() {
  var def = {};
  return def;
})
.directive('list', function($compile) {
  var def = {};

  def.$scope = {collapsed: '@collapsed'};

  def.controller = function($scope, $rootScope, $attrs) {
    var $type = $attrs.list, $id = $attrs.listParentId || null;

    Object.defineProperty($scope, '$childs', {
      get: function() {
        return $rootScope.$scopes[$type + '_' + $id];
      }
    });

    $scope.collapsed = false;

    $scope.$toggle = function() {
      $scope.collapsed = !$scope.collapsed;
    }
  };

  def.compile = function($element, $attrs) {
    var c = {};
    var $type = $attrs.list , $id = $attrs.listParentId;
		var $div = function($t, $i) {
			return '<div data-type="' + $t + '" data-id' + '="' + $i + '" ' +$t + '="' + $i + '"></div>';
		}

    c['pre'] = function($scope) {
      $element.html('');
      if ($scope.$root.$item({type: $type, id: $id})) {
        $element.append($div($type, $id));
      }
      $compile($element.addClass('list').contents())($scope);
    };

    c['post'] = function($scope) {
      var rebuildChilds = function(newValue, oldValue) {
        var i;
        var $newScope, $newElem;
        var $ul;
        // вероятно можно сделать побыстрее, если не пересоздавать все элементы
        $element.find('>ul').remove();
        if ($scope.$childs != null && $scope.$childs.length > 0 && !$scope.collapsed) {
          $ul = $element.append('<ul></ul>').find('>ul');
          for (i = 0; i < $scope.$childs.length; i++) {
            $type = $scope.$childs[i].type, $id = $scope.$childs[i].id;
            if ($scope.$root.$scopes[$type + '_' + $id]) {
              $newScope = $scope.$new(true);
              $newElem = $compile('<li list="'
                  + $type + '"' + 'list-parent-id ="' + $id + '"></li>')($newScope);
            } else {
							$newElem = '<li>' + $div($type, $id) + '</li>';
              $newElem = $compile($newElem)($scope);
            }
            $newElem.addClass('list-item').addClass($type);
            $ul.append($newElem);
          }
        }
      };

      var toggleChilds = function(newValue, oldValue) {
        if (newValue !== oldValue)
          $element.find('>ul').toggle(100);
        $element.find('>img').attr('src',
            newValue ? '/static/img/button-closed.png' : '/static/img/button-open.png');
      };

      var noChilds = function(newValue, oldValue) {
				var $div, $newElem;
        if (newValue) {
          $element.find('>img').remove();
        } else if($scope.$root.$item({type: $type, id: $id})) {
          $div = $element.find('>div');
          $newElem = ($scope.collapsed) ? 'button-closed.png' : 'button-open.png';
          $newElem = '<img src="/static/img/' + $newElem + '" ng-click="$toggle()">';
          $element.prepend($compile($newElem)($scope));
        }
      };

      $scope.$watch('$childs', rebuildChilds, angular.equals);
      $scope.$watch('$childs.length==0', noChilds, angular.equals);
      $scope.$watch('collapsed', toggleChilds, angular.equals);
    }

    return c;
  };

  def.link = function($scope, $element, $attrs) {
  };

  return def;
})
.directive('owner', $directive('owner', ['owner', 'group']))
.directive('group', $directive('group', ['group', 'object']))
.directive('object', $directive('object', []))
.config(function($datepickerProvider) {
  angular.extend($datepickerProvider.defaults, {
    template: '/static/tpl/mgcrea/ngStrap/datepicker.tpl.html'
    ,autoclose: true
  });
})
.config(function($timepickerProvider) {
  angular.extend($timepickerProvider.defaults, {
    template: '/static/tpl/mgcrea/ngStrap/timepicker.tpl.html'
    ,timeFormat: 'HH:mm'
    ,minuteStep: 10
    ,autoclose: true
  });
})
.config(function($tooltipProvider) {
  angular.extend($tooltipProvider.defaults, {
    template: '/static/tpl/mgcrea/ngStrap/tooltip.tpl.html'
  });
})
.config(function($tabProvider) {
  angular.extend($tabProvider.defaults, {
    template: '/static/tpl/mgcrea/ngStrap/tab.tpl.html'
    ,animation: 'am-flip-x'
  });
})
;

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
