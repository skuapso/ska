angular.module('skuapso-tree', [])
.directive('list', ['$compile', 'skuapso-data', function(compile, data) {
  var def = {};

  def.controller = ['$scope', function(scope) {
    scope.collapsed = false;

    scope.toggle = function() {
      console.debug('toggle');
      this.collapsed = !this.collapsed;
    }
  }];

  def.link = function(scope, element) {
    scope.$watch('node.childs.length==0', toggleImg);
    scope.$watch('collapsed', toggleChilds, angular.equals);
    scope.$watch('node.childs', rebuildChilds, angular.equals);

    var toggleChilds = function(collapsed, wasCollapsed, scope) {
      console.debug('toggle childs');
      if (collapsed !== wasCollapsed)
        element.find('>ul').toggle(100);
      element.find('>img').attr('src',
          collapsed ? '/static/img/button-closed.png' : '/static/img/button-open.png');
    };

    var toggleImg = function(childsCount, oldValue, scope) {
      console.debug('toggle img');
      var newElem, div;
      if (childsCount) {
        console.debug('removing img');
        element.find('>img').remove();
      } else {
        console.debug('adding img');
        div = element.find('>div');
        newElem = (scope.collapsed) ? 'button-closed.png' : 'button-open.png';
        newElem = '<img src="/static/img/' + newElem + '" ng-click="toggle()">';
        console.debug('img is %o', newElem);
        element.prepend(compile(newElem)(scope));
      }
    };

    var rebuildChilds = function(childs, _childs, scope) {
      if (!angular.isArray(childs)) return;
      var ul, i, len = childs.length, newElem, newScope, item;
      element.find('>ul').remove();
      if (childs && childs.length > 0) {
        ul = element.append('<ul></ul>').find('>ul');
        for (i = 0; i < len; i++) {
          item = scope.node.childs[i];
          newElem = ul.append('<li ' + item.type + '="' + item.id + '"></li>').find('li:last-child');
        }
        compile(element.contents())(scope);
        for (i = 0; i < len; i++) {
          item = scope.node.childs[i];
          if (data.childs(item).length) {
            newElem = element.find('li[' + item.type + '=' + item.id +']');
            newElem.attr('list', '');
            newScope = scope.$new(true);
            newScope.node = scope.node.childs[i];
            newElem = compile(newElem)(newScope);
            newElem = (scope.collapsed) ? 'button-closed.png' : 'button-open.png';
            newElem = '<img src="/static/img/' + newElem + '" ng-click="toggle()">';
            console.debug('img is %o', newElem);
            element.prepend(compile(newElem)(scope));
          }
        }
      }
    };
    rebuildChilds(scope.node.childs, [], scope);
  };

  return def;

  def.compile = function(element) {
    var c = {};
    var $type = $attrs.list , $id = $attrs.listParentId;
		var $div = function($t, $i) {
			return '<div data-type="' + $t + '" data-id' + '="' + $i + '" ' +$t + '="' + $i + '"></div>';
		}

    c['pre'] = function(scope) {
      $element.html('');
      if ($scope.$root.$item({type: $type, id: $id})) {
        $element.append($div($type, $id));
      }
      $compile($element.addClass('list').contents())($scope);
    };

    c['post'] = function(scope) {
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

  return def;
}]);
