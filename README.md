
<!--#echo json="package.json" key="name" underline="=" -->
cjs-minifake-pmb
================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Yet another &quot;modules in browsers&quot; sham.
<!--/#echo -->


What it can't do
----------------

* Understand module metadata. (e.g. `package.json`)
* Detect dependencies of modules.
* Fetch/read modules' files.


Then what's it good for?
------------------------

* If the structure of your module is simple enough,
  `cjs-minifake-pmb` might be able to load it even in circumstances where
  a fully-featured loader could run into problems, including:
  * Package metadata missing or inaccessible.
  * HTML served from local file system instead of from a server.
  * MSIE6, possible even MSIE4 (AMD mode only)
    * At the time you load `m.js`, the shims (`es5-shim.min.js`) from package
      `es5-shim` must be loaded already, and there must be no fake
      `Object.definePropery` yet, so don't load the shams (with letter a)
      from that package. If you need them, too, load them after `m.js`.
      An example can be found in [test/inspect.html](test/inspect.html).



<!--#toc stop="scan" -->



Known issues
------------

* needs more/better tests and docs




License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
