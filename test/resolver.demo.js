/*jslint indent: 2, maxlen: 80, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

function arrLast(arr) { return arr[arr.length - 1]; }

var D = require('lib-demo-util-160404')(), mf = require('../m.js'),
  win = require('window-pmb'), doc = win.document, scTag;

D.expect.verbose = true;

doc.URL = 'http://example.net/';
mf.setWindow(win);
scTag = arrLast(doc.getElementsByTagName('script'));
scTag.src = doc.URL + module.filename.split(/\//).slice(-3).join('/');


D.result = mf.guessModuleUrl(false);
D.expect('regexp', /\.net\/[a-z\-]+\/|$:$0/);
  //= `+ (string) … → ".net/cjs-minifake-pmb/"`

console.error(':TODO: more tests!');









D.ok(module);     //= "+OK all resolver.demo tests passed."
