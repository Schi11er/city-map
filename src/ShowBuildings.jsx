import React, { useState, useEffect } from 'react';

const ShowBuildings = ({ onMarkersChange }) => {
  const [showMarkers, setShowMarkers] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [buildingsWithCoords, setBuildingsWithCoords] = useState([]);
  const [buildingsWithoutCoords, setBuildingsWithoutCoords] = useState(0);
  const [minYear, setMinYear] = useState(1900);
  const [maxYear, setMaxYear] = useState(new Date().getFullYear());
  const [yearFilter, setYearFilter] = useState(1900);
  const [selectedEfficiencyClasses, setSelectedEfficiencyClasses] = useState(['A', 'B', 'C', 'D', 'E', 'F', 'k.A.']);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch(
          `http://localhost:${process.env.REACT_APP_BACKEND_API_PORT}/api/buildings`
        );
        const data = await response.json();
        console.log("Gebäude:", data);
        
        // Debug: Zeige verfügbare Attribute des ersten Gebäudes
        if (data.length > 0) {
          console.log("Verfügbare Attribute im ersten Gebäude:", Object.keys(data[0]));
          console.log("Erstes Gebäude komplett:", data[0]);
        }
        
        setBuildings(data);
      } catch (err) {
        console.error("Fehler beim Abrufen der Gebäude:", err);
      }
    };

    fetchBuildings();
  }, []);

  useEffect(() => {
    const processBuildings = () => {
      const results = [];
      let invalidCount = 0;
      let years = [];

      buildings.forEach(building => {
        // Prüfen ob lat und lon vorhanden sind
        const lat = building.address?.geoCoordinate?.latitude;
        const lon = building.address?.geoCoordinate?.longitude;
        
        // Baujahr extrahieren
        const constructionYear = building.constructionYear;
        
        // Energieeffizienzklasse extrahieren
        const efficiencyClass = building.energyEfficiencyClass;
        
        // PrimaryTypeOfBuilding extrahieren
        const primaryType = building.primaryTypeOfBuilding || 'Sonstige';
        
        if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
          const buildingData = {
            // Alle ursprünglichen API-Daten beibehalten
            ...building,
            // Spezifische Eigenschaften für die Karte überschreiben/hinzufügen
            name: building.name,
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            address: `${building.address.streetName || ''} ${building.address.houseNumber || ''}, ${building.address.postalCode || ''}, ${building.address.city || ''}, ${building.address.country || ''}`.replace(/\s+/g, ' ').trim(),
            constructionYear: constructionYear ? parseInt(constructionYear) : null,
            energyEfficiencyClass: efficiencyClass || null,
            primaryTypeOfBuilding: primaryType,
            primaryHeatingType: building.primaryHeatingType || null,
            parkingSpaces: building.parkingSpaces || null,
          };
          
          results.push(buildingData);
          
          // Jahr für Min/Max sammeln
          if (constructionYear && !isNaN(parseInt(constructionYear))) {
            years.push(parseInt(constructionYear));
          }
        } else {
          invalidCount++;
          console.warn(`Gebäude "${building.name}" hat keine gültigen Koordinaten:`, { lat, lon });
        }
      });

      // Min/Max Jahre setzen
      if (years.length > 0) {
        const minFoundYear = Math.min(...years);
        const maxFoundYear = Math.max(...years);
        setMinYear(minFoundYear);
        setMaxYear(maxFoundYear);
        setYearFilter(minFoundYear);
      }

      setBuildingsWithCoords(results);
      setBuildingsWithoutCoords(invalidCount);
      
      if (invalidCount > 0) {
        console.info(`${invalidCount} Gebäude konnten nicht angezeigt werden (fehlende/ungültige Koordinaten)`);
      }
    };

    if (buildings.length > 0) {
      processBuildings();
    }
  }, [buildings]);  const handleToggleMarkers = () => {
    const newShowMarkers = !showMarkers;
    setShowMarkers(newShowMarkers);
    
    // Gefilterte Gebäude basierend auf Baujahr und Energieeffizienzklasse
    const filteredBuildings = buildingsWithCoords.filter(building => {
      // Baujahr-Filter
      const yearMatch = !building.constructionYear || building.constructionYear >= yearFilter;
      
      // Energieeffizienzklassen-Filter
      const efficiencyMatch = (!building.energyEfficiencyClass || building.energyEfficiencyClass === 'k') ? 
                             selectedEfficiencyClasses.includes('k.A.') :
                             selectedEfficiencyClasses.includes(building.energyEfficiencyClass);
      
      return yearMatch && efficiencyMatch;
    });
    
    onMarkersChange(newShowMarkers, filteredBuildings);
  };

  const handleYearFilterChange = (e) => {
    const newYearFilter = parseInt(e.target.value);
    setYearFilter(newYearFilter);
    
    // Wenn Marker bereits angezeigt werden, aktualisiere sie mit dem neuen Filter
    if (showMarkers) {
      const filteredBuildings = buildingsWithCoords.filter(building => {
        const yearMatch = !building.constructionYear || building.constructionYear >= newYearFilter;
        const efficiencyMatch = (!building.energyEfficiencyClass || building.energyEfficiencyClass === 'k') ? 
                               selectedEfficiencyClasses.includes('k.A.') :
                               selectedEfficiencyClasses.includes(building.energyEfficiencyClass);
        return yearMatch && efficiencyMatch;
      });
      onMarkersChange(true, filteredBuildings);
    }
  };

  const handleEfficiencyClassToggle = (efficiencyClass) => {
    const newSelectedClasses = selectedEfficiencyClasses.includes(efficiencyClass)
      ? selectedEfficiencyClasses.filter(cls => cls !== efficiencyClass)
      : [...selectedEfficiencyClasses, efficiencyClass];
    
    setSelectedEfficiencyClasses(newSelectedClasses);
    
    // Wenn Marker bereits angezeigt werden, aktualisiere sie mit dem neuen Filter
    if (showMarkers) {
      const filteredBuildings = buildingsWithCoords.filter(building => {
        const yearMatch = !building.constructionYear || building.constructionYear >= yearFilter;
        const efficiencyMatch = (!building.energyEfficiencyClass || building.energyEfficiencyClass === 'k') ? 
                               newSelectedClasses.includes('k.A.') :
                               newSelectedClasses.includes(building.energyEfficiencyClass);
        return yearMatch && efficiencyMatch;
      });
      onMarkersChange(true, filteredBuildings);
    }
  };

  return (
    <div style={{ width: "90%", margin: "10px" }}>
      <button
        onClick={handleToggleMarkers}
        style={{
          color: "#00ecc4",
          backgroundColor: "transparent",
          border: "1px solid #00ecc4",
          cursor: "pointer",
          width: "100%",
          height: "35px",
        }}
      >
        {showMarkers ? "Gebäude ausblenden" : "Gebäude anzeigen"}
      </button>
      
      {/* Baujahr-Filter */}
      {showMarkers && maxYear > minYear && (
        <div style={{ marginTop: "10px", padding: "10px 5px" }}>
          <div style={{ 
            fontSize: "14px", // Feste Pixelgröße statt 0.9vw
            color: "#00ecc4", 
            marginBottom: "8px",
            textAlign: "center"
          }}>
            Baujahr Filter: ab {yearFilter}
          </div>
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={yearFilter}
            onChange={handleYearFilterChange}
            style={{
              width: "100%",
              height: "4px",
              backgroundColor: "#333",
              outline: "none",
              cursor: "pointer",
              accentColor: "#00ecc4"
            }}
          />
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            fontSize: "10px", // Feste Pixelgröße statt 0.7vw
            color: "#b6c2ceff",
            marginTop: "5px"
          }}>
            <span>{minYear}</span>
            <span>{maxYear}</span>
          </div>
        </div>
      )}

      {/* Energieeffizienzklassen-Filter */}
      {showMarkers && (
        <div style={{ marginTop: "10px", padding: "10px 5px" }}>
          <div style={{ 
            fontSize: "14px", // Feste Pixelgröße statt 0.9vw
            color: "#00ecc4", 
            marginBottom: "8px",
            textAlign: "center"
          }}>
            Energieeffizienzklassen
          </div>
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap",
            justifyContent: "center", 
            gap: "3px"
          }}>
            {['A', 'B', 'C', 'D', 'E', 'F', 'k.A.'].map((efficiencyClass) => {
              const isSelected = selectedEfficiencyClasses.includes(efficiencyClass);
              const getColor = (cls) => {
                switch(cls) {
                  case 'A': return '#22c55e'; // grün
                  case 'B': return '#84cc16'; // hellgrün
                  case 'C': return '#eab308'; // gelb
                  case 'D': return '#f97316'; // orange
                  case 'E': return '#ef4444'; // rot
                  case 'F': return '#b91c1c'; // dunkelrot
                  case 'k.A.': return '#6b7280'; // grau
                  default: return '#6b7280';
                }
              };
              
              return (
                <button
                  key={efficiencyClass}
                  onClick={() => handleEfficiencyClassToggle(efficiencyClass)}
                  style={{
                    backgroundColor: isSelected ? getColor(efficiencyClass) : 'transparent',
                    color: isSelected ? '#fff' : getColor(efficiencyClass),
                    border: `1px solid ${getColor(efficiencyClass)}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px", // Feste Pixelgröße statt 0.8vw
                    fontWeight: "bold",
                    padding: "4px 6px",
                    minWidth: "30px", // Feste Pixelgröße statt 2vw
                    width: efficiencyClass === 'k.A.' ? "calc(20% - 2.5px)" : "calc(13.33% - 2.5px)",
                    height: "25px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 1 auto"
                  }}
                >
                  {efficiencyClass}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {buildingsWithoutCoords > 0 && (
        <div 
          style={{
            fontSize: "12px", // Feste Pixelgröße statt 0.8vw
            color: "#b6c2ceff",
            marginTop: "5px",
            textAlign: "center"
          }}
        >
          {buildingsWithoutCoords} Gebäude ohne Koordinaten
        </div>
      )}
    </div>
  );
};

export default ShowBuildings;
