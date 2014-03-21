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
      var types = {
        owner: {sortingValue: 0},
        group: {sortingValue: 1},
        object: {sortingValue: 2}
      };

      this.new = function(t, i, prop) {
        var o = is(), data = this, type = t, id = i;
        delete o['this'];
        angular.extend(o, prop || {});

        Object.defineProperty(o, 'sortingValue', {
          get: function() {return types[this.type].sortingValue;}
        });

        Object.defineProperty(o, 'ref', {
          get: function() {
            var obj = {};
            obj[this.type] = this.id;
            return obj;
          }
        });

        Object.defineProperty(o, 'set', {
          set: function(src) {
            angular.extend(this, src);
            this.$digest();
          }
        });

        Object.defineProperty(o, 'type', {
          get: function() {
            return type;
          },
          set: function(newType) {
            if (type != newType) throw('skuapso', 'types not match');
            return this;
          }
        });

        Object.defineProperty(o, 'id', {
          get: function() {
            return id;
          },
          set: function(newId) {
            if (id != newId) throw('skuapso', 'ids not match');
            return this;
          }
        });

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
              var data = Bert.encode(angular.safe_copy(this.diff())).hex;
              scope.disabled = true;
              http.patch('/' + this.modal.type + '/' + this.modal.id, data)
                .success(function(data) {
                  scope.disabled = false;
                });
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
    }])
.service('skuapso-data', [
    '$http',
    '$rootScope',
    '$filter',
    'bullet',
    'digest',
    'skuapso-init',
    'skuapso-objects',
    'skuapso-owners',
    'skuapso-groups',
    'skuapso-objects-models',
    'skuapso-specializations',
    'skuapso-terminals',
    function(http, root, filter, bullet, digest,
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
          bullet.send({subscribe: item.ref});
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
          item.$watch('parent', function(newVal, oldVal, scope) {
            if (newVal && oldVal && newVal.id == oldVal.id && newVal.type == oldVal.type) return;
            var i= oldVal.type + '_' + oldVal.id;
            childs[i].remove(scope);
            digest.add(data.get(oldVal) ? data.get(oldVal) : root);
            i = newVal.type + '_' + newVal.id;
            if (!childs[i]) childs[i] = [];
            childs[i].push(scope);
            childs[i] = filter('orderBy')(childs[i], ['sortingValue', 'title']);
            digest.add(data.get(newVal) ? data.get(newVal) : root);
            digest.add(root);
          }, angular.equals);
        }
        for (i in childs) {
          childs[i] = filter('orderBy')(childs[i], ['sortingValue', 'title']);
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
      http.patch = function(url, data, config) {
        return http(angular.extend(config || {}, {
          method: 'patch',
          url: url,
          data: data
        }));
      };
      bullet.on = {
        message: function(e) {
          var d = angular.fromJson(e.data);
          data.get(d).set = d;
        },
        send: function(obj) {
          var data = Bert.encode(obj).hex;
          return data;
        }
      };
    }]
)
;
