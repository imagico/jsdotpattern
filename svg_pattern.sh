#!/bin/sh
# ------------------------------------------------------------
#  sanitize a jsdotpattern produced SVG for use with Mapnik
# ------------------------------------------------------------

SRC="$1"
TARGET="$2"
CLIP="$3"

if [ -z "$1" ] || [ -z "$2" ] ; then
	echo "Usage: $0 <input> <output> [clip_width]"
	echo "Warning: do not use this on SVGs not generated with jsdotpattern,"
	echo "         it likely don't work"
	exit
fi

SIZE=`grep "width" "$SRC" | head -n 1 | sed "s?\"??g;s?.*width=\([0-9]*\).*?\1?"`

if [ -z "$SIZE" ] ; then
	echo "Error: pattern size could not be read from source SVG."
fi

if [ -z "$CLIP" ] ; then
	CLIP="$SIZE"
fi

cp "$SRC" "$TARGET"

# this is for normal jsdotpattern SVGs with <use>
if grep "<use" "$TARGET" > /dev/null ; then
	echo "processing non-inlined SVG..."
	inkscape -g --verb EditSelectAll --verb SelectionUnGroup \
			--verb EditSelectAll --verb EditUnlinkClone \
			--verb EditSelectAll --verb SelectionUnGroup \
			--verb EditSelectAll --verb SelectionUnGroup \
			--verb EditSelectAll --verb ObjectToPath \
			--verb EditSelectAll --verb SelectionCombine \
			--verb FileSave --verb FileClose \
			--verb FileQuit "$TARGET"

else # this is for inline SVGs
	echo "processing inlined SVG..."
	inkscape -g --verb EditSelectAll --verb SelectionUnGroup \
			--verb EditSelectAll --verb SelectionUnGroup \
			--verb EditSelectAll --verb SelectionUnGroup \
			--verb EditSelectAll --verb SelectionUnGroup \
			--verb EditSelectAll --verb ObjectToPath \
			--verb EditSelectAll --verb SelectionCombine \
			--verb FileSave --verb FileClose \
			--verb FileQuit "$TARGET"

fi

# this is pretty whacky since it depends on the specific structure of the file (specifically the presence of a <desc> tag at the very end)
sed -i -e "s?<desc?<rect width=\"$SIZE\" height=\"$CLIP\" rx=\"0\" x=\"0\" y=\"0\" id=\"rect8566\" style=\"fill:none;fill-opacity:1;stroke:none\" /><desc?" "$TARGET"

inkscape -g --verb EditSelectAll --verb SelectionIntersect \
		--verb FileSave --verb FileClose \
		--verb FileQuit "$TARGET"

inkscape -z --vacuum-defs -l "$TARGET" -f "$TARGET"

