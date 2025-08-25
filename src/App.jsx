import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import ShowCities from "./ShowCities";
import ShowBuildings from "./ShowBuildings";
import BuildingInfoModal from "./BuildingInfoModal";
import { useBuildingData } from "./hooks/useBuildingData";
import { useApiDescriptions } from "./hooks/useApiDescriptions";
import L from 'leaflet';

// Standard Marker Icons in verschiedenen Farben
const createColoredMarkerIcon = (color) => {
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 45" width="29" height="45">
        <path d="M14.5 2C7.6 2 2 7.6 2 14.5C2 21.4 14.5 43 14.5 43S27 21.4 27 14.5C27 7.6 21.4 2 14.5 2Z" fill="${color}" stroke="#000" stroke-width="2"/>
        <circle cx="14.5" cy="14.5" r="7" fill="#fff"/>
        <g transform="translate(14.5, 14.5) scale(0.45) translate(-12, -12)">
          <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9" fill="none" stroke="#000" stroke-width="2"/>
          <path d="M9 22V12h6v10" fill="none" stroke="#000" stroke-width="2"/>
          <path d="M2 10.6L12 2l10 8.6" fill="none" stroke="#000" stroke-width="2"/>
        </g>
      </svg>
    `)}`,
    iconSize: [29, 45],
    iconAnchor: [14, 43],
    popupAnchor: [1, -34],
  });
};

// Icon-Mapping basierend auf PrimaryTypeOfBuilding
const getIconByBuildingType = (primaryType) => {
  const typeColors = {
    'Office': '#3b82f6',                              // Blau
    'Retail': '#f59e0b',                              // Orange  
    'Hotel': '#ec4899',                               // Pink
    'Industrial, Distribution Warehouse': '#22c55e',  // Grün
    'Sonstige': '#6b7280'                            //  Grau für alle anderen
  };
  
  // Standardfarbe für unbekannte oder leere Typen
  const color = typeColors[primaryType] || typeColors['Sonstige'];
  return createColoredMarkerIcon(color);
};

