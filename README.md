## Install

### How to install OSRM for Moscow

- https://download.openstreetmap.fr/extracts/russia/central_federal_district/moscow-latest.osm.pbf  
- `docker pull osrm/osrm-backend`  
- Подготовить данные через Docker
Команда для извлечения (osrm-extract): `docker run -t -v path:/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/moscow-latest.osm.pbf`   
- Построить индекс маршрутов (osrm-contract): `docker run -t -v path:/data osrm/osrm-backend osrm-contract /data/moscow-latest.osrm`
- Запустить локальный сервер: `docker run -d -p 5000:5000 -v D:/ProjectOther/OSRM:/data osrm/osrm-backend osrm-routed /data/moscow-latest.osrm`

## How to install Meilisearch
- `docker run -it --rm -p 7700:7700 -e MEILI_ENV='development' -e MEILI_NO_ANALYTICS='true' -v ${PWD}/meili_data:/meili_data getmeili/meilisearch:v1.1`