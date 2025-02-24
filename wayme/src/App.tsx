import './App.css'
import {MapContainer, Marker, Popup, TileLayer, useMap} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import L from 'leaflet';
import {useEffect, useState} from "react";

function App() {

    const [startPosition, setStartPosition] = useState([57.74, 11.94]); // Starting position of marker
    const [endPosition, setEndPosition] = useState([57.6792, 11.949]); // Ending position of marker

    const RoutingComponent = () => {
        const map = useMap(); // Access the map instance

        useEffect(() => {
            if (map) {
                const routingControl = L.Routing.control({
                    waypoints: [
                        //@ts-ignore
                        L.latLng(startPosition),  // Starting point
                        //@ts-ignore
                        L.latLng(endPosition) // Ending point
                    ],
                    routeWhileDragging: false, // Disable route dragging
                    //@ts-ignore
                    createMarker: () => null,  // Disable additional waypoints markers
                }).addTo(map); // Add the routing control to the map

                return () => {
                    routingControl.remove(); // Clean up routing control on unmount
                };
            }
        }, [map, startPosition, endPosition]); // Re-run when either of the positions change

        return null;
    };

    // Handle dragging of markers
    const handleMarkerDrag = (event: any, isStart: boolean) => {
        const { lat, lng } = event.target.getLatLng();
        if (isStart) {
            setStartPosition([lat, lng]); // Update start position when dragging the start marker
        } else {
            setEndPosition([lat, lng]); // Update end position when dragging the end marker
        }
    };

    return (
        <>
            <MapContainer
                className="map-container"
                center={[55.746667, 37.606545]}  // Set the initial map center
                zoom={15}  // Set the zoom level
                scrollWheelZoom={true} // Enable zooming with the scroll wheel
            >
                {/* TileLayer for the map's background */}
                <TileLayer
                    attribution='WayMe'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Start Marker */}
                <Marker
                    //@ts-ignore
                    position={startPosition}
                    draggable
                    eventHandlers={{
                        dragend: (e) => handleMarkerDrag(e, true),
                    }}
                >
                    <Popup>
                        Start Position. <br /> Drag to change.
                    </Popup>
                </Marker>

                {/* End Marker */}
                <Marker
                    //@ts-ignore
                    position={endPosition}
                    draggable
                    eventHandlers={{
                        dragend: (e) => handleMarkerDrag(e, false),
                    }}
                >
                    <Popup>
                        End Position. <br /> Drag to change.
                    </Popup>
                </Marker>

                {/* RoutingComponent */}
                <RoutingComponent />
            </MapContainer>
        </>
    );
}

export default App
