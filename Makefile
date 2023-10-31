download-musescore:
	wget https://github.com/musescore/MuseScore/releases/download/v3.6.2/MuseScore-3.6.2.548021370-x86_64.AppImage -O musescore_3.6.2.AppImage
	chmod +x musescore_3.6.2.AppImage

svg:
	./musescore_3.6.2.AppImage -j svg-generation.json

build:
	npm run build

run:
	npm run preview

docker:
	docker build -t musicoteca .