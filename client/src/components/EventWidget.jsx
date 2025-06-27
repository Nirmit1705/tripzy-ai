import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, Star } from "lucide-react"

const EventWidget = ({ destination }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock events data - in a real app, you'd fetch from an events API
    const mockEvents = [
      {
        id: 1,
        title: "Local Food Festival",
        date: "2025-06-22",
        time: "18:00",
        location: "City Center",
        category: "Food",
        price: "Free",
        rating: 4.5
      },
      {
        id: 2,
        title: "Art Exhibition Opening",
        date: "2025-06-23",
        time: "19:30",
        location: "Modern Art Gallery",
        category: "Culture",
        price: "₹200",
        rating: 4.8
      },
      {
        id: 3,
        title: "Live Music Concert",
        date: "2025-06-24",
        time: "20:00",
        location: "Amphitheater",
        category: "Entertainment",
        price: "₹500",
        rating: 4.6
      }
    ]
    
    setTimeout(() => {
      setEvents(mockEvents)
      setLoading(false)
    }, 1200)
  }, [destination])

  const getCategoryColor = (category) => {
    const colors = {
      'Food': 'bg-orange-100 text-orange-800',
      'Culture': 'bg-purple-100 text-purple-800',
      'Entertainment': 'bg-green-100 text-green-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Local Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Local Events in {destination}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border-l-4 border-blue-500 pl-3 pb-3">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-sm">{event.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                  {event.category}
                </span>
              </div>
              
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <Clock className="w-3 h-3 ml-2" />
                  <span>{event.time}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span>{event.rating}</span>
                  </div>
                  <span className="font-semibold">{event.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default EventWidget
