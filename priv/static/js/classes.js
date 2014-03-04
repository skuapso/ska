'use strict';

angular.module('skuapso-init', [
    'ui.bootstrap',
])
.service('skuapso-init', function() {
    this.inherit = function(Child, Parent) {
      console.debug('parent is %o: %o', Child, Parent);
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
.service('skuapso-init-object', [
    'skuapso-init',
    function(Class) {
      var SkuapsoObject = function(props) {
        props.type = 'object';
        SkuapsoObject.superclass.constructor.call(this, props);
        this.edit = function() {
          var scope = root.$new(true);
          scope.object = this;
          scope.groups = groups;
          var modalActions = ['$scope', '$modalInstance', function(scope, modal) {
            scope.cancel = function() {
              modal.dismiss('canceled');
            };
            scope.save = function() {
              console.debug('%o', scope);
            };
          }];
          var modalOpts = {
            templateUrl: '/static/tpl/skuapso/object.edit.tpl.html',
            scope: scope,
            backdrop: 'static',
            controller: modalActions,
            show: true
          };
          var modalWin = modal.open(modalOpts);
          modalWin.result.then(function() {console.debug('result')});
        };
        this.track = function() {
          var $from = filter('date')(root['fromDateTime'], 'psql');
          var $to   = filter('date')(root['toDateTime'], 'psql');
          var $url = '/object/' + this.id + '/track/'
                    + $from + '/' + $to;
          if (root['sensor']) $url += '/sensor/1/>/70';
          http.get($url).success(function(data) {
            var i, line, lines;
            for (i = 0; i < data.length; i++) {
              line = L.polyline(data[i].track);
              line.bindPopup(data[i].object_id + '<br>' + data[i].min + '>>' + data[i].max);
              line.addTo(map);
            }
            //          map.fitBounds(lines.getBounds());
          });
        }
      };
      Class.inherit(SkuapsoObject, Class.Item);
      Object.defineProperty(SkuapsoObject.prototype, 'title', {
        get: function() {
          return this.model + ' ' + this.no;
        }
      });
      Object.defineProperty(SkuapsoObject.prototype, 'parent', {
        get: function() {
          return this.group_id ? {type: 'group', id: this.group_id}
          : {type: 'owner', id: this.owner_id};
        }
      });
      Object.defineProperty(SkuapsoObject.prototype, 'group', {
        get: function() {
          return groups[this.group_id];
        },
        set: function(group) {
          this.group_id = group.id;
        }
      });
      Class.object = SkuapsoObject;
    }]
)
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
.service('skuapso-objects',         ['skuapso-init-object', function() {}])
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
