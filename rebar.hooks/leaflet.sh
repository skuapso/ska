#!/bin/sh

VER=0.7.2
FILE=leaflet-${VER}
DEST=priv/static/js/lib/leaflet

[ -e ${FILE}.zip ] && rm ${FILE}.zip
[ -d $DEST-$VER ] && rm -rf $DEST-$VER
[ -h $DEST ] && rm -f $DEST

wget http://leaflet-cdn.s3.amazonaws.com/build/${FILE}.zip
unzip -x ${FILE}.zip -d $DEST-${VER}
rm ${FILE}.zip
ln -s $FILE $DEST
