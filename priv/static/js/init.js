'use strict';

angular.module('skuapso-init', [
    'ui.bootstrap',
    'websocket.bullet',
    'isolated-scope'
])
.service('skuapso-init', [
    'isolatedScope',
    '$rootScope',
    '$modal',
    '$http',
    function(is, root, modal, http) {
      this.new = function(prop) {
        var o = is(), data = this;
        angular.extend(o, prop || {});

        o.edit = function() {
          var scope = root.$new(true), modalOpts, modalWin, modalActions, diff;
          scope.title = this.title;
          scope.data = data.data;
          scope.modal = data[this.type](this);
          scope.button = {
            save: 'Сохранить',
            close: 'Отменить'
          };

          scope.diff = function() {
            var id, diff = null, original = data.data[this.modal.type + 's'][this.modal.id];
            for (id in this.modal) {
              if (this.modal[id] != original[id]) {
                if (angular.isFunction(this.modal[id])) continue;
                if (!diff) diff = {};
                diff[id] = this.modal[id];
              }
            }
            return diff;
          };

          modalActions = ['$scope', '$modalInstance', function(scope, modal) {
            scope.cancel = function() {
              modal.dismiss('canceled');
            };
            scope.save = function() {
              scope.disabled = true;
              var postData = data.encode(this.diff());
              http.post('/' + this.modal.type + '/' + this.modal.id, postData);
            };
          }];

          modalOpts = {
            scope: scope,
            controller: modalActions,
            templateUrl: '/static/tpl/skuapso/edit/' + this.type + '.tpl.html'
          };

          modalWin = modal.open(modalOpts);
        }

        return o;
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
