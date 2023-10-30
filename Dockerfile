#FROM node:18.18.2-alpine3.18 as build-stage
FROM node:18.18.2-bullseye-slim

COPY musescore_3.6.2.AppImage /musescore.AppImage

RUN apt-get update -y && apt-get install -y jq libegl-dev libasound2 libjack0 librust-gobject-sys-dev libnss3 xvfb

RUN /musescore.AppImage --appimage-extract

COPY public/collection/ /collection/

RUN find /collection/ -type f -name "*.mscz" | jq -R -s -c 'split("\n") | map({"in":., "out": [[ . | sub(".mscz";"_"),".svg"]]})' | jq 'map(select(.in != ""))' > media-generation.json

RUN xvfb-run /squashfs-root/AppRun -j /media-generation.json

RUN node run build

