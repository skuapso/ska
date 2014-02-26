angular.module('skuapso-tree', [])
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
});
