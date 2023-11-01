#FROM node:18.18.2-alpine3.18 as build-stage
FROM node:18.18.2-bullseye-slim as build-svg

COPY musescore_3.6.2.AppImage /musescore.AppImage

# Instalando dependências para rodar musescore cli
RUN apt-get update -y && apt-get install -y jq libegl-dev libasound2 libjack0 librust-gobject-sys-dev libnss3 xvfb

# Extraindo arquivos do musescore
RUN /musescore.AppImage --appimage-extract

COPY public/collection/ /collection/

# Gerando json para conversão de midias com musescore
RUN find /collection/ -type f -name "*.mscz" | jq -R -s -c 'split("\n") | map({"in":., "out": [[ . | sub(".mscz";"_"),".svg"],"\(. | sub(".mscz";".metajson"))"]})' | jq 'map(select(.in != ""))' > media-generation.json

# Gerando mídias e metajson
RUN xvfb-run /squashfs-root/AppRun -j /media-generation.json

# Removendo arquivos não utilizados
RUN find /collection/* -type f ! -name '*.svg' -a ! -name '*.json' -a ! -name '*.metajson' -delete

FROM node:18.18.2-bullseye-slim as build-node

WORKDIR /app

COPY package.json /app
RUN npm install

COPY src/ /app/src
COPY --from=build-svg /collection /app/public/collection
COPY public/assets /app/public/assets
COPY tsconfig.json /app
COPY tsconfig.node.json /app
COPY vite.config.ts /app
COPY index.html /app

# TODO: Remove example files
RUN npm run index-collection -- -i /app/public/collection -o /app/public/collection
COPY /app/public/collection/index.json /app
RUN npm run build

#FROM node:18.18.2-alpine3.18
FROM nginx:1.25.3-alpine3.18-slim

COPY --from=build-node /app/dist /usr/share/nginx/html
