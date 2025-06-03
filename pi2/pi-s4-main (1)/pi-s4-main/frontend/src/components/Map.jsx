import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import '../styles/Map.css';

export function Map({ latitude, longitude, name }) {
  // Check if the required leaflet CSS is already included
  const cssLink = document.querySelector('link[href*="leaflet.css"]');
  if (!cssLink) {
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    leafletCss.integrity = 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==';
    leafletCss.crossOrigin = '';
    document.head.appendChild(leafletCss);
  }

  return (
    <div className="map-container">
      <MapContainer 
        center={[latitude, longitude]} 
        zoom={14} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            {name}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}