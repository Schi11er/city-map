import React, { useState, useEffect } from 'react';

const ShowCities = ({ onMarkersChange }) => {
  const [showMarkers, setShowMarkers] = useState(false);
  const [cityNames, setCityNames] = useState([]);
  const [citiesWithCoords, setCitiesWithCoords] = useState([]);

  useEffect(() => {
    const fetchCityNames = async () => {
      try {
        const response = await fetch(
          "http://localhost:1111/api/buildings/cities"
        );
        const data = await response.json();
        console.log("Städtenamen:", data);
        setCityNames(data);
      } catch (err) {
        console.error("Fehler beim Abrufen der Städte:", err);
      }
    };

    fetchCityNames();
  }, []);

  useEffect(() => {
    const geocodeCities = async () => {
      const cached = JSON.parse(
        localStorage.getItem("cityCoordsCache") || "{}"
      );
      const results = [];
      const cleanedCityNames = cityNames.map((name) =>
        name
          .trim()
          .split(" ")
          .filter((word) => word.length > 2 && !/\d/.test(word))
          .join(" ")
          .trim()
      );
      for (const name of cleanedCityNames) {
        if (cached[name]) {
          results.push({ name, ...cached[name] });
          continue;
        }

        try {
          console.log(`Geocode ${name}`);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              name
            )}&format=json&limit=1`,
            {
              headers: {
                "User-Agent": "my-map-app (you@example.com)",
              },
            }
          );
          const data = await res.json();
          console.log(data);
          if (data.length > 0) {
            const coords = {
              lat: parseFloat(data[0].lat),
              lon: parseFloat(data[0].lon),
            };

            cached[name] = coords;
            results.push({ name, ...coords });

            // Rate-Limit beachten
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (err) {
          console.error(`Geocoding-Fehler bei ${name}:`, err);
        }
      }

      localStorage.setItem("cityCoordsCache", JSON.stringify(cached));
      setCitiesWithCoords(results);
    };

    if (cityNames.length > 0) {
      geocodeCities();
    }
  }, [cityNames]);

  const handleToggleMarkers = () => {
    const newShowMarkers = !showMarkers;
    setShowMarkers(newShowMarkers);
    onMarkersChange(newShowMarkers, citiesWithCoords);
  };

  return (
    <button
      onClick={handleToggleMarkers}
      style={{
        color: "#00ecc4",
        backgroundColor: "transparent",
        border: "1px solid #00ecc4",
        cursor: "pointer",
        width: "90%",
        height: "35px",
        margin: "10px",
      }}
    >
      {showMarkers ? "Städte ausblenden" : "Städte anzeigen"}
    </button>
  );
};

export default ShowCities;
