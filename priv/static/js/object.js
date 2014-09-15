'use strict';

angular.module('skuapso-init')
.service('skuapso-objects', ['skuapso-init-object', function() {}])
.service('skuapso-init-object', [
    'skuapso-init',
    '$rootScope',
    '$modal',
    '$filter',
    'skuapso-http',
    'skuapso-map',
    function(Class, root, modal, filter, http, map) {
      this.new = function(props) {
        var o = Class.new('object', props.id, props);

        o.track = function() {
          var $from = filter('date')(root.controls.fromDateTime, 'psql');
          var $to   = filter('date')(root.controls.toDateTime, 'psql');
          var $url = '/object/' + this.id + '/track/'
                    + $from + '/' + $to;
          http.get($url).success(function(data) {
            var i, line, lls = [];
            for (i = 0; i < data.length; i++) {
              line = L.track(data[i].track);
              line.bindPopup(data[i].object_id + '<br>' + data[i].min + '>>' + data[i].max);
              line.addTo(map.map);
              lls = lls.concat(line.getLatLngs());
            }
            if (lls.length > 0) {
              map.map.fitBounds(new L.LatLngBounds(lls));
            }
          });
        };
        o.mileage = function() {
          var $from = filter('date')(root.controls.fromDateTime, 'psql');
          var $to   = filter('date')(root.controls.toDateTime, 'psql');
          var $url = '/object/' + this.id + '/mileage/'
                    + $from + '/' + $to;
          console.debug('url: %o', $url);
          window.open($url);
        };

        Object.defineProperty(o, 'title', {
          get: function() {
            var title = this.sortingTitle;
            title = this.terminal ? title : '* ' + title;
            return title;
          }
        });
        Object.defineProperty(o, 'sortingTitle', {
          get: function() {
            var title = this.no;
            title = this.model ? this.model.title + ' ' + title : title;
            title = this.specialization ? this.specialization.title + ' ' + title : title;
            return title;
          }
        });
        Object.defineProperty(o, 'parent', {
          get: function() {
            return {type: 'group', id: this.group_id};
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
            var obj = this;
            if (this.terminal_id && !Class.data.terminals[this.terminal_id]) {
              http.get('terminal/' + this.terminal_id).success(function(data) {
                Class.create(data);
                obj.$digest();
              })
            };
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
