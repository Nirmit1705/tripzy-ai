import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const MapView = ({ destination }) => {
  const [position, setPosition] = useState([28.6139, 77.2090]) // Default to Delhi

  useEffect(() => {
    // In a real app, you would geocode the destination
    // For now, we'll use a mock position
    const mockPositions = {
      'Delhi': [28.6139, 77.2090],
      'Mumbai': [19.0760, 72.8777],
      'Bangalore': [12.9716, 77.5946],
      'Goa': [15.2993, 74.1240]
    }
    
    const coords = mockPositions[destination] || [28.6139, 77.2090]
    setPosition(coords)
  }, [destination])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 rounded-lg overflow-hidden">
          <MapContainer 
            center={position} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={position}>
              <Popup>
                {destination}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default MapView
