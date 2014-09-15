'use strict';

L.OldLatLng = L.LatLng;
L.LatLng = function(lat, lng, alt) {
  var ll;
  if (alt) {
    ll = (alt.altitude) ? new L.OldLatLng(lat, lng, alt.altitude) :
      typeof alt == 'number' ? new L.OldLatLng(lat, lng, alt) : new L.OldLatLng(lat, lng);
    ll.data = alt;
  } else {
    ll = new L.OldLatLng(lat, lng);
  }
  return ll;
};
L.extend(L.LatLng, L.OldLatLng);
L.LatLng.prototype = L.OldLatLng.prototype;

L.Track = L.Polyline.extend({
  pointer: {
    width: 10,
    height: 10,
    link: '/static/img/l.png'
  },
  getPathString: function() {
    var c = this._container;
    $(c).find('image').remove();
		for (var i = 0, len = this._parts.length, str = ''; i < len; i++) {
			str += this._getPathPartStr(this._parts[i]);
		}
		return str;
  },
  projectLatlngs: function() {
		this._originalPoints = [];

		for (var i = 0, len = this._latlngs.length; i < len; i++) {
			this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
      this._originalPoints[i].data = this._latlngs[i].data;
		}
  },
	_getPathPartStr: function (points) {
		var round = L.Path.VML;

		for (var j = 0, len2 = points.length, str = '', p; j < len2; j++) {
      var c = this._container, img;
			p = points[j];
			if (round) {
				p._round();
			}
			str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
      img = L.Path.prototype._createElement('image');
      img.setAttribute('x', p.x);
      img.setAttribute('y', p.y);
      img.setAttribute('width', this.pointer.width);
      img.setAttribute('height', this.pointer.height);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.pointer.link);
      img.setAttribute('transform', 'rotate(30 '+ p.x + ' ' + p.y + ')');
      c.appendChild(img);
		}
		return str;
	},
});
L.track = function(latlng, options) {
  return new L.Track(latlng, options);
};

angular.module('skuapso-map', [])
.service('skuapso-map', [
    function() {
      this.create = function(element) {
        var map = L.map(element, {center: new L.LatLng(55.75, 80.17), zoom: 7});
        var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          name: 'OpenStreetMap',
          layerOptions: {
            attribution: '© OpenStreetMap contributors',
            continuousWorld: true
          }
        });
        var gglSat = new L.Google('HYBRID');
        var gglTer = new L.Google('TERRAIN');
        var dgis = new L.DGis();
        var yndx = new L.Yandex();
        var ytraffic = new L.Yandex("null", {traffic:true, opacity:0.8, overlay:true});

        map.addLayer(osm);
        var layersControl = new L.Control.Layers({
          'OpenStreetMap': osm,
          'Спутниковые снимки Google': gglSat,
          'Google': gglTer,
          'Дубль ГИС': dgis,
          'Яндекс': yndx
        }, {'Яндекс Траффик': ytraffic});
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
;
