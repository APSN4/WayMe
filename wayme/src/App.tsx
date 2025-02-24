import './App.css'
import {MapContainer, Marker, Popup, TileLayer, useMap} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import L from 'leaflet';
import {useEffect, useRef, useState} from "react";

function App() {

    const [startPosition, setStartPosition] = useState([55.743580, 37.630657]);
    const [endPosition, setEndPosition] = useState([55.733280, 37.609791]);

    const RoutingComponent = ({ startPosition, endPosition }) => {
        const map = useMap();
        const routingControlRef = useRef<L.Routing.Control | null>(null);

        // Используем событие карты для добавления маршрута
        if (map) {
            if (routingControlRef.current) {
                // Удаляем старый маршрут, если он существует
                routingControlRef.current.getPlan().spliceWaypoints(0, 1)
                routingControlRef.current.remove();
            }

            // Создаем новый маршрут
            routingControlRef.current = L.Routing.control({
                waypoints: [
                    L.latLng(startPosition),
                    L.latLng(endPosition)
                ],
            }).addTo(map);

            routingControlRef.current.on('routesfound', (event) => {console.log(event)})
        }

        return null;
    };

    return (
        <>
            <MapContainer
                className="map-container"
                center={[55.746667, 37.606545]}
                zoom={15}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='WayMe'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RoutingComponent startPosition={startPosition} endPosition={endPosition} />
            </MapContainer>
        </>
    );
}

export default App
