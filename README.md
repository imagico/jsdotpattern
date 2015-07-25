
Periodic dot and symbol pattern generator
=========================================

This is the source code of a javascript tool to generate random periodic
dot and symbol patterns for use in map rendering.  You can try it out
in the [online version](http://www.imagico.de/map/jsdotpattern.php).

The tool is completely in javascript, no server side components.  It makes
use of the following javascript libraries:

* [JQuery](http://jquery.com/download/)
* [Snap.svg](http://snapsvg.io/)
* [SVG.toDataURL()](https://github.com/sampumon/SVG.toDataURL)
* [seedrandom](https://github.com/davidbau/seedrandom)
* [slick.js](http://github.com/kenwheeler/slick)

Adding your own symbols
-----------------------

The content of the symbol library is stored in a javascript object in `symbols.js`.  
This is generated with the shell script `symbols_json.sh` from the individual SVG files
in the `symbols` subdirectory.  You can add your own symbols by putting them there and 
running the script again.  Note this is not very robust so you might have troubles when 
you add complex SVGs.  Have a look at the existing files for the expected structure.

Licensed under AGPLv3.

