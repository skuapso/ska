'use strict';

angular.module('skuapso-map', [])
.service('skuapso-map', [
    function() {
      this.create = function(element) {
        this.map = L.map(element).setView([55.75, 80.17], 7);
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          name: 'OpenStreetMap',
          layerOptions: {
            attribution: '© OpenStreetMap contributors',
            continuousWorld: true
          }
        })
        .addTo(this.map);
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
