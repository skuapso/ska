'use strict';

angular.module('skuapso-map', [])
.service('skuapso-map', [
    function() {
      this.create = function(element) {
        this.map = L.map(element).setView([55.75, 80.17], 7);
        var cloudMadeApiKey = '548f0a06c2ed4b34aefe2a2a5bca5c08',
          cloudMadeUrl = 'http://{s}.tile.cloudmade.com/{apiKey}/{styleId}/256/{z}/{x}/{y}.png',
          cloudMadeAttr = 'Map data &copy; '
          + '<a href="http://openstreetmap.org">OpenStreetMap</a> contributors, '
          + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, '
          + 'Imagery © <a href="http://cloudmade.com">CloudMade</a>';
        L.tileLayer(cloudMadeUrl, {
          apiKey: cloudMadeApiKey,
          styleId: 22677,
          attribution: cloudMadeAttr,
          maxZoom: 18
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
