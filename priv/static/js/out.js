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

  String.prototype.hex = function() {
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
