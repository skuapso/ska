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
.service('skuapso-init-group', [
    'skuapso-init',
    function(Class) {
      var SkuapsoGroup = function(props) {
        props.type = 'group';
        SkuapsoGroup.superclass.constructor.call(this, props);
      };
      Class.inherit(SkuapsoGroup, Class.Item);
      Object.defineProperty(SkuapsoGroup.prototype, 'parent', {
        get: function() {
          return this.parent_id ? {type: 'group', id: this.parent_id}
          : {type: 'owner', id: this.owner_id};
        }
      });

      Class.group = SkuapsoGroup;
    }]
)
.service('skuapso-init-owner', [
    'skuapso-init',
    function(Class) {
      var SkuapsoOwner = function(props) {
        props.type = 'owner';
        SkuapsoOwner.superclass.constructor.call(this, props);
      };
      Class.inherit(SkuapsoOwner, Class.Item);
      Object.defineProperty(SkuapsoOwner.prototype, 'parent', {
        get: function() {
          return this.parent_id ? {type: 'owner', id: this.parent_id}
          : {type: 'owner', id: null};
        }
      });

      Class.owner = SkuapsoOwner;
    }]
)
.service('skuapso-init-object-model', [
    'skuapso-init',
    function(Class) {
      var SkuapsoObjectModel = function(props) {
        props.type = 'object_model';
        SkuapsoObjectModel.superclass.constructor.call(this, props);
      };
      Class.inherit(SkuapsoObjectModel, Class.Item);

      Class.object_model = SkuapsoObjectModel;
    }]
)
.service('skuapso-init-specialization', [
    'skuapso-init',
    function(Class) {

      var SkuapsoSpecialization = function(props) {
        props.type = 'specialization';
        SkupasoSpecialization.superclass.constructor.call(this, props);
      };
      Class.inherit(SkuapsoSpecialization, Class.Item);

      Class.specialization = SkuapsoSpecialization;
    }]
);

angular.module('skuapso-init')
.service('skuapso-owners',          ['skuapso-init-owner', function() {}])
.service('skuapso-groups',          ['skuapso-init-group', function() {}])
.service('skuapso-objects-models',  ['skuapso-init-object-model', function() {}])

.service('skuapso-data', [
    '$http',
    '$rootScope',
    'skuapso-init',
    'skuapso-objects',
    'skuapso-owners',
    'skuapso-groups',
    'skuapso-objects-models',
    function(http, root, init, objects, owners, groups, objectsModels) {
      var data = this, emptyArray = [], childs = {};

      root.loaded = false;
      this.objects = objects;
      this.owners = owners;
      this.groups = groups;
      this.object_models = objectsModels;
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
        root.loaded = true;
      });
    }]
)
;
