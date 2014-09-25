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
          var $from = filter('date')(root.controls.fromDateTime, 'psql', 'UTC');
          var $to   = filter('date')(root.controls.toDateTime, 'psql', 'UTC');
          var $url = '/object/' + this.id + '/track/'
                    + $from + '/' + $to;
          var object = this;
          if (root.controls.sensor) $url = '/static/track.json';
          http.get($url).success(function(data) {
            var i, track, lls = [];
            for (i = 0; i < data.length; i++) {
              track = map.track(data[i], {
                type: 'object',
                id: object.id,
                from: data.min,
                to: data.max
              });
              lls = lls.concat(track.getLatLngs());
            }
            if (object.$track) object.closeTrack();
            object.$track = track;
            if (lls.length > 0) {
              map.fitBounds(new L.LatLngBounds(lls));
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
            lat = events[i].location.latitude;
            lon = events[i].location.longitude;
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
        };

        o.mileage = function() {
          var $from = filter('date')(root.controls.fromDateTime, 'psql', 'UTC');
          var $to   = filter('date')(root.controls.toDateTime, 'psql', 'UTC');
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
