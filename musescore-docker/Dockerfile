FROM debian:11.8-slim AS build
    
RUN apt-get update -y && \
    apt-get install -y curl jq libegl-dev libasound2 libjack0 librust-gobject-sys-dev libnss3 xvfb && \
    curl -L https://github.com/musescore/MuseScore/releases/download/v3.6.2/MuseScore-3.6.2.548021370-x86_64.AppImage -o /musescore.AppImage && \
    chmod +x /musescore.AppImage && \
    /musescore.AppImage --appimage-extract && \
    apt-get autoclean && rm /musescore.AppImage && \
    alias musescore-cli="xvfb-run /squashfs-root/AppRun"

# COPY entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

# ENTRYPOINT ["/entrypoint.sh"]
