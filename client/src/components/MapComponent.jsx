import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapService from '../services/mapService';

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
  location = null, // Current day location
  className = "",
  style = {}
}) => {
  const [mapCenter, setMapCenter] = useState(center);
  const [attractionCoords, setAttractionCoords] = useState([]);
  const [hotelCoords, setHotelCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enhanced city coordinates mapping with more cities
  const getCityCoordinates = (locationName) => {
    const cityCoords = {
      // Indian Cities
      'Delhi': [28.6139, 77.2090],
      'New Delhi': [28.6139, 77.2090],
      'Mumbai': [19.0760, 72.8777],
      'Bangalore': [12.9716, 77.5946],
      'Bengaluru': [12.9716, 77.5946],
      'Chennai': [13.0827, 80.2707],
      'Kolkata': [22.5726, 88.3639],
      'Pune': [18.5204, 73.8567],
      'Hyderabad': [17.3850, 78.4867],
      'Ahmedabad': [23.0225, 72.5714],
      'Jaipur': [26.9124, 75.7873],
      'Goa': [15.2993, 74.1240],
      'Kochi': [9.9312, 76.2673],
      'Thiruvananthapuram': [8.5241, 76.9366],
      'Mysore': [12.2958, 76.6394],
      'Udaipur': [24.5854, 73.7125],
      'Jodhpur': [26.2389, 73.0243],
      'Agra': [27.1767, 78.0081],
      'Varanasi': [25.3176, 82.9739],
      'Rishikesh': [30.0869, 78.2676],
      'Haridwar': [29.9457, 78.1642],
      'Manali': [32.2432, 77.1892],
      'Shimla': [31.1048, 77.1734],
      'Darjeeling': [27.0410, 88.2663],
      'Gangtok': [27.3389, 88.6065],
      
      // International Cities
      'Paris': [48.8566, 2.3522],
      'London': [51.5074, -0.1278],
      'New York': [40.7128, -74.0060],
      'Tokyo': [35.6762, 139.6503],
      'Berlin': [52.5200, 13.4050],
      'Rome': [41.9028, 12.4964],
      'Barcelona': [41.3851, 2.1734],
      'Amsterdam': [52.3676, 4.9041],
      'Prague': [50.0755, 14.4378],
      'Vienna': [48.2082, 16.3738],
      'Dubai': [25.2048, 55.2708],
      'Singapore': [1.3521, 103.8198],
      'Bangkok': [13.7563, 100.5018],
      'Hong Kong': [22.3193, 114.1694],
      'Seoul': [37.5665, 126.9780]
    };

    if (!locationName) return center;
    
    // Try exact match first
    if (cityCoords[locationName]) {
      return cityCoords[locationName];
    }
    
    // Try partial match
    const locationLower = locationName.toLowerCase();
    for (const [city, coords] of Object.entries(cityCoords)) {
      if (locationLower.includes(city.toLowerCase()) || 
          city.toLowerCase().includes(locationLower)) {
        return coords;
      }
    }

    // If no match found, try to extract city name from longer strings
    const words = locationName.split(/[\s,]+/);
    for (const word of words) {
      const wordLower = word.toLowerCase();
      for (const [city, coords] of Object.entries(cityCoords)) {
        if (wordLower === city.toLowerCase()) {
          return coords;
        }
      }
    }

    return center;
  };

  useEffect(() => {
    const loadCoordinates = async () => {
      setLoading(true);
      
      // Determine map center
      let centerCoords = center;
      
      // Priority: Hotel coordinates > Location > Default
      if (hotel?.lat && hotel?.lon) {
        centerCoords = [hotel.lat, hotel.lon];
        setHotelCoords({ lat: hotel.lat, lon: hotel.lon, ...hotel });
      } else if (location) {
        centerCoords = getCityCoordinates(location);
        // Create hotel coordinates for the location
        if (hotel) {
          setHotelCoords({
            lat: centerCoords[0],
            lon: centerCoords[1],
            ...hotel
          });
        }
      } else if (hotel?.address?.cityName) {
        centerCoords = getCityCoordinates(hotel.address.cityName);
        setHotelCoords({
          lat: centerCoords[0],
          lon: centerCoords[1],
          ...hotel
        });
      }

      setMapCenter(centerCoords);

      // Process attractions with real coordinates
      if (attractions && attractions.length > 0) {
        try {
          const attractionData = [];
          
          for (let i = 0; i < attractions.length; i++) {
            const attraction = attractions[i];
            let attractionCoords = centerCoords;
            
            // Try to get more specific coordinates for known attractions
            const coords = getCityCoordinates(attraction);
            if (coords !== center || attraction.includes('Museum') || attraction.includes('Temple') || 
                attraction.includes('Palace') || attraction.includes('Fort') || attraction.includes('Market')) {
              attractionCoords = coords;
            }
            
            // Add small random offset so markers don't overlap
            const offsetLat = attractionCoords[0] + (Math.random() - 0.5) * 0.02;
            const offsetLon = attractionCoords[1] + (Math.random() - 0.5) * 0.02;
            
            attractionData.push({
              name: attraction,
              lat: offsetLat,
              lon: offsetLon,
              id: i
            });
          }
          
          setAttractionCoords(attractionData);
        } catch (error) {
          console.error('Error processing attractions:', error);
          // Fallback: use center coordinates with offsets
          const fallbackAttractions = attractions.map((attraction, index) => ({
            name: attraction,
            lat: centerCoords[0] + (Math.random() - 0.5) * 0.01,
            lon: centerCoords[1] + (Math.random() - 0.5) * 0.01,
            id: index
          }));
          setAttractionCoords(fallbackAttractions);
        }
      }
      
      setLoading(false);
    };

    loadCoordinates();
  }, [hotel, attractions, location]);

  if (loading) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={style}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e7f43] mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`} style={style}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '300px' }}
        key={`${mapCenter[0]}-${mapCenter[1]}`} // Force re-render when center changes
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Hotel Marker */}
        {hotelCoords && (
          <Marker 
            position={[hotelCoords.lat, hotelCoords.lon]} 
            icon={hotelIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-[#2e7f43]">{hotelCoords.name}</h3>
                <p className="text-sm text-gray-600">
                  {hotelCoords.address?.lines?.[0] || hotelCoords.address || 'Hotel Location'}
                </p>
                {hotelCoords.rating && (
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-sm">{hotelCoords.rating}</span>
                  </div>
                )}
                {hotelCoords.price && (
                  <p className="text-sm font-semibold text-[#2e7f43] mt-1">
                    {hotelCoords.price}/night
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Attraction Markers */}
        {attractionCoords.map((attraction) => (
          <Marker 
            key={attraction.id}
            position={[attraction.lat, attraction.lon]} 
            icon={attractionIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-[#6da57b]">Attraction</h3>
                <p className="text-sm text-gray-600">{attraction.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Default location marker if no specific coordinates */}
        {!hotelCoords && attractionCoords.length === 0 && (
          <Marker position={mapCenter}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-[#2e7f43]">Location</h3>
                <p className="text-sm text-gray-600">
                  {location || 'Current location'}
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
