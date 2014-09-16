'use strict';

L.Track = L.Polyline.extend({
  initialize: function(events, options) {
    var i, len, points, loc;
    for (i = 0, len = events.length, points = []; i < len; i++) {
      loc = events[i]['location'];
      if (loc != null && loc['latitude'] != null) {
        points.push([loc['latitude'], loc['longitude'], arguments[0][i]]);
      }
    }
    L.Polyline.prototype.initialize.call(this, points, options);
    this._events = events;
  },
  point: {
    rotate: false,
    width: 7,
    link: '/static/img/p.png'
  },
  pointer: {
    rotate: true,
    width: 10,
    link: '/static/img/l.png'
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
    $(c).find('image').remove();
		for (var i = 0, len = this._parts.length, str = ''; i < len; i++) {
			str += this._getPathPartStr(this._parts[i]);
		}
		return str;
  },
	_getPathPartStr: function (points) {
		var round = L.Path.VML;
    var ico = (this._map.getZoom() < 15) ? this.point : this.pointer;
    var c = this._container;
    var map = this._map;

		for (var j = 0, len2 = points.length, str = '', p; j < len2; j++) {
			p = points[j];
			if (round) {
				p._round();
			}
			str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
      if (p.data) {
        var course = ico.rotate ? p['data']['location']['course'] : 0;
        var img = L.Path.prototype._createElement('image');
        img.setAttribute('x', p.x - ico.width/2);
        img.setAttribute('y', p.y - ico.width/2);
        img.setAttribute('width', ico.width);
        img.setAttribute('height', ico.width);
        img.setAttribute('class', 'track point');
        img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', ico.link);
        img.setAttribute('transform', 'rotate(' + course + ' ' + p.x + ' ' + p.y + ')');

        L.DomUtil.addClass(img, 'leaflet-clickable');

        L.DomEvent.on(img, 'click', function(e) {
			    L.DomEvent.stopPropagation(e);
          L.popup()
            .setLatLng([this.data.location.latitude, this.data.location.longitude])
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

});
L.track = function(latlng, options) {
  return new L.Track(latlng, options);
};

angular.module('skuapso-map', [])
.service('skuapso-map', [
    'SkuapsoMapConfig',
    function(config) {
      this.create = function(element) {
        var map = L.map(element, {center: new L.LatLng(55.75, 80.17), zoom: 7});
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

        this['map'] = map;
      }
    }]
)
.directive('skuapsoMap', ['skuapso-map', function(map) {
  console.warn('вероятно пригодится выделенный scope');
  var def = {};

  def.scope = {};

  def.controller = ['$element', function(ele) {
    map.create(ele[0]);
  }];

  return def;
}])
.constant('SkuapsoMapConfig', {
  useGoogle: false,
  useDGis: false,
  useYandex: false
})
;
