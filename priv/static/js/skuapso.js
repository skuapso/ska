var t = 0;
var toJson = angular.toJson;
var $a = function(el) {return angular.element($(el));};
var $s = function(el) {return $a('html').scope();};
var $i = function(el) {return $a('html').scope().$item();};

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

  if ($opts.type == 'object')
    return new $item_class($opts, {
      model: {
        get: function() {
          return $rootScope.object.model(this.model_id).title;}
      },
      title: {
        get: function() {return this.model + ' ' + this.no;}
      }
    });
  else return new $item_class($opts);
};

var $directive = function($type, $childs) {
  return function($compile, $templateCache) {
    var def = {};

    def.link = function($scope, $element, $attrs) {
      var $obj = {};
      $obj[$type] = $scope.$root.$item($type, $attrs[$type]);
      angular.extend($scope, $obj);
      $element.html($scope.$eval($type + '.title'));
      $compile($element.contents())($scope);
    };

    return def;
  }
};

angular.module('skuapso', [])
.run(function($http, $rootScope, $templateCache, $filter) {
  var $preload = function(file) {
    var $file = '/static/' + file + '.html';
    $http.get($file, {cache: $templateCache})
    .success(function(data) {
      $templateCache.put($file, data);
    });
  };
  $preload('owner');
  $preload('group');
  $preload('object');
  function check_dest(arr, el) {
    if (arr.length == 0) return null;
    var p = arr.shift();
    if (arr.length == 0) {
      if (!el[p]) el[p] = function(i) {
        return el[p].filter(function(ele) {return ele.id == i}).pop();
      }
      p += 's';
      if (!el[p]) el[p] = new Array();
      return el[p];
    } else {
      if (!el[p]) el[p] = new Object();
      return check_dest(arr, el[p]);
    }
  };
  check_dest(['owner'], $rootScope);
  check_dest(['group'], $rootScope);
  check_dest(['object'], $rootScope);
  $rootScope.$item = function($type, $id) {
    return $rootScope[$type + 's'].filter(function(element) {
      return element.id == $id})[0];
  };
  $rootScope.$ = function(el) {
    return $(el && el.type && el.id) ? $('[' + el.type + '=' + el.id +']') : undefined;
  };
  $rootScope.$childs = function(filter) {
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
  $rootScope.$scopes = new Object();
  $rootScope.add = function(el) {
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
    } else console.error('rejected %o', data[i]);
    if ($rootScope.$loaded) {
      if (e.parent) {
        if ($dest) {
          $rootScope.$scopes[$str] = $filter('orderBy')($dest, 'title');
        }
        angular.element($rootScope.$(e.parent)).scope().$digest();
      }
    }
  };
  $rootScope.test = function() {
    this.add({
      id: 1234,
      no: 'test',
      model_id: 1,
      group_id: 150,
      type: 'object'
    });
  };
  $rootScope.rename = function() {
    this.$item('object', 1).model_id=2;
    angular.element($rootScope.$($item.parent)).scope().$digest();
  }

  $http.get('/items').success(function(data) {
    var i;
    for (i = 0; i < data.length; i++)
      $rootScope.add(data[i]);
    $rootScope.$loaded = true;
    for (i in $rootScope.$scopes) {
      $rootScope.$scopes[i] = $filter('orderBy')($rootScope.$scopes[i], 'title');
    }
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

    c['pre'] = function($scope) {
      var $div, $newElem;
      $element.html('');
      if ($scope.$root.$item($type, $id)) {
        $element.append('<div ' + $type + '="' + $id +'"></div>');
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
              $newElem = $compile('<li><div '+ $type + '="' + $id + '"></div></li>')($scope);
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
            newValue ? '/static/img/button-closed.png' : '/static/img/button-opened.png');
      };

      var noChilds = function(newValue, oldValue) {
        if (newValue) {
          $element.find('>img').remove();
        } else if($scope.$root.$item($type, $id)) {
          $div = $element.find('>div');
          $newElem = ($scope.collapsed) ? 'button-closed.png' : 'button-opened.png';
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
;
