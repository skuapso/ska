'use strict';

angular.module('skuapso-init')
.service('skuapso-objects', ['skuapso-init-object', function() {}])
.service('skuapso-init-object', [
    'skuapso-init',
    '$rootScope',
    '$modal',
    '$filter',
    '$http',
    function(Class, root, modal, filter, http) {
      var SkuapsoObject = function(props) {
        props.type = 'object';
        SkuapsoObject.superclass.constructor.call(this, props);

        this.edit = function() {
          var scope = root.$new(true);
          scope.title = this.title;
          scope.data = Class.data;
          scope.object = new Class.object(this);
          var modalActions = ['$scope', '$modalInstance', function(scope, modal) {
            scope.cancel = function() {
              modal.dismiss('canceled');
            };
            scope.save = function() {
              console.debug('%o', angular.toJson(scope.object));
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
          return this.model.title + ' ' + this.no;
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
          return Class.data.groups[this.group_id];
        },
        set: function(group) {
          this.group_id = group ? group.id : null;
        }
      });
      Object.defineProperty(SkuapsoObject.prototype, 'model', {
        get: function() {
          return Class.data.object_models[this.model_id];
        },
        set: function(model) {
          this.model_id = model.id;
        }
      });

      Class.object = SkuapsoObject;
    }]
)
;