/**
 * Created by antianlu on 16/5/28.
 */
(function () {
  var _globals;
 
  _globals = (function () {
    return this || (0, eval)('this');
  }());

  if ('undefined' !== typeof module && module.exports) {
    module.exports = doT;
  } else if ('function' === typeof define && define.amd) {
    define(function () {
      return doT;
    });
  } else {
    _globals.doT = doT;
  }

}());