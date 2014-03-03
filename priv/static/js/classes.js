'use strict';

angular.module('skuapso-init', [
    'mgcrea.ngStrap',
    'restangular'
])
.service('skuapso-init', [
    '$rootScope',
    'skuapso-groups',
    '$modal',
    '$http',
    '$filter',
    function(root, groups, modal, http, filter) {
      var inherit = function(Child, Parent) {
        var F = function() {};
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.prototype.constructor = Child;
        Child.superclass = Parent.prototype;
      };

      var SkuapsoItem = function(props) {
        angular.extend(this, props);
      };

      var SkuapsoSimpleType = function(type) {
        var F = function(props) {
          props.type = type;
          SkuapsoSimpleItem.superclass.constructor.call(this, props);
        };
        inherit(F, SkuapsoItem);
        return F;
      };

      var SkuapsoOwner = function(props) {
        props.type = 'owner';
        SkuapsoOwner.superclass.constructor.call(this, props);
      };
      inherit(SkuapsoOwner, SkuapsoItem);
      Object.defineProperty(SkuapsoOwner.prototype, 'parent', {
        get: function() {
          return this.parent_id ? {type: 'owner', id: this.parent_id}
          : {type: 'owner', id: null};
        }
      });

      var SkuapsoGroup = function(props) {
        props.type = 'group';
        SkuapsoGroup.superclass.constructor.call(this, props);
      };
      inherit(SkuapsoGroup, SkuapsoItem);
      Object.defineProperty(SkuapsoGroup.prototype, 'parent', {
        get: function() {
          return this.parent_id ? {type: 'group', id: this.parent_id}
          : {type: 'owner', id: this.owner_id};
        }
      });

      var SkuapsoObjectModel = function(props) {
        props.type = 'object_model';
        SkuapsoObjectModel.superclass.constructor.call(this, props);
      };
      inherit(SkuapsoObjectModel, SkuapsoItem);

      var SkuapsoSpecialization = function(props) {
        props.type = 'specialization';
        SkupasoSpecialization.superclass.constructor.call(this, props);
      };
      inherit(SkuapsoSpecialization, SkuapsoItem);

      var SkuapsoObject = function(props) {
        props.type = 'object';
        SkuapsoObject.superclass.constructor.call(this, props);
        this.edit = function() {
          var scope = root.$new(true);
          scope.object = this;
          scope.groups = groups;
          var modalOpts = {
            template: '/static/tpl/skuapso/object.edit.tpl.html',
            scope: scope,
            show: true
          };
          var modalWin = modal(modalOpts);
        };
        this.show_track = function() {
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
      inherit(SkuapsoObject, SkuapsoItem);
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
      this.object = SkuapsoObject;
      this.group = SkuapsoGroup;
      this.owner = SkuapsoOwner;
      this.object_model = SkuapsoObjectModel;
}]);

angular.module('skuapso-init')
.service('skuapso-objects',         function() {})
.service('skuapso-owners',          function() {})
.service('skuapso-groups',          function() {})
.service('skuapso-objects-models',  function() {})

.service('skuapso-data', [
    'Restangular',
    '$rootScope',
    'skuapso-init',
    'skuapso-objects',
    'skuapso-owners',
    'skuapso-groups',
    'skuapso-objects-models',
    function(http, root, init, objects, owners, groups, objectsModels) {
      var rest = http.all(''), data = this, emptyArray = [], childs = {};

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
      rest.get('items').then(function(items) {
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
