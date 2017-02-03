
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
  * MSIE6, possible even MSIE4.


<!--#toc stop="scan" -->



Known issues
------------

* needs more/better tests and docs




License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
