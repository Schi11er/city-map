import { useState } from "react";

export const useBuildingData = () => {
  const [buildingAdditionalData, setBuildingAdditionalData] = useState({});

  // API-Aufruf um Attribute an Backend zu senden
  const sendAttributesToAPI = async (buildingId, attributes) => {
    try {
      const response = await fetch(`http://localhost:${process.env.REACT_APP_BACKEND_API_PORT}/api/buildings/${buildingId}/attributes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attributes: attributes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Attribute erfolgreich an API gesendet:', result);
      return result;
    } catch (error) {
      console.error('Fehler beim Senden der Attribute an API:', error);
      throw error;
    }
  };

  // Zusätzliche Daten für ein Gebäude speichern (lokal und API)
  const saveAdditionalData = async (buildingIndex, formData, buildingId = null) => {
    const buildingKey = `building-${buildingIndex}`;
    
    // Lokal speichern
    setBuildingAdditionalData(prev => ({
      ...prev,
      [buildingKey]: {
        ...prev[buildingKey],
        ...formData
      }
    }));

    // An API senden falls buildingId vorhanden
    if (buildingId && Object.keys(formData).length > 0) {
      try {
        await sendAttributesToAPI(buildingId, formData);
        console.log(`Attribute für Gebäude ${buildingId} erfolgreich gespeichert`);
      } catch (error) {
        console.error(`Fehler beim Speichern der Attribute für Gebäude ${buildingId}:`, error);
        // Lokale Daten trotzdem behalten, auch wenn API-Call fehlschlägt
      }
    }
  };

  // Zusätzliche Daten für ein Gebäude abrufen
  const getAdditionalData = (buildingIndex) => {
    const buildingKey = `building-${buildingIndex}`;
    return buildingAdditionalData[buildingKey] || {};
  };

  // Alle zusätzlichen Daten abrufen
  const getAllAdditionalData = () => {
    return buildingAdditionalData;
  };

  // Zusätzliche Daten für ein Gebäude löschen
  const clearAdditionalData = (buildingIndex) => {
    const buildingKey = `building-${buildingIndex}`;
    setBuildingAdditionalData(prev => {
      const newData = { ...prev };
      delete newData[buildingKey];
      return newData;
    });
  };

  return {
    buildingAdditionalData,
    saveAdditionalData,
    getAdditionalData,
    getAllAdditionalData,
    clearAdditionalData
  };
};
