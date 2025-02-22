import './App.css'
import {MapContainer, Marker, Popup, TileLayer} from "react-leaflet";
import 'leaflet/dist/leaflet.css';

function App() {

  return (
    <>
        <MapContainer className="map-container" center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false}>
            <TileLayer
                attribution='WayMe'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[51.505, -0.09]}>
                <Popup>
                    A pretty CSS3 popup. <br /> Easily customizable.
                </Popup>
            </Marker>
        </MapContainer>
    </>
  )
}

export default App
