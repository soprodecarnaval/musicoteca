#!/bin/bash
COLL_FOLDER=$1
find "$COLL_FOLDER" -type f -name "*.mscz" | while read FILE; do
		FILENAME=$(basename "$FILE")
		FOLDERNAME=$(basename "$(dirname "$FILE")")
		if [ "$FILENAME" != "$FOLDERNAME.mscz" ]; then
				BASE=$(basename "$FILE" .mscz)
				NEWFOLDER="$(dirname "$FILE")/$BASE"
				NEWFILE="$(dirname "$FILE")/$BASE/$FILENAME"
				mkdir -v "$NEWFOLDER"
				git mv -v "$FILE" "$NEWFILE"
		fi
done
