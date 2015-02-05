'use strict';

angular.module('skuapso-init', [
    'skuapso-http',
    'ui.bootstrap',
    'websocket.bullet',
    'isolated-scope'
])
.service('skuapso-init', [
    'isolatedScope',
    '$rootScope',
    '$modal',
    'skuapso-http',
    'bullet',
    'digest',
    'watcherExp',
    '$filter',
    function(is, root, modal, http, bullet, digest, watcherExp, filter) {
      var types = {
        group: {sortingValue: 0},
        object: {sortingValue: 1}
      };
      var data = this;

      this.update = function(src) {
        var item = this.data.get(src);
        angular.extend(item, src);
        item.$digest();
        root.$digest();
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
          var scope = root.$new(true);
          scope.header = 'Редактирование группы';
          scope.title = this.title;
          scope.modal = data[this.type](this);

          data.modal(scope, 'update');
        };

        return o;
      };

      this.delete = function(src) {
        var item = this.data.get(src);
        if (!item) return;
        var parent_item = this.data.get(item.parent);
        bullet.send({unsubscribe: item.ref});
        var i = 0, l = item.childs ? item.childs.length : 0;
        for (i; i < l; i++) {
          this.delete(item.childs[i]);
        }
        delete this.data[src.type + 's'][src.id];
        if (item.parent) {
          i = parent_item.childs.remove(item);
          parent_item.$digest();
        }
        root.$digest();
      };

      this.create = function(props) {
        var item, parentChilds, parentChildsId;
        if (this.data.get(props)) return;
        if (!this.data[props.type + 's']) {
          console.warn('undefined type %s', props.type);
          return;
        }
        if (!this[props.type]) {
          console.warn('undefined type %s', props.type);
          return;
        }
        item = this.data[props.type + 's'][props.id] = this[props.type](props);
        bullet.send({subscribe: item.ref});
        item.$on('destroed', function() {
          var ev = arguments[0],
            watchers = ev.currentScope.$$watchers,
            updated = new Array(),
            i = 0,
            l = watchers.length,
            keep;
          delete arguments[0];
          for (i; i < l; i++) {
            keep = true;
            angular.forEach(arguments, function(exp) {
              if (watcherExp(watchers[i]).indexOf(exp) > -1) {
                keep = false;
              }
            });
            if (keep) {
              updated.push(watchers[i]);
            }
          }
          ev.currentScope.$$watchers = updated;
        });
        if (!item.parent) return;
        parentChildsId = item.parent.type + '_' + item.parent.id;
        if (!this.childs[parentChildsId]) {
          this.childs[parentChildsId] = [];
        }
        parentChilds = this.childs[parentChildsId];
        parentChilds.push(item);
        Object.defineProperty(item, 'childs', {
          get: function() {
            return data.childs[this.type + '_' + this.id]
          ? data.childs[this.type + '_' + this.id]
          : emptyArray;
          }
        });
        item.$watch('parent', function(newVal, oldVal, scope) {
          if (newVal && oldVal && newVal.id == oldVal.id && newVal.type == oldVal.type) return;
          var i= oldVal.type + '_' + oldVal.id;
          data.childs[i].remove(scope);
          digest.add(data.data.get(oldVal) ? data.data.get(oldVal) : root);
          i = newVal.type + '_' + newVal.id;
          if (!data.childs[i]) data.childs[i] = [];
          data.childs[i].push(scope);
          data.childs[i] = filter('orderBy')(data.childs[i], ['sortingValue', 'title']);
          digest.add(data.data.get(newVal) ? data.data.get(newVal) : root);
          digest.add(root);
        }, angular.equals);
        if (root.loaded) {
          this.childs[parentChildsId] = filter('orderBy')(parentChilds, ['sortingValue', 'title']);
          this.data.get(item.parent).$digest();
        }
      };

      this.modal = function(scope, method, on) {
        var modalActions, modalOpts, modalWin;

        var uri = '/' + scope.modal.type;
        if (scope.modal.id !== null) uri += '/' + scope.modal.id;

        scope.data = this.data;

        scope.button = {
          save: 'Сохранить',
          close: 'Отменить'
        };

        scope.diff = function() {
          var id, diff = null, original = data.data[this.modal.type + 's'][this.modal.id];
          for (id in this.modal) {
            if (id.charAt(0) == '$') continue;
            if (!original
                || (typeof original[id] == 'undefined')
                || (typeof this.modal[id] == 'undefined')
                || (this.modal[id] != original[id])) {
              if (angular.isFunction(this.modal[id])) continue;
              if (!diff) diff = {};
              diff[id] = this.modal[id];
            }
          }
          return diff;
        };

        scope.typeaheadTitle = function(type) {
          return this.modal[type] ? this.modal[type].title : '';
        };

        modalActions = ['$scope', '$modalInstance', function(scope, modal) {
          scope.cancel = function() {
            if (on && on.cancel && angular.isFunction(on.cancel)) on.cancel(modal);
            modal.dismiss('canceled');
          };
          scope.save = function() {
            var data = Bert.encode(angular.safe_copy(this.diff())).hex;
            scope.disabled = true;
            http[method](uri, data)
              .success(function(data) {
                if (on && on.success && angular.isFunction(on.success)) on.success(data, modal);
                scope.disabled = false;
              })
              .error(function(data) {
                if (on && on.error && angular.isFunction(on.error)) on.error(data, modal);
                scope.disable = false;
              });
          };
        }];

        modalOpts = {
          scope: scope,
          controller: modalActions,
          templateUrl: '/static/tpl/skuapso/edit/' + scope.modal.type + '.tpl.html'
        };

        modalWin = modal.open(modalOpts);
      };

    }])
