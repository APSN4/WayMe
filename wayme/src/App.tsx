import './App.css'
import {MapContainer, Marker, Popup, TileLayer} from "react-leaflet";
import 'leaflet/dist/leaflet.css';

function App() {

  return (
    <>
        <MapContainer className="map-container" center={[55.746667, 37.606545]} zoom={15} scrollWheelZoom={false}>
            <TileLayer
                attribution='WayMe'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[55.746667, 37.606545]}>
                <Popup>
                    A pretty CSS3 popup. <br /> Easily customizable.
                </Popup>
            </Marker>
        </MapContainer>
    </>
  )
}

export default App
