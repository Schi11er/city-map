import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import ShowCities from "./ShowCities";
import ShowBuildings from "./ShowBuildings";
// import L from 'leaflet';

// const customIcon = L.icon({
//   iconUrl: 'red_marker.png',
//   iconSize: [35, 41],
//   iconAnchor: [12, 41],
// });

const App = () => {
  const [showCityMarkers, setShowCityMarkers] = useState(false);
  const [showBuildingMarkers, setShowBuildingMarkers] = useState(false);
  const [cities, setCities] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const handleCityMarkersChange = (shouldShow, citiesData) => {
    setShowCityMarkers(shouldShow);
    setCities(citiesData);
  };

  const handleBuildingMarkersChange = (shouldShow, buildingsData) => {
    setShowBuildingMarkers(shouldShow);
    setBuildings(buildingsData);
  };

  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          width: "15vw", // Dynamische Breite für das Menü
          minWidth: "10cm", // Mindestbreite von 5 cm
          backgroundColor: "#041c4c",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px", // Feste Pixelgröße statt 2vw
              fontWeight: "bold",
              color: "#64a3e2ff",
              margin: "10px",
            }}
          >
            PortfolioBIM
          </h1>
          <h2
            style={{
              fontSize: "18px", // Feste Pixelgröße statt 1.5vw
              fontWeight: "bold",
              color: "#b6c2ceff",
              margin: "10px",
            }}
          >
            Dashboard Gebäudebestand
          </h2>
          <ShowCities 
            onMarkersChange={handleCityMarkersChange}
          />
          <ShowBuildings 
            onMarkersChange={handleBuildingMarkersChange}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            justifyItems: "center",
            alignItems: "center",
            marginTop: "auto",
            backgroundColor: "#ffffff",
            gap: "10px",
            padding: "10px",
          }}
        >
          <a
            href="https://www.htw-dresden.de/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="HTWD_logo.png"
              alt="HTDD Logo"
              style={{ height: "30px", objectFit: "contain" }} // Feste Pixelgröße statt 2vw
            />
          </a>
          <a
            href="https://www.ekkodale.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="ekkodale_logo.svg"
              alt="Ekkodale Logo"
              style={{ height: "30px", objectFit: "contain" }} // Feste Pixelgröße statt 2vw
            />
          </a>
          <a
            href="https://www.metabuild.de/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="metabuild_logo.png"
              alt="Metabuild Logo"
              style={{ height: "30px", objectFit: "contain" }} // Feste Pixelgröße statt 2vw
            />
          </a>
          <a
            href="https://www.zim.de/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="zim_logo.svg"
              alt="ZIM Logo"
              style={{ height: "30px", objectFit: "contain" }} // Feste Pixelgröße statt 2vw
            />
          </a>
        </div>
      </div>
      <div style={{ flex: "1", minWidth: "0" }}>
        <MapContainer
          center={[51, 10]}
          zoom={6}
          style={{ height: "100vh", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {showCityMarkers &&
            cities.map((city, idx) => (
              <Marker key={`city-${idx}`} position={[city.lat, city.lon]}>
                <Popup>{city.name}</Popup>
              </Marker>
            ))}
          {showBuildingMarkers &&
            buildings.map((building, idx) => (
              <Marker key={`building-${idx}`} position={[building.lat, building.lon]}>
                <Popup>
                  <div>
                    <strong>{building.name}</strong>
                    <br />
                    {building.address}
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default App;
