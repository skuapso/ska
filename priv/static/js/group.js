'use strict';

angular.module('skuapso-init')
.service('skuapso-group', ['skuapso-init-group', function() {}])
.service('skuapso-init-group', [
    'skuapso-init',
    '$rootScope',
    function(Class, root) {
      this.new = function(props) {
        var o = Class.new('group', props.id, props);

        Object.defineProperties(o, {
          'parent': {
            get: function() {
              return this.parent_id ? {type: 'group', id: this.parent_id}
                : {type: 'group', id: null};
            }
          },
          'parent_group': {
            get: function() {
              return Class.data.groups[this.parent_id];
            },
            set: function(parentGroup) {
              this.parent_id = parentGroup ? parentGroup.id : null;
            }
          }
        });

        o.add_sub = function() {
          var scope = root.$new(true);
          scope.header = 'Добавление подгруппы';
          scope.title = this.title;
          scope.modal = Class.group({id: null, type: 'group', parent_id: this.id});
          var onSuccess = function(data, modal) {
            modal.dismiss('ok');
          };

          Class.modal(scope, 'create', {success: onSuccess});
        }

        o.add_object = function() {
          var scope = root.$new(true);
          scope.header = 'Добавление ТС';
          scope.title = '';
          scope.modal = Class.object({id: null, type: 'object', group_id: this.id});

          Class.modal(scope, 'create');
        }
        return o;
      };

      Class.group = this.new;
    }]
)
;
