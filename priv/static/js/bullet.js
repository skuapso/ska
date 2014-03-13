'use strict';

angular.module('websocket.bullet', [])
.provider('bullet', [function() {
  var that = this;
  this.$get = ['$injector', function(injector) {
    var Bullet = function(url, options) {
      var opts = angular.extend(that.defaults, options || {})
      var bullet = $.bullet(url, opts);
      bullet.onopen = function() {console.debug('opened');};
      bullet.ondisconnect = function() {console.debug('disconnected');};
      bullet.onclose = function() {console.debug('closed');};
      bullet.onheartbeat = function() {this.send('ping');};
      bullet.onmessage = function() {console.debug('new message');};

      Object.defineProperty(this, 'on', {
        set: function(data) {
          var k;
          for (k in data) {
            bullet['on' + k] = data[k];
          }
        }
      });
      this.send = function(data) {
        bullet.send(data);
      };
    };

    return new Bullet(this.url);
  }];

  this.url = 'ws://localhost:8000/ws';
  this.defaults = {
    disableWebSocket: false,
    disableEventSource: false,
    disableXHRPolling: false
  };
}]);
