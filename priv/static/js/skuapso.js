'use strict';

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
  return function($compile) {
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

var skuapsoModule = angular.module('skuapso',
    [
    'mgcrea.ngStrap',
    'restangular',
    'skuapso-tree',
    'skuapso-init',
    'skuapso-map',
    'skuapso.test'
    ]);

skuapsoModule
.run(['skuapso-owners', 'skuapso-data', function(o, data) {
  console.debug('objects: %o', o);
  console.debug('data %o', data);
}])
.run(function($http, $rootScope, $templateCache, $filter, $modal, $log) {
  $log.debug('skuapso run');
  var $preload = function(file) {
    var $file = '/static/tpl/' + file.replace(/\./g, '/') + '.tpl.html';
    $http.get($file)
    .success(function(data) {
      $templateCache.put($file, data);
    });
  };
  $preload('skuapso.owner');
  $preload('skuapso.group');
  $preload('skuapso.object');

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
.directive('owner', $directive('owner', ['owner', 'group']))
.directive('group', $directive('group', ['group', 'object']))
.directive('object', $directive('object', []))
.controller('listRoot', ['$scope', 'skuapso-owners', function(scope, owners) {
  console.debug('listRoot');
  var id;
  scope.childs = [];
  for (id in owners) {
    if (!owners[id].parent_id || owners[id].parent_id == null) {
      scope.childs.push(owners[id]);
    }
  }
  scope.node = {};
  console.debug('scope is %o', scope);
}])
.directive('skIf', ['$compile', function(compile) {
  var def = {};

  def.controller = ['$scope', '$element', function(scope, element) {
    scope.$html = element.html();
  }];

  def.link = function(scope, element, attr) {
    scope.$watch(attr.skIf, function(value, oldValue) {
      console.debug('rebuilding content of skIfLoaded');
      if (value && !oldValue) {
        element.html(scope.$html);
      } else {
        element.html('');
      }
      compile(element.contents())(scope);
    });
  };

  def.terminal = true;

  return def;
}])
;
