#!/bin/bash
MSCORE="/Applications/MuseScore 3.app/Contents/MacOS/mscore"
BASE_REF="6451d5d"
MEDIA_GENERATION_JSON="/tmp/media-generation.json"
git diff --name-only $BASE_REF HEAD | grep ".mscz" | jq -R -s 'split("\n") | map(select(.!="") | sub(".mscz";"") | {"in":"\(.).mscz", "out": [[ "\(.)_",".svg"],[ "\(.)_",".midi"],"\(.).midi","\(.).metajson"]})' > $MEDIA_GENERATION_JSON
cat "$MEDIA_GENERATION_JSON" | jq
"$MSCORE" -j "$MEDIA_GENERATION_JSON"