// Deutsche Übersetzungen für Gebäude-Attribute
const getGermanTranslation = (key) => {
  const translations = {
    'name': 'Name',
    'address': 'Adresse',
    'primaryTypeOfBuilding': 'Gebäudetyp',
    'energyEfficiencyClass': 'Energieeffizienzklasse',
    'constructionYear': 'Baujahr',
    'primaryHeatingType': 'Heizungsart',
    'parkingSpaces': 'Parkplätze',
    'lat': 'Breitengrad',
    'lon': 'Längengrad',
    'floorArea': 'Grundfläche',
    'numberOfFloors': 'Anzahl Stockwerke',
    'buildingHeight': 'Gebäudehöhe',
    'totalFloorArea': 'Gesamtfläche',
    'usableFloorArea': 'Nutzfläche',
    'yearOfLastRenovation': 'Jahr der letzten Renovierung',
    'buildingMaterial': 'Baumaterial',
    'roofType': 'Dachtyp',
    'foundationType': 'Fundamenttyp',
    'insulationRating': 'Dämmwert',
    'windowType': 'Fenstertyp',
    'accessibilityFeatures': 'Barrierefreiheit',
    'fireProtectionClass': 'Brandschutzklasse',
    'fireSafetyRating': 'Brandschutzbewertung',
    'solarPanels': 'Solaranlage',
    'smartHomeFeatures': 'Smart Home Ausstattung',
    'waterEfficiencyRating': 'Wassereffizienz',
    'hvacSystem': 'Lüftungsanlage',
    'securitySystem': 'Sicherheitssystem',
    'internetConnectivity': 'Internetanbindung',
    'elevatorCount': 'Anzahl Aufzüge',
    'balconyArea': 'Balkonfläche',
    'gardenArea': 'Gartenfläche',
    'basementArea': 'Kellerfläche',
    'atticArea': 'Dachbodenfläche',
    'maintenanceStatus': 'Wartungsstatus',
    'occupancyStatus': 'Belegungsstatus',
    'rentPerSquareMeter': 'Miete pro m²',
    'propertyValue': 'Immobilienwert',
    'annualEnergyConsumption': 'Jährlicher Energieverbrauch',
    'heatingCosts': 'Heizkosten',
    'waterCosts': 'Wasserkosten',
    'utilityCosts': 'Nebenkosten',
    'propertyTax': 'Grundsteuer',
    'insuranceCosts': 'Versicherungskosten'
  };
  
  return translations[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

// Hilfsfunktion um Werte zu formatieren
const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Nicht verfügbar';
  }
  if (typeof value === 'boolean') {
    return value ? 'Ja' : 'Nein';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const App = () => {
  const [showCityMarkers, setShowCityMarkers] = useState(false);
  const [showBuildingMarkers, setShowBuildingMarkers] = useState(false);
  const [cities, setCities] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

  // Custom Hook für Gebäudedaten verwenden
  const { saveAdditionalData, getAdditionalData } = useBuildingData();
  
  // API-Beschreibungen Hook verwenden
  const { getDescription } = useApiDescriptions();

  // Tooltip-Funktionen
  const showTooltip = (content, event) => {
    if (content) {
      setTooltip({
        visible: true,
        content,
        x: event.pageX + 10,
        y: event.pageY + 10
      });
    }
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  // Komponente für Attribut mit Tooltip
  const AttributeWithTooltip = ({ attributeKey, value, isUserAdded }) => {
    const description = getDescription(attributeKey);
    return (
      <div key={attributeKey} style={{ marginBottom: '4px' }}>
        <strong 
          style={{ 
            color: '#374151',
            cursor: description ? 'help' : 'default'
          }}
          onMouseEnter={(e) => showTooltip(description, e)}
          onMouseLeave={hideTooltip}
        >
          {getGermanTranslation(attributeKey)}:
        </strong>{' '}
        <span style={{ color: '#6b7280' }}>
          {formatValue(value)}
        </span>
      </div>
    );
  };

  // Erweiterte saveAdditionalData Funktion die auch die Gebäude-ID übergibt
  const handleSaveAdditionalData = async (buildingIndex, formData) => {
    // Gebäude-ID aus dem buildings Array ermitteln
    const building = buildings[buildingIndex];
    
    // Verschiedene mögliche ID-Felder prüfen
    const buildingId = building?.id || 
                      building?._id || 
                      building?.buildingId || 
                      building?.uuid ||
                      building?.guid;
    
    console.log('Speichere Attribute für Gebäude:', {
      buildingIndex,
      buildingId,
      availableIds: {
        id: building?.id,
        _id: building?._id,
        buildingId: building?.buildingId,
        uuid: building?.uuid,
        guid: building?.guid
      },
      formData,
      buildingName: building?.name,
      allBuildingKeys: building ? Object.keys(building) : []
    });

    if (!buildingId) {
      console.warn('Keine Gebäude-ID gefunden. Verfügbare Felder:', Object.keys(building || {}));
      console.warn('Speichere nur lokal, ohne API-Call');
    }

    try {
      await saveAdditionalData(buildingIndex, formData, buildingId);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      // Optional: Benutzer über Fehler informieren
      alert('Fehler beim Speichern der Daten. Details in der Konsole.');
    }
  };

  // Modal öffnen
  const openModal = (building, buildingIndex) => {
    setSelectedBuilding(building);
    setSelectedBuildingIndex(buildingIndex);
    setShowModal(true);
  };

  // Modal schließen
  const closeModal = () => {
    setShowModal(false);
    setSelectedBuilding(null);
    setSelectedBuildingIndex(null);
  };

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
          
          {/* Legende für Gebäudetypen */}
          {showBuildingMarkers && (
            <div style={{ 
              margin: "10px", 
              padding: "10px", 
              backgroundColor: "#1e293b", 
              borderRadius: "5px",
              border: "1px solid #374151"
            }}>
              <div style={{ 
                fontSize: "14px", 
                color: "#00ecc4", 
                marginBottom: "8px",
                textAlign: "center",
                fontWeight: "bold"
              }}>
                Gebäudetypen
              </div>
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "4px",
                fontSize: "12px"
              }}>
                {[
                  { type: 'Office', color: '#3b82f6' },
                  { type: 'Retail', color: '#f59e0b' },
                  { type: 'Hotel', color: '#ec4899' },
                  { type: 'Industrial, Distribution Warehouse', color: '#22c55e' },
                  { type: 'Sonstige', color: '#6b7280' }
                ].map((item) => (
                  <div key={item.type} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px",
                    color: "#b6c2ceff"
                  }}>
                    <div style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: item.color,
                      border: "1px solid white",
                      flexShrink: 0
                    }}></div>
                    <span style={{ fontSize: "12px" }}>{item.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <Marker 
                key={`building-${idx}`} 
                position={[building.lat, building.lon]}
                icon={getIconByBuildingType(building.primaryTypeOfBuilding)}
              >
                <Popup>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#1f2937' }}>
                      {building.name || 'Unbenanntes Gebäude'}
                    </strong>
                    <div style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto', 
                      marginTop: '8px',
                      fontSize: '12px'
                    }}>
                      {(() => {
                        // Zusätzliche gespeicherte Daten abrufen und mit Gebäudedaten kombinieren
                        const additionalData = getAdditionalData(idx);
                        
                        // additionalAttributes aus den API-Daten extrahieren
                        const { additionalAttributes, ...buildingWithoutAdditionalAttrs } = building;
                        const combinedBuilding = { 
                          ...buildingWithoutAdditionalAttrs, 
                          ...(additionalAttributes || {}), 
                          ...additionalData 
                        };
                        
                        return (
                          <>
                            {/* Wichtige Attribute in fester Reihenfolge */}
                            {['address', 'constructionYear', 'primaryTypeOfBuilding', 'energyEfficiencyClass', 'primaryHeatingType']
                              .filter(key => combinedBuilding[key] !== null && combinedBuilding[key] !== undefined && combinedBuilding[key] !== '')
                              .map(key => (
                                <AttributeWithTooltip 
                                  key={key}
                                  attributeKey={key}
                                  value={combinedBuilding[key]}
                                  isUserAdded={!!additionalData[key]}
                                />
                              ))}
                            
                            {/* Trennlinie falls weitere Attribute vorhanden */}
                            {Object.entries(combinedBuilding)
                              .filter(([key]) => !['lat', 'lon', 'name', 'address', 'constructionYear', 'primaryTypeOfBuilding', 'energyEfficiencyClass', 'primaryHeatingType', 'additionalAttributes'].includes(key))
                              .filter(([, value]) => value !== null && value !== undefined && value !== '')
                              .length > 0 && (
                                <hr style={{ 
                                  margin: '8px 0', 
                                  border: 'none', 
                                  borderTop: '1px solid #e5e7eb' 
                                }} />
                              )}
                            
                            {/* Alle anderen Attribute alphabetisch sortiert */}
                            {Object.entries(combinedBuilding)
                              .filter(([key]) => !['lat', 'lon', 'name', 'address', 'constructionYear', 'primaryTypeOfBuilding', 'energyEfficiencyClass', 'primaryHeatingType', 'additionalAttributes'].includes(key))
                              .filter(([, value]) => value !== null && value !== undefined && value !== '')
                              .sort(([a], [b]) => getGermanTranslation(a).localeCompare(getGermanTranslation(b)))
                              .map(([key, value]) => (
                                <AttributeWithTooltip 
                                  key={key}
                                  attributeKey={key}
                                  value={value}
                                  isUserAdded={!!additionalData[key]}
                                />
                              ))}
                          </>
                        );
                      })()}
                    </div>
                    <br />
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                      <a 
                        href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${building.lat},${building.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#1e88e5',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        📷 Google Street View
                      </a>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                      <button
                        onClick={() => openModal(building, idx)}
                        style={{
                          backgroundColor: '#00ecc4',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ➕ Info hinzufügen
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Modal für zusätzliche Informationen */}
      <BuildingInfoModal
        isOpen={showModal}
        building={selectedBuilding}
        buildingIndex={selectedBuildingIndex}
        onClose={closeModal}
        onSave={handleSaveAdditionalData}
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <div style={{
          position: 'fixed',
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          backgroundColor: '#1f2937',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          maxWidth: '300px',
          zIndex: 10000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          pointerEvents: 'none',
          wordWrap: 'break-word'
        }}>
          {tooltip.content}
          <div style={{
            position: 'absolute',
            top: '-4px',
            left: '10px',
            width: '8px',
            height: '8px',
            backgroundColor: '#1f2937',
            transform: 'rotate(45deg)'
          }}></div>
        </div>
      )}
    </div>
  );
};

export default App;
