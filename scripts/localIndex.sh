#!/bin/bash
set -e

# Usage: ./scripts/localIndex.sh <mscz_file> <project_name>
# Example: ./scripts/localIndex.sh ~/Downloads/NOVA_MUSICA.mscz "carnaval bh 2026"

MSCZ_FILE="$1"
PROJECT_NAME="$2"
COLLECTION_DIR="public/collection"

if [ -z "$MSCZ_FILE" ] || [ -z "$PROJECT_NAME" ]; then
    echo "Usage: $0 <mscz_file> <project_name>"
    echo "Example: $0 ~/Downloads/NOVA_MUSICA.mscz \"carnaval bh 2026\""
    exit 1
fi

if [ ! -f "$MSCZ_FILE" ]; then
    echo "Error: File not found: $MSCZ_FILE"
    exit 1
fi

# Auto-detect mscore
if command -v mscore &> /dev/null; then
    MSCORE="mscore"
elif [ "$(uname)" = "Darwin" ] && [ -f "/Applications/MuseScore 3.app/Contents/MacOS/mscore" ]; then
    MSCORE="/Applications/MuseScore 3.app/Contents/MacOS/mscore"
else
    echo "Error: mscore not found. Install MuseScore or add it to PATH."
    exit 1
fi

echo "=== Using MuseScore: $MSCORE ==="

# 1. Copy mscz to collection in proper folder structure
FILENAME=$(basename "$MSCZ_FILE")
SONG_NAME="${FILENAME%.mscz}"
DEST_DIR="$COLLECTION_DIR/$PROJECT_NAME/$SONG_NAME"
DEST_FILE="$DEST_DIR/$FILENAME"

echo "=== Copying to collection ==="
mkdir -vp "$DEST_DIR"
cp -v "$MSCZ_FILE" "$DEST_FILE"

# 2. Generate assets for this file only
echo "=== Generating assets ==="
MEDIA_GENERATION_JSON="/tmp/media-generation.json"
BASE_PATH="${DEST_FILE%.mscz}"
echo "[{\"in\":\"$DEST_FILE\", \"out\": [[\"${BASE_PATH}_\",\".svg\"],[\"${BASE_PATH}_\",\".midi\"],\"${BASE_PATH}.midi\",\"${BASE_PATH}.metajson\"]}]" > "$MEDIA_GENERATION_JSON"
cat "$MEDIA_GENERATION_JSON" | jq
"$MSCORE" -j "$MEDIA_GENERATION_JSON"

# 3. Index collection
echo "=== Indexing collection ==="
cp -r "$COLLECTION_DIR" /tmp/collection
npm run index-collection -- -i /tmp/collection -o "$COLLECTION_DIR" --verbose

echo "=== Done ==="