.service('skuapso-data', [
    'skuapso-http',
    '$rootScope',
    '$filter',
    'bullet',
    'digest',
    'skuapso-init',
    'skuapso-object',
    'skuapso-group',
    'skuapso-object-model',
    'skuapso-object-sensor',
    'skuapso-object-tool',
    'skuapso-specialization',
    'skuapso-terminal',
    'skuapso-terminal-model',
    'skuapso-sensor',
    'skuapso-geo',
    function(http, root, filter, bullet, digest,
      init, objects, groups, objectsModels, objectsSensors, objectsTools,
      spec, terminals, terminalsModels, sensors, geo) {
      var data = this, childs = {};

      root.loaded = false;
      this.objects = objects;
      this.groups = groups;
      this.object_models = objectsModels;
      this.object_sensors = objectsSensors;
      this.object_tools = objectsTools;
      this.specializations = spec;
      this.terminals = terminals;
      this.terminal_models = terminalsModels;
      this.sensors = sensors;
      this.geos = geo;
      init.data = this;
      init.childs = childs;
      this.get = function(obj) {
        if (!obj) return;
        var keys = Object.keys(obj);
        var type, id;
        if (keys.length == 1) {
          type = keys[0] + 's';
          id = obj[keys[0]];
        } else {
          type = obj.type + 's';
          id = obj.id;
        }
        if (this[type]) {
          return this[type][id];
        } else {
          console.warn("undefined type %o", obj);
          return;
        }
      };
      this.childs = function(obj) {
        return childs[obj.type + '_' + obj.id]
          ? childs[obj.type + '_' + obj.id]
          : emptyArray;
      };
      http.get('items').success(function(items) {
        var i = 0, l = items.length;
        for (i; i < l; i++) {
          init.create(items[i]);
        }
        for (i in childs) {
          childs[i] = filter('orderBy')(childs[i], ['sortingValue', 'sortingTitle', 'title']);
        }
        Object.defineProperty(root, 'childs', {
          get: function() {
            return childs['group_null']
              ? childs['group_null']
              : emptyArray;
          }
        });
        root.loaded = true;
      });
      bullet.on = {
        message: function(e) {
          var d = angular.fromJson(e.data);
          init[d.action](d.data);
        },
        send: function(obj) {
          var data = Bert.encode(obj).hex;
          return data;
        }
      };
    }])
;
