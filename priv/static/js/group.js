'use strict';

angular.module('skuapso-init')
.service('skuapso-groups', ['skuapso-init-group', function() {}])
.service('skuapso-init-group', [
    'skuapso-init',
    '$rootScope',
    '$modal',
    '$http',
    function(Class, root, modal, http) {
      var SkuapsoGroup = function(props) {
        props.type = 'group';
        SkuapsoGroup.superclass.constructor.call(this, props);

        this.edit = function() {
          var scope = root.$new(true), modalOpts, modalWin, modalActions, diff;
          scope.title = this.title;
          scope.data = Class.data;
          scope.group = new Class.group(this);
          scope.button = {
            save: 'Сохранить',
            close: 'Отменить'
          };

          scope.diff = function() {
            var id, diff = null;
            for (id in this.group) {
              if (this.group[id] != this.data.groups[this.group.id][id]) {
                if (angular.isFunction(this.group[id])) continue;
                if (!diff) diff = {};
                diff[id] = this.group[id];
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
              var data = Class.encode(this.diff());
              http.post('/group/' + this.group.id, data);
            };
          }];

          modalOpts = {
            scope: scope,
            controller: modalActions,
            templateUrl: '/static/tpl/skuapso/group.edit.tpl.html'
          };

          modalWin = modal.open(modalOpts);
        }
      };
      Class.inherit(SkuapsoGroup, Class.Item);
      Object.defineProperty(SkuapsoGroup.prototype, 'parent', {
        get: function() {
          return this.parent_id ? {type: 'group', id: this.parent_id}
          : {type: 'owner', id: this.owner_id};
        }
      });
      Object.defineProperty(SkuapsoGroup.prototype, 'parent_group', {
        get: function() {
          return Class.data.groups[this.parent_id];
        },
        set: function(parentGroup) {
          this.parent_id = parentGroup ? parentGroup.id : null;
        }
      });

      Class.group = SkuapsoGroup;
    }]
)
;
