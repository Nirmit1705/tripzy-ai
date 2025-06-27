import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, Sun, CloudRain, Thermometer } from "lucide-react"

const WeatherWidget = ({ destination }) => {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock weather data - in a real app, you'd fetch from a weather API
    const mockWeather = {
      temperature: 28,
      condition: "Sunny",
      humidity: 65,
      windSpeed: 12,
      forecast: [
        { day: "Today", temp: 28, condition: "Sunny" },
        { day: "Tomorrow", temp: 26, condition: "Cloudy" },
        { day: "Day 3", temp: 24, condition: "Rainy" }
      ]
    }
    
    setTimeout(() => {
      setWeather(mockWeather)
      setLoading(false)
    }, 1000)
  }, [destination])

  const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="w-6 h-6 text-yellow-500" />
      case 'cloudy':
        return <Cloud className="w-6 h-6 text-gray-500" />
      case 'rainy':
        return <CloudRain className="w-6 h-6 text-blue-500" />
      default:
        return <Sun className="w-6 h-6 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="w-5 h-5" />
          Weather in {destination}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getWeatherIcon(weather.condition)}
            <span className="text-3xl font-bold">{weather.temperature}°C</span>
          </div>
          <p className="text-gray-600">{weather.condition}</p>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Humidity:</span>
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Wind Speed:</span>
            <span>{weather.windSpeed} km/h</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-2">3-Day Forecast</h4>
          <div className="space-y-2">
            {weather.forecast.map((day, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{day.day}</span>
                <div className="flex items-center gap-2">
                  {getWeatherIcon(day.condition)}
                  <span>{day.temp}°C</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default WeatherWidget
