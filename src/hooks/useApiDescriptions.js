import { useState, useEffect } from 'react';

// Globaler Cache für Attributbeschreibungen
let attributeDescriptionsCache = {};
let isLoading = false;
let isLoaded = false;

// Funktion zum Abrufen der Beschreibung für ein Attribut
export const getAttributeDescription = (attributeName) => {
  return attributeDescriptionsCache[attributeName?.toLowerCase()] || null;
};

// Hook zum Laden der API-Beschreibungen
export const useApiDescriptions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDescriptions = async () => {
    // Vermeide mehrfache gleichzeitige Aufrufe
    if (isLoading || isLoaded) return;
    
    isLoading = true;
    setLoading(true);
    setError(null);

    try {
    const baseUrl = window.REACT_APP_DATACAT_API_URL;
    console.log(baseUrl);
    const classUri = 'https://ibpdi.datacat.org/class/dfdb1a51-bd25-11eb-81e7-9735ef069f63';
    const targetUrl = `${baseUrl}/api/Class/Properties/v1?ClassUri=${encodeURIComponent(classUri)}`;
      
      // Versuch 1: Direkter API-Aufruf
      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('API-Beschreibungen geladen (direkt):', data);
          
          if (data.classProperties) {
            data.classProperties.forEach(prop => {
              if (prop.name && prop.description) {
                attributeDescriptionsCache[prop.name.toLowerCase()] = prop.description;
              }
            });
            console.log('Beschreibungs-Cache aktualisiert:', attributeDescriptionsCache);
            isLoaded = true;
            setError(null);
            return;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (directError) {
        console.warn('Direkter API-Aufruf fehlgeschlagen:', directError);
        
        // Versuch 2: CORS-Proxy als Fallback
        try {
          const proxyUrl = 'https://api.allorigins.win/get?url=';
          const proxyResponse = await fetch(proxyUrl + encodeURIComponent(targetUrl));
          const proxyData = await proxyResponse.json();
          
          if (proxyData.contents) {
            const data = JSON.parse(proxyData.contents);
            console.log('API-Beschreibungen geladen (über Proxy):', data);
            
            if (data.classProperties) {
              data.classProperties.forEach(prop => {
                if (prop.name && prop.description) {
                  attributeDescriptionsCache[prop.name.toLowerCase()] = prop.description;
                }
              });
              console.log('Beschreibungs-Cache über Proxy aktualisiert:', attributeDescriptionsCache);
              isLoaded = true;
              setError(null);
              return;
            }
          }
          throw new Error('Keine Daten über Proxy erhalten');
        } catch (proxyError) {
          console.error('Auch Proxy-Aufruf fehlgeschlagen:', proxyError);
          setError(`API-Beschreibungen konnten nicht geladen werden: ${proxyError.message}`);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der API-Beschreibungen:', error);
      setError(error.message);
    } finally {
      isLoading = false;
      setLoading(false);
    }
  };

  // Automatisches Laden beim ersten Hook-Aufruf
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadDescriptions();
    }
  }, []);

  return {
    loading,
    error,
    isLoaded,
    loadDescriptions,
    getDescription: getAttributeDescription
  };
};
