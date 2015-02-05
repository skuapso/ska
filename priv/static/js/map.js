'use strict';

$.contextMenu({
  selector: 'g.track',
  items: $.contextMenu.fromMenu('menu#track')
});

var skuapsoMap = angular.module('skuapso-map', []);

skuapsoMap
.service('skuapso-map', [
    'skuapso-map-init',
    'skuapso-map-track',
    'skuapso-map-svg-marker',
    function(map) {
      return map;
    }
])
.service('skuapso-map-init', [
    'SkuapsoMapConfig',
    '$http',
    function(config, http) {
      var el = config.element;
      var map = L.map(el, {center: new L.LatLng(55.75, 80.17), zoom: 7});
      var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          name: 'OpenStreetMap',
          layerOptions: {
            attribution: '© OpenStreetMap contributors',
            continuousWorld: true
          }
          });

      map.addLayer(osm);
      var layersControl = new L.Control.Layers({'OpenStreetMap': osm});
      if (config.useGoogle) {
        layersControl.addBaseLayer(new L.Google('HYBRID'), 'Спутниковые снимки Google');
        layersControl.addBaseLayer(new L.Google('TERRAIN'), 'Google');
      }
      if (config.useDGis) {
        layersControl.addBaseLayer(new L.DGis(), '2ГИС');
      }
      if (config.useYandex) {
        layersControl.addBaseLayer(new L.Yandex(), 'Яндекс');
        layersControl.addOverlay(
            new L.Yandex("null", {traffic: true, opacity: 0.8, overlay: true}),
            'Яндекс Траффик');
      }
      map.addControl(layersControl);
      return map;
    }
])
.service('skuapso-map-svg-marker', [
    '$templateCache',
    '$interpolate',
    'skuapso-map-init',
    function(templates, compile, map) {
      map.SvgMarker = L.Path.extend({
        initialize: function(latlng, options) {
          L.Path.prototype.initialize.call(this, options);

          this._latlng = latlng;
        },

        projectLatlngs: function() {
          this.p = this._map.latLngToLayerPoint(this._latlng);
        },

        getAttributes: function() {
          var d = this.options.d;
          var rotate = 'rotate(' + this.options.rotate + ')';
          var translate = 'translate(' + this.p.x + ' ' + this.p.y + ')';
          return {
            d: d,
            transform: translate + ' ' + rotate
          }
        },

        setLatLng: function(ll) {
          this._latlng = ll;
          this.projectLatlngs();
          this._updatePath();
        },

        _updatePath: function() {
          var attrs = map.SvgMarker.prototype.getAttributes.call(this);
          var i = 0,
              keys = Object.keys(attrs),
              l = keys.length,
              el = this._path;
          for (i; i < l; i++) {
            el.setAttribute(keys[i], attrs[keys[i]]);
          }
        }

      });

      map.svgMarker = function(latlng, options) {
        return new map.SvgMarker(latlng, options);
      };

      return map;
    }
])
.service('skuapso-map-track', [
    'skuapso-map-init',
    'skuapso-map-svg-marker',
    'skuapso-map-track-point',
    'skuapso-map-track-pointer',
    function(map, svgMarker, point, pointer) {
      map.Track = L.Polyline.extend({
        initialize: function(events, options) {
          var i = 0,
            len = events.length,
            points = [];
          var loc;
          for (i = 0; i < len; i++) {
            loc = events[i]['1'];
            if (loc != null && loc['latitude'] != null) {
              points.push([loc['latitude'], loc['longitude'], arguments[0][i]]);
            }
          }
          L.Polyline.prototype.initialize.call(this, points, {info: options});
          this._events = events;
        },
        projectLatlngs: function () {
          this._originalPoints = [];

          for (var i = 0, len = this._latlngs.length; i < len; i++) {
            this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
            this._originalPoints[i]['data'] = this._latlngs[i]['data'];
          }
        },
        getPathString: function() {
          var c = this._container;
          $(c).find('.track.point').remove();
          for (var i = 0, len = this._parts.length, str = ''; i < len; i++) {
            str += this._getPathPartStr(this._parts[i]);
          }
          return str;
        },
        _getPathPartStr: function (points) {
          var round = L.Path.VML;
          var ico = angular.extend({},
              (this._map.getZoom() < 15) ? point : pointer);
          var c = this._container;

          for (var j = 0, len2 = points.length, str = '', p, last = null, l; j < len2; j++) {
            p = points[j];
            if (round) {
              p._round();
            }
            l = last == null ? null : Math.sqrt(Math.pow(p.x - last.x, 2) + Math.pow(p.y - last.y, 2));
            str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
            if ((p.data) && ((map.getZoom() >= 15)
                          || (l == null)
                          || (l > ico.size*5))
                          ||(j == (len2 - 1))
            ) {
              console.debug('ico: %o', ico);
              last = p;
              var img = L.Path.prototype._createElement('path');
              img.p = p;
              img.options = {
                rotate: p['data'] ? p['data']['1'] ? p['data']['1']['course'] : 0 : 0,
                d: ico.d
              };
              img._path = img;
              map.SvgMarker.prototype._updatePath.call(img);
              L.DomUtil.addClass(img, 'leaflet-clickable');
              L.DomUtil.addClass(img, ico.className);

              L.DomEvent.on(img, 'click', function(e) {
                L.DomEvent.stopPropagation(e);
                L.popup()
                  .setLatLng([this.data['1'].latitude, this.data['1'].longitude])
                  .setContent(this.data.eventtime)
                  .openOn(map);
              }, p);

              L.DomEvent.on(img, 'mouseover', function(e) {
                L.DomUtil.addClass(this, 'pointed');
              });

              L.DomEvent.on(img, 'mouseout', function(e) {
                L.DomUtil.removeClass(this, 'pointed');
              });

              c.appendChild(img);
            }
          }
          return str;
        },
        _convertLatLngs: function (latlngs, overwrite) {
          var i, len, target = overwrite ? latlngs : [];

          for (i = 0, len = latlngs.length; i < len; i++) {
            target[i] = L.latLng([latlngs[i][0], latlngs[i][1]]);
            target[i]['data'] = latlngs[i][2];
          }
          return target;
        },
        addTo: function() {
          L.Polyline.prototype.addTo.apply(this, arguments);
          var g = this._container;
          g.setAttribute('class', 'track');
          $(g).data('type', this.options.info.type);
          $(g).data('id', this.options.info.id);
          this.on('contextmenu', function() {
            g.setAttribute('class', 'track context-menu-active');
          })
        },
        _fireMouseEvent: function(e) {
          if (!this.hasEventListeners(e.type)) { return; }

          var map = this._map,
          containerPoint = map.mouseEventToContainerPoint(e),
            layerPoint = map.containerPointToLayerPoint(containerPoint),
            latlng = map.layerPointToLatLng(layerPoint);

          this.fire(e.type, {
            latlng: latlng,
            layerPoint: layerPoint,
            containerPoint: containerPoint,
            originalEvent: e
          });

          if (e.type === 'contextmenu') {
            L.DomEvent.preventDefault(e);
          }
        }
      });
      map.track = function(data, options) {
        if (data.data == null) {
          console.warn('null track');
          return;
        }
        var track = new map.Track(data.data, options);
        track.bindPopup(data.object_id + '<br>' + data.min + '>>' + data.max);
        track.addTo(map);
        return track;
      };
    }
])
.constant('SkuapsoMapConfig', {
  useGoogle: true,
  useDGis: true,
  useYandex: true
})
.config(['SkuapsoMapConfig', function(config) {
  config.element = $('div[skuapso-map]')[0];
}])
.config(['SkuapsoMapConfig', function(config) {
  config.track = {
    point: {
      url: 'track-point',
      classes: 'track point',
      size: 10
    },
    pointer: {
      url: 'track-pointer',
      classes: 'track point',
      size: 15
    }
  };
  config.object = {
    point: {
      url: 'track-point',
      classes: 'object',
      size: 20
    },
    pointer: {
      url: 'track-pointer',
      classes: 'object',
      size: 20
    }
  };
}])
;

function svgMarkerOpts(o) {
  return [
    'SkuapsoMapConfig',
    '$templateCache',
    '$interpolate',
    function(config, templates, compile) {
      var get_opts = function(obj, path) {
        var k, i = 1, l = path.length, nPath = [];
        if (l == 0)
          return obj;
        for (i; i < l; i++)
          nPath.push(path[i]);
        return get_opts(obj[path[0]], nPath);
      };
      var path = '/static/tpl/skuapso/svg/' + o.join('-') + '.svg.tpl.html';
      var opts = get_opts(config, o);
      var d = compile(templates.get(path))(opts);
      return {
        d: d,
        className: opts.classes,
        size: opts.size,
        rotate: 0
      }
    }
  ];
}

angular.forEach(
  [['track', 'point'], ['track', 'pointer'], ['object', 'point'], ['object', 'pointer']],
  function(k) {
    skuapsoMap.service('skuapso-map-' + k.join('-'), svgMarkerOpts(k))
  }
);
