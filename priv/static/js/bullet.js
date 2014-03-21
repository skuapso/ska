'use strict';

angular.module('websocket.bullet', [])
.provider('bullet', [function() {
  var CONNECTING = 0;
  var OPEN = 1;
  var CLOSING = 2;
  var CLOSED = 3;

  var that = this;

  this.$get = ['$injector', function(injector) {
    var Bullet = function(url, options) {
      var opts = angular.extend(that.defaults, options || {});
      var bullet = $.bullet(url, opts);
      var readyState = CONNECTING;

      var pending = [];

      function digest() {
        if (readyState != OPEN) return;
        while (pending.length) {
          bullet.send(pending.shift());
        }
      };

      bullet.onopen = function() {readyState = OPEN; digest();};
      bullet.ondisconnect = function() {readyState = CLOSED;};
      bullet.onclose = function() {readyState = CLOSED;};
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
        var d = angular.safe_copy(data);
        if (angular.isFunction(bullet['onsend'])) {
          d = bullet['onsend'](d);
        }
        pending.push(d);
        digest();
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
  Object.defineProperty(this, 'state', {
    get: function() {
      return readyState;
    }
  });
}]);
