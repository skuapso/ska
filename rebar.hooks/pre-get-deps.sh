#!/bin/sh

DEST=priv/static/js/lib/jQuery-contextMenu

[ ! -d $DEST ] && git clone  https://github.com/medialize/jQuery-contextMenu.git $DEST
exit 0
