'use strict';

angular.module('skuapso-init')
.service('skuapso-object', ['skuapso-init-object', function() {}])
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
          var $url = '/object/' + this.id + '/data/'
                    + $from + '/' + $to;
          var object = this;
          http.get($url).success(function(data) {
            var i, track, lls = [];
            for (i = 0; i < data.length; i++) {
              track = map.track(data[i], {
                type: 'object',
                id: object.id,
                from: data.min,
                to: data.max
              });
              if (track)
                lls = lls.concat(track.getLatLngs());
            }
            if (object.$track) object.closeTrack();
            object.$track = track;
            if (lls.length > 0) {
              map.fitBounds(L.latLngBounds(lls));
            }
          });
        };

        o.saveTrack = function() {
          if (!this.$track) return;
          var events = this.$track._events;
          var filename = this.title
            + " (" + this.$track.options.info.from
            + ' ' + this.$track.options.info.to + ')';
          var kml = new Array();
          var lat;
          var lon;
          var i;
          var len;

          kml.push('<?xml version="1.0" encoding="UTF-8"?>');
          kml.push('<kml xmlns="http://earth.google.com/kml/2.0">');
          kml.push('<Document>')
          kml.push('<name>Трек ' + filename + '</name>');
          kml.push('<Placemark>');
          kml.push('<Style id="Senior">'
              + '<LineStyle>'
              + '<color>FF4682B4</color>'
              + '<width>3</width>'
              + '</LineStyle>'
              + '</Style>');

          kml.push('<LineString>');
          kml.push('<coordinates>');
          for (i = 0, len = events.length; i < len; i++) {
            lat = events[i]['1'].latitude;
            lon = events[i]['1'].longitude;
            kml.push(lon + ',' + lat);
          }
          kml.push('</coordinates>');
          kml.push('</LineString>');
          kml.push('</Placemark>');

          kml.push('</Document>');
          kml.push('</kml>');
          kml = kml.join("\n");

          var href =
            'data:application/vnd.google-earth.kml+xml;'
            + 'charset=utf-8;'
            + 'Content-Disposition: attachment;'
            + 'filename='
            + filename + '.kml'
            + ',' + encodeURIComponent(kml);

          window.open(href);
        };

        o.closeTrack = function() {
          map.removeLayer(this.$track);
          delete this.$track;
          return this;
        };

        o.mileage = function() {
          var $from = filter('date')(root.controls.fromDateTime, 'psql', 'UTC');
          var $to   = filter('date')(root.controls.toDateTime, 'psql', 'UTC');
          var $url = '/object/' + this.id + '/summory/'
                    + $from + '/' + $to;
          window.open($url);
          return this;
        };

        o.setLocation = function(loc, oldLoc, scope) {
          if (!angular.isObject(loc)) return;
          var ll = loc ? [loc.latitude, loc.longitude] : null,
              marker;
          if (ll) {
            marker = scope._marker ? scope._marker : L.circleMarker(ll).setRadius(3).addTo(map);
            marker.setLatLng(ll);
            scope._marker = marker;
          }
          return this;
        };

        o.showOnMap = function() {
          var loc = this.data ? this.data['1'] : null,
              ll = loc ? [loc.latitude, loc.longitude] : null;
          if (ll) map.setView(ll);
          return this;
        };

        Object.defineProperties(o, {
          'title': {
            enumerable: true,
            get: function() {
              var title = this.sortingTitle;
              title = this.terminal ? title : '* ' + title;
              return title;
            }
          },
          'sortingTitle': {
            get: function() {
              var title = this.no;
              title = this.model ? this.model.title + ' ' + title : title;
              title = this.specialization ? this.specialization.title + ' ' + title : title;
              return title;
            }
          },
          'parent': {
            get: function() {
              return {type: 'group', id: this.group_id};
            }
          },
          'group': {
            get: function() {
              return Class.data.groups[this.group_id];
            },
            set: function(group) {
              this.group_id = group ? group.id : null;
            }
          },
          'model': {
            get: function() {
              return Class.data.object_models[this.model_id];
            },
            set: function(model) {
              this.model_id = model ? model.id : null;
            }
          },
          'specialization': {
            get: function() {
              return Class.data.specializations[this.specialization_id];
            },
            set: function(specialization) {
              this.specialization_id = specialization ? specialization.id : null;
            }
          },
          'terminal': {
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
          },
        });

        o.state = {};
        Object.defineProperties(o.state, {
          'object': {
            get: function() {
              return o;
            }
          },
          'Группа': {
            enumerable: true,
            get: function() {
              return this.object.group.title;
            }
          },
          'Модель': {
            enumerable: true,
            get: function() {
              return this.object.model.title;
            }
          },
          'Гос. номер': {
            enumerable: true,
            get: function() {
              return this.object.no;
            }
          },
          'Терминал': {
            enumerable: true,
            get: function() {
              return this.object.terminal.title;
            }
          }
        });
        o.sensors = {};

        return o;
      };

      Class.object = this.new;
    }]
)
;
