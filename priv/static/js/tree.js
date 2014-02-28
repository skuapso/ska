angular.module('skuapso-tree', [])
.directive('list', ['$compile', 'skuapso-data', function(compile, data) {
  var def = {};

  def.controller = ['$scope', function(scope) {
    scope.toggle = function() {
      this.collapsed = !this.collapsed;
    }
  }];

  def.link = function(scope, element) {

    var toggleChilds = function(collapsed, wasCollapsed, scope) {
      if (collapsed !== wasCollapsed)
        element.find('>ul').toggle(100);
      element.find('>img').attr('src',
          collapsed ? '/static/img/button-closed.png' : '/static/img/button-open.png');
    };

    var toggleImg = function(childsCount, oldValue, scope) {
      if (element.prop('tagName') != 'LI') return;
      var newElem, div;
      if (childsCount) {
        element.find('>img').remove();
      } else {
        div = element.find('>div');
        newElem = (scope.collapsed) ? 'button-closed.png' : 'button-open.png';
        newElem = '<img src="/static/img/' + newElem + '" ng-click="toggle()">';
        element.prepend(newElem);
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
          }
        }
      }
    };
    scope.$watch('node.childs.length==0', toggleImg, angular.equals);
    scope.$watch('collapsed', toggleChilds, angular.equals);
    scope.$watch('node.childs', rebuildChilds, angular.equals);
  };

  return def;
}]);
