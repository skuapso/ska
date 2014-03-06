'use strict';

angular.module('skuapso-init', [
    'ui.bootstrap',
])
.service('skuapso-init', function() {
    this.inherit = function(Child, Parent) {
      var F = function() {};
      F.prototype = Parent.prototype;
      Child.prototype = new F();
      Child.prototype.constructor = Child;
      Child.superclass = Parent.prototype;
    };

    this.Item = function(props) {
      angular.extend(this, props);
    };

    this.SimpleType = function(type) {
      var F = function(props) {
        props.type = type;
        this.Item.superclass.constructor.call(this, props);
      };
      inherit(F, SkuapsoItem);
      return F;
    };
})
.service('skuapso-data', [
    '$http',
    '$rootScope',
    '$filter',
    'skuapso-init',
    'skuapso-objects',
    'skuapso-owners',
    'skuapso-groups',
    'skuapso-objects-models',
    'skuapso-specializations',
    'skuapso-terminals',
    function(http, root, filter, init, objects, owners, groups, objectsModels, spec, terminals) {
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
          item = data[items[i].type + 's'][items[i].id] = new init[items[i].type](items[i]);
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
        root.loaded = true;
      });
    }]
)
;
