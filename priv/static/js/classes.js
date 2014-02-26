'use strict';

angular.module('skuapso-init', [])
.provider('skuapso-init-item-provider', function () {
  this.$get = [function() {

  }];
})
.service('skuapso-init-item', function() {
  var inherit = function(Child, Parent) {
    var F = function() {};
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
  };

  var SkuapsoItem = function(props) {
    angular.extend(this, props);
  };

  var SkuapsoSimpleType = function(type) {
    var F = function(props) {
      props.type = type;
      SkuapsoSimpleItem.superclass.constructor.call(this, props);
    };
    inherit(F, SkuapsoItem);
    return F;
  };
});

angular.module('skuapso-init').service('skuapso-init', function() {
  var SkuapsoOwner = function(props) {
    props.type = 'owner';
    SkuapsoOwner.superclass.constructor.call(this, props);
  };
  inherit(SkuapsoOwner, SkuapsoItem);

  var SkuapsoGroup = function(props) {
    props.type = 'group';
    SkuapsoGroup.superclass.constructor.call(this, props);
  };
  inherit(SkuapsoGroup, SkuapsoItem);

  var SkuapsoObjectModel = function(props) {
    props.type = 'object_model';
    SkuapsoObjectModel.superclass.constructor.call(this, props);
  };
  inherit(SkuapsoObjectModel, SkuapsoItem);

  var SkuapsoSpecialization = function(props) {
    props.type = 'specialization';
    SkupasoSpecialization.superclass.constructor.call(this, props);
  };
  inherit(SkuapsoSpecialization, SkuapsoItem);

  var SkuapsoObject = function(props) {
    props.type = 'object';
    SkuapsoObject.superclass.constructor.call(this, props);
  };
  inherit(SkuapsoObject, SkuapsoItem);
  Object.defineProperty(SkuapsoObject.prototype, 'title', {
    get: function() {
      return this.model + ' ' + this.no;
    }
  });
  this.object = SkuapsoObject;
  this.group = SkuapsoGroup;
  this.owner = SkuapsoOwner;
});
