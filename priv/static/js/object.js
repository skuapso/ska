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
      this.new = function(props) {
        var o = Class.new(props);
        o.type = 'object';

        o.track = function() {
          var $from = filter('date')(root.controls.fromDateTime, 'psql');
          var $to   = filter('date')(root.controls.toDateTime, 'psql');
          var $url = '/object/' + this.id + '/track/'
                    + $from + '/' + $to;
          if (root.controls.sensor) $url += '/sensor/1/>/70';
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
        Object.defineProperty(o, 'title', {
          get: function() {
            var title = this.no;
            title = this.model ? this.model.title + ' ' + title : title;
            title = this.specialization ? this.specialization.title + ' ' + title : title;
            title = this.terminal ? title : '* ' + title;
            return title;
          }
        });
        Object.defineProperty(o, 'parent', {
          get: function() {
            return this.group_id ? {type: 'group', id: this.group_id}
            : {type: 'owner', id: this.owner_id};
          }
        });
        Object.defineProperty(o, 'group', {
          get: function() {
            return Class.data.groups[this.group_id];
          },
          set: function(group) {
            this.group_id = group ? group.id : null;
          }
        });
        Object.defineProperty(o, 'model', {
          get: function() {
            return Class.data.object_models[this.model_id];
          },
          set: function(model) {
            this.model_id = model.id;
          }
        });
        Object.defineProperty(o, 'specialization', {
          get: function() {
            return Class.data.specializations[this.specialization_id];
          },
          set: function(specialization) {
            this.specialization_id = specialization ? specialization.id : null;
          }
        });
        Object.defineProperty(o, 'terminal', {
          get: function() {
            return Class.data.terminals[this.terminal_id];
          },
          set: function(terminal) {
            this.terminal_id = terminal ? terminal.id : null;
          }
        });

          return o;
        };

      Class.object = this.new;
    }]
)
;
