import './App.css'
import {MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import L from 'leaflet';
import {useEffect, useRef, useState} from "react";

function App() {

    const [startPosition, setStartPosition] = useState([55.743580, 37.630657]);
    const [endPosition, setEndPosition] = useState([55.733280, 37.609791]);
    const [position, setPosition] = useState([55.746667, 37.606545])
    const isFirstRender = useRef(true);

    const RoutingComponent = ({ startPositionLocal, endPositionLocal }: any) => {
        const map = useMap();
        const routingControlRef = useRef<L.Routing.Control | null>(null);

        // Используем событие карты для добавления маршрута
        if (map) {
            if (isFirstRender.current ||
                startPosition[0] !== startPositionLocal[0] ||
                startPosition[1] !== startPositionLocal[1] ||
                endPosition[0] !== endPositionLocal[0] ||
                endPosition[1] !== endPositionLocal[1]) {
                if (routingControlRef.current) {
                    // Удаляем старый маршрут, если он существует
                    routingControlRef.current.getPlan().spliceWaypoints(0, 1)
                    routingControlRef.current.remove();
                }

                // Создаем новый маршрут
                routingControlRef.current = L.Routing.control({
                    waypoints: [
                        L.latLng(startPositionLocal),
                        L.latLng(endPositionLocal)
                    ],
                }).addTo(map);

                routingControlRef.current.on('routesfound', (event) => {
                    console.log(event)
                    RequestGetMarkers(startPosition[0], startPosition[1], 5).then(r => {
                        console.log(r)
                        for (let i = 0; i < r.length; i++) {
                            L.marker([r[i].coordinates_float[1], r[i].coordinates_float[0]]).addTo(map);
                        }
                    })
                })
                isFirstRender.current = false;
            }
        }

        return null;
    };

    function MapCoordinatesTitle({ position }: any) {
        return (
            <p className="map-coordinates">
                Latitude: {position[0].toFixed(4)}, Longitude: {position[1].toFixed(4)}
            </p>
        );
    }

    function MapEventsHandler() {
        useMapEvents({
            moveend: (e) => {
                const map = e.target;
                setPosition([map.getCenter().lat, map.getCenter().lng]);
            },
        });
        return null;
    }

    async function RequestGetMarkers(x: number, y: number, r: number) {
        return fetch(`http://localhost:8080/v1/markers?x=${x}&y=${y}&radius=${r}`)
            .then((response) => response.json())
            .then((responseJson) => {
                return responseJson;
            })
            .catch((error) => {
                console.error(error);
            });
    }

    const CustomAttribution = () => {
        const map = useMap();

        useEffect(() => {
            map.attributionControl.setPrefix("Dev version");
        }, [map]);

        return null;
    };

    return (
        <>
            <MapCoordinatesTitle position={position} />
            <MapContainer
                className="map-container"
                center={[55.746667, 37.606545]}
                zoom={15}
                scrollWheelZoom={true}
            >
                <CustomAttribution />
                <TileLayer
                    attribution='WayMe'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RoutingComponent startPositionLocal={startPosition} endPositionLocal={endPosition} />
                <MapEventsHandler />
            </MapContainer>
        </>
    );
}

export default App
