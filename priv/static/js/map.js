'use strict';

angular.module('skuapso-map', [])
.service('skuapso-map', [
    function() {
      this.create = function(element) {
        var map = new L.map(element, {center: new L.LatLng(55.75, 80.17), zoom: 7});
        var osm = new L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
