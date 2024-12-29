#!/bin/bash
BASE_REF=$1
MSCORE=$2
MEDIA_GENERATION_JSON="/tmp/media-generation.json"
git diff --name-only --diff-filter=AM $BASE_REF HEAD | grep ".mscz" | jq -R -s 'split("\n") | map(select(.!="") | sub(".mscz";"") | {"in":"\(.).mscz", "out": [[ "\(.)_",".svg"],[ "\(.)_",".midi"],"\(.).midi","\(.).metajson"]})' > $MEDIA_GENERATION_JSON
cat "$MEDIA_GENERATION_JSON" | jq
"$MSCORE" -j "$MEDIA_GENERATION_JSON"
