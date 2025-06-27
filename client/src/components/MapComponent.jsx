import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for hotels
const hotelIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2e7f43">
      <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
    </svg>
  `),
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25]
});

// Custom icon for attractions
const attractionIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#6da57b">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25]
});

const MapComponent = ({ 
  center = [28.6139, 77.2090], // Default to Delhi
  zoom = 13,
  hotel = null,
  attractions = [],
  className = "",
  style = {}
}) => {
  // Get coordinates based on location or use default
  const getCoordinates = (location) => {
    // Common city coordinates mapping
    const cityCoords = {
      'Delhi': [28.6139, 77.2090],
      'Mumbai': [19.0760, 72.8777],
      'Bangalore': [12.9716, 77.5946],
      'Chennai': [13.0827, 80.2707],
      'Kolkata': [22.5726, 88.3639],
      'Pune': [18.5204, 73.8567],
      'Hyderabad': [17.3850, 78.4867],
      'Ahmedabad': [23.0225, 72.5714],
      'Jaipur': [26.9124, 75.7873],
      'Goa': [15.2993, 74.1240],
      'Paris': [48.8566, 2.3522],
      'London': [51.5074, -0.1278],
      'New York': [40.7128, -74.0060],
      'Tokyo': [35.6762, 139.6503],
      'Berlin': [52.5200, 13.4050],
      'Rome': [41.9028, 12.4964]
    };

    // Try to find coordinates by city name
    for (const [city, coords] of Object.entries(cityCoords)) {
      if (location && location.toLowerCase().includes(city.toLowerCase())) {
        return coords;
      }
    }

    return center;
  };

  const mapCenter = hotel?.lat && hotel?.lon 
    ? [hotel.lat, hotel.lon]
    : getCoordinates(hotel?.address?.cityName || attractions[0]?.name);

  return (
    <div className={`w-full h-full ${className}`} style={style}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '300px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Hotel Marker */}
        {hotel && hotel.lat && hotel.lon && (
          <Marker 
            position={[hotel.lat, hotel.lon]} 
            icon={hotelIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-[#2e7f43]">{hotel.name}</h3>
                <p className="text-sm text-gray-600">{hotel.address?.lines?.[0] || 'Hotel Location'}</p>
                {hotel.rating && (
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-sm">{hotel.rating}</span>
                  </div>
                )}
                {hotel.estimatedPrice && (
                  <p className="text-sm font-semibold text-[#2e7f43] mt-1">
                    {hotel.estimatedPrice.currency} {hotel.estimatedPrice.amount}/night
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Attraction Markers */}
        {attractions.map((attraction, index) => {
          const coords = getCoordinates(attraction.name);
          // Add small random offset for multiple attractions
          const offsetLat = coords[0] + (Math.random() - 0.5) * 0.01;
          const offsetLng = coords[1] + (Math.random() - 0.5) * 0.01;
          
          return (
            <Marker 
              key={index}
              position={[offsetLat, offsetLng]} 
              icon={attractionIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-[#6da57b]">Attraction</h3>
                  <p className="text-sm text-gray-600">{attraction}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Default marker if no hotel coordinates */}
        {(!hotel?.lat || !hotel?.lon) && (
          <Marker position={mapCenter}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-[#2e7f43]">Location</h3>
                <p className="text-sm text-gray-600">
                  {hotel?.address?.cityName || attractions[0] || 'Current location'}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
