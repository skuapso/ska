'use strict';

angular.module('skuapso-init', [
    'ui.bootstrap',
    'websocket.bullet',
    'isolated-scope'
])
.service('skuapso-init', ['isolatedScope', function(is) {
  this.new = function(prop) {
    var o = is();
    return angular.extend(o, prop || {});
  };
  this.encode = function(obj) {
    var data = Bert.encode(obj).hex();
    return data;
  };
}])
.service('skuapso-data', [
    '$http',
    '$rootScope',
    '$filter',
    'bullet',
    'skuapso-init',
    'skuapso-objects',
    'skuapso-owners',
    'skuapso-groups',
    'skuapso-objects-models',
    'skuapso-specializations',
    'skuapso-terminals',
    function(http, root, filter, bullet,
      init, objects, owners, groups, objectsModels, spec, terminals) {
      var data = this, emptyArray = [], childs = {};

      root.loaded = false;
      this.objects = objects;
      this.owners = owners;
      this.groups = groups;
      this.object_models = objectsModels;
      this.specializations = spec;
      this.terminals = terminals;
      init.data = this;
      this.get = function(obj) {
        return this[obj.type + 's'][obj.id];
      };
      this.childs = function(obj) {
        return childs[obj.type + '_' + obj.id]
          ? childs[obj.type + '_' + obj.id]
          : emptyArray;
      };
      http.get('items').success(function(items) {
        var i = 0, l = items.length, item;
        for (i; i < l; i++) {
          item = data[items[i].type + 's'][items[i].id] = init[items[i].type](items[i]);
          if (!item.parent) continue;
          if (!childs[item.parent.type + '_' + item.parent.id]) {
            childs[item.parent.type + '_' + item.parent.id] = [];
          }
          childs[item.parent.type + '_' + item.parent.id].push(item);
          Object.defineProperty(item, 'childs', {
            get: function() {
              return childs[this.type + '_' + this.id]
                ? childs[this.type + '_' + this.id]
                : emptyArray;
            }
          });
        }
        for (i in childs) {
          childs[i] = filter('orderBy')(childs[i], 'title');
        }
        Object.defineProperty(root, 'childs', {
          get: function() {
            return childs['owner_null']
              ? childs['owner_null']
              : emptyArray;
          }
        });
        root.loaded = true;
      });
      bullet.on = {
        message: function(e) {
          console.debug("data is %o", e.data);
        }
      };
    }]
)
;
