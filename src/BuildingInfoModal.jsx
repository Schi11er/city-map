import { useState, useEffect } from "react";

const BuildingInfoModal = ({ 
  isOpen, 
  building, 
  buildingIndex, 
  onClose, 
  onSave 
}) => {
  const [classProperties, setClassProperties] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const datacatApiUrl = window.REACT_APP_DATACAT_API_URL;

  // API-Aufruf für die Klasseneigenschaften
  const fetchClassProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ziel-URL für die DataCat API aus Umgebungsvariable
      const classUri = 'https://ibpdi.datacat.org/class/dfdb1a51-bd25-11eb-81e7-9735ef069f63';
      const targetUrl = `${datacatApiUrl}/api/Class/Properties/v1?ClassUri=${encodeURIComponent(classUri)}`;

      // Versuch 1: Direkter Aufruf
      const response = await fetch(targetUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Antwort:', data);
      setClassProperties(data.classProperties || []);
      setError(null);
    } catch (error) {
      console.error('Direkter API-Aufruf fehlgeschlagen:', error);
      setError(`Direkter Aufruf: ${error.message}`);

      // Versuch 2: Mit CORS-Proxy als Fallback
      try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const baseUrl = window.REACT_APP_DATACAT_API_URL;
        const classUri = 'https://ibpdi.datacat.org/class/dfdb1a51-bd25-11eb-81e7-9735ef069f63';
        const targetUrl = `${baseUrl}/api/Class/Properties/v1?ClassUri=${encodeURIComponent(classUri)}`;

        const proxyResponse = await fetch(proxyUrl + encodeURIComponent(targetUrl));
        const proxyData = await proxyResponse.json();

        if (proxyData.contents) {
          const data = JSON.parse(proxyData.contents);
          setClassProperties(data.classProperties || []);
          setError(null);
        } else {
          throw new Error('Keine Daten über Proxy erhalten');
        }
      } catch (proxyError) {
        console.error('Auch Proxy-Aufruf fehlgeschlagen:', proxyError);
        setError(`Beide Versuche fehlgeschlagen. Letzter Fehler: ${proxyError.message}`);
        setClassProperties([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessRights = async () => {
    try {
      const response = await fetch(
        `/api/buildings/access-rights/class?classUri=https://ibpdi.datacat.org/class/Building`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Zugriffsrechte:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchClassPropertiesWithRights = async () => {
      setLoading(true);
      setError(null);
      try {
        const rightsData = await fetchAccessRights();
        const rightsMap = rightsData.reduce((map, item) => {
          map[item.Name] = item.Right === 2 ? 'read' : 'write';
          return map;
        }, {});

        await fetchClassProperties();

        setClassProperties((prevProperties) =>
          prevProperties.map((property) => ({
            ...property,
            accessRight: rightsMap[property.name] || 'read',
          }))
        );
      } catch (error) {
        console.error('Fehler beim Abrufen der Klasseneigenschaften mit Rechten:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchClassPropertiesWithRights();
      setFormData({});
    }
  }, [isOpen]);

  // Fehlende Eigenschaften ermitteln
  const getMissingProperties = (building) => {
    if (!building || !classProperties.length) return [];
    const existingKeys = Object.keys(building);
    return classProperties.filter(prop => 
      !existingKeys.some(key => key.toLowerCase() === prop.name.toLowerCase())
    );
  };

  // Eingabefeld-Handler
  const handleInputChange = (propertyName, value) => {
    setFormData(prev => ({
      ...prev,
      [propertyName]: value
    }));
  };

  // Formular speichern
  const handleSave = () => {
    onSave(buildingIndex, formData);
    onClose();
  };

  if (!isOpen || !building) return null;

  const missingProperties = getMissingProperties(building);
  const sortedMissingProperties = missingProperties.sort((a, b) => {
    if (a.accessRight === b.accessRight) {
      return a.name.localeCompare(b.name);
    }
    return a.accessRight === 'write' ? -1 : 1;
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '10px'
        }}>
          <h3 style={{ margin: 0, color: '#1f2937' }}>
            Zusätzliche Informationen für {building.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#374151', marginBottom: '15px' }}>
            Fehlende Eigenschaften ergänzen:
          </h4>
          
          {loading ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
              Lade verfügbare Eigenschaften...
            </p>
          ) : error ? (
            <div style={{ color: '#dc2626', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                ⚠️ API-Fehler
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                {error}
              </p>
              <details style={{ marginTop: '10px', fontSize: '11px' }}>
                <summary style={{ cursor: 'pointer', color: '#374151' }}>Debugging-Info</summary>
                <p style={{ margin: '5px 0', fontFamily: 'monospace' }}>
                  API-URL: {window.REACT_APP_DATACAT_API_URL}/api/Class/Properties/v1<br/>
                  nicht erreichbar
                </p>
              </details>
            </div>
          ) : classProperties.length === 0 ? (
            <div style={{ color: '#f59e0b', padding: '10px', backgroundColor: '#fffbeb', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                ℹ️ Keine Eigenschaften verfügbar
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                Die API wurde erreicht, aber es wurden keine Eigenschaften zurückgegeben.
              </p>
            </div>
          ) : missingProperties.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
              Alle verfügbaren Eigenschaften sind bereits vorhanden.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sortedMissingProperties.map((property, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    {property.name}
                    {property.accessRight !== 'write' && (
                      <sup style={{
                        color: 'red',
                        fontSize: '10px',
                        marginLeft: '4px'
                      }}>
                        read only
                      </sup>
                    )}
                    {property.description && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 'normal',
                        color: '#6b7280',
                        marginLeft: '8px'
                      }}>
                        ({property.description})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData[property.name] || ''}
                    onChange={(e) => handleInputChange(property.name, e.target.value)}
                    placeholder={property.example || `Wert für ${property.name} eingeben`}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                    disabled={property.accessRight !== 'write'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          paddingTop: '15px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Lädt...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildingInfoModal;
