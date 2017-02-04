/*jslint indent: 2, maxlen: 80, continue: false, unparam: false */
/* -*- tab-width: 2 -*- */
/*global define:true */
define(function (require, exports) {
  'use strict';
  if (!Object.keys) { throw new Error('inspect.js: Object.keys unsupported'); }
  var EX = exports, mf = require('cjs-minifake-pmb'),
    modReg = mf.require.internalCache();

  EX.names = function () {
    var names = [];
    Object.keys(modReg).map(function (key) {
      if (key.substr(0, 1) === ':') { names[names.length] = key.substr(1); }
            // ^-- .substr: because in MSIE 6, 'foobar'[0] === undefined
    });
    return names;
  };

  EX.files = function () {
    return Object.keys(modReg).filter(RegExp.prototype.exec.bind(/:\/{2}/));
  };























  return EX;
});
