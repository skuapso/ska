var t = 0;
var toJson = angular.toJson;
var $a = function(el) {return angular.element($(el));};
var $s = function() {return $a('html').scope();};
var $i = function(el) {return $s().$item(el);};
var root = function() {return $('html').data('$scope');};

var contextMenuClick = function(ev) {
  root().data.get($('.context-menu-active').data())[$(this).data('action')]();
};

$('menu>command').on('click', contextMenuClick);

$(function() {
  BertClass.prototype.encode_string = function (Obj) {
    var codes = [], i = 0, l = Obj.length;
    for (i; i < l; i++) {
      codes.push(Obj.charCodeAt(i));
    }
    return this.encode_array(codes);
  };

  BertClass.prototype.encode_char = function(Obj) {
    var s = '', c = Obj.charCodeAt(0);
    for(c; c; c = (c>>8)) {
      s = String.fromCharCode(c % 256) + s;
    }
    return s;
  };

  Bert = new BertClass();

  angular.safe_copy = function copy(source, destination){
    if (!destination) {
      destination = source;
      if (source) {
        if (angular.isArray(source)) {
          destination = copy(source, []);
        } else if (angular.isDate(source)) {
          destination = new Date(source.getTime());
        } else if (angular.isRegExp(source)) {
          destination = new RegExp(source.source);
        } else if (angular.isObject(source)) {
          destination = copy(source, {});
        }
      }
    } else {
      if (source === destination) throw ngMinErr('cpi',
          "Can't copy! Source and destination are identical.");
      if (angular.isArray(source)) {
        destination.length = 0;
        for ( var i = 0; i < source.length; i++) {
          destination.push(copy(source[i]));
        }
      } else {
        var h = destination.$$hashKey;
        angular.forEach(destination, function(value, key){
          delete destination[key];
        });
        for ( var key in source) {
          if (key === 'this') continue;
          if (key.charAt(0) === '$') continue;
          if (angular.isFunction(source[key])) continue;
          destination[key] = copy(source[key]);
        }
      }
    }
    return destination;
  };

  if (!angular.isRegExp) angular.isRegExp = function(value) {
    return toString.call(value) === '[object RegExp]';
  };

  if (!angular.isWindow) angular.isWindow = function(obj) {
    return obj && obj.document && obj.location && obj.alert && obj.setInterval;
  };
});
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

Object.defineProperty(String.prototype, 'hex', {
  get: function() {
    function hex(c) {
      return String.fromCharCode(c < 10 ? 48 + c : 87 + c);
    }
    var s = '', i = 0, l = this.length;
    for (i; i < l; i++) {
      s = s + hex(this.charCodeAt(i) >> 4);
      s = s + hex(this.charCodeAt(i) & 0x0F);
    }
    return s;
  }
});
