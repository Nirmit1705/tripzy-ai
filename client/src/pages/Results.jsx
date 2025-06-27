import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, DollarSign, Clock, Star, Cloud, Hotel, Car, Plane, Send, Bot, User, Menu, X, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import MapComponent from "../components/MapComponent"

const Results = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [endDate, setEndDate] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'bot', message: "Hello! I'm your travel assistant. How can I help you with your trip?" }
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    // Get form data from sessionStorage
    const savedFormData = sessionStorage.getItem('tripFormData');
    const savedItineraryData = sessionStorage.getItem('itineraryData');
    
    console.log('Results page data check:', { 
      hasFormData: !!savedFormData, 
      hasItineraryData: !!savedItineraryData 
    });
    
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      setFormData(parsedData);
      
      // Calculate end date from start date and number of days
      if (parsedData.startDate && parsedData.numberOfDays) {
        const startDate = new Date(parsedData.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + parseInt(parsedData.numberOfDays) - 1);
        setEndDate(endDate.toISOString().split('T')[0]);
      }
      
      // Use database itinerary data if available, otherwise generate mock data
      if (savedItineraryData) {
        try {
          const itineraryData = JSON.parse(savedItineraryData);
          console.log('Using database itinerary data:', itineraryData);
          // Convert database format to display format if needed
          generateItineraryFromDatabase(itineraryData, parsedData);
        } catch (error) {
          console.error('Error parsing itinerary data:', error);
          generateMockItinerary(parsedData);
        }
      } else {
        // Generate mock data if no database data
        generateMockItinerary(parsedData);
      }
    } else {
      // If no form data, redirect to plan page
      console.log('No form data found, redirecting to plan page');
      navigate('/plan');
    }
  }, [navigate]);

  const generateItineraryFromDatabase = (dbItinerary, formData) => {
    console.log('Processing database itinerary:', dbItinerary);
    
    // For now, use the database metadata but generate mock daily data
    // Later this will be replaced with actual AI-generated content
    const days = parseInt(formData.numberOfDays) || 3;
    const mockItinerary = [];
    
    for (let i = 1; i <= days; i++) {
      mockItinerary.push({
        day: i,
        location: `${formData.destinations?.[0] || 'Destination'} - Day ${i}`,
        hotel: {
          name: `Hotel for Day ${i}`,
          address: `Address in ${formData.destinations?.[0] || 'destination'}`,
          rating: 4.0 + Math.random(),
          price: formData.budget === 'low' ? '₹2000' : formData.budget === 'moderate' ? '₹4000' : '₹8000'
        },
        transport: {
          mode: i === 1 ? 'Flight' : 'Local Transport',
          details: i === 1 ? 'Flight to destination' : 'Local transportation',
          cost: i === 1 ? '₹5000' : '₹500'
        },
        activities: [
          `Morning: Explore local attractions`,
          `Afternoon: Cultural experiences`,
          `Evening: Local cuisine and nightlife`
        ],
        weather: {
          temp: `${25 + Math.floor(Math.random() * 10)}°C`,
          condition: ['Sunny', 'Partly Cloudy', 'Clear'][i % 3],
          humidity: `${50 + Math.floor(Math.random() * 30)}%`
        }
      });
    }
    
    setItinerary(mockItinerary);
  };

  const generateMockItinerary = (data) => {
    const days = parseInt(data.numberOfDays) || 3;
    const mockItinerary = [];
    
    for (let i = 1; i <= days; i++) {
      mockItinerary.push({
        day: i,
        location: `${data.destinations?.[0] || data.destination} - Area ${i}`,
        hotel: {
          name: `Grand Hotel Day ${i}`,
          address: `123 Main Street, ${data.destinations?.[0] || data.destination}`,
          rating: 4.5,
          price: data.budget === 'low' ? '₹2000' : data.budget === 'moderate' ? '₹4000' : '₹8000'
        },
        transport: {
          mode: i === 1 ? 'Flight' : 'Local Transport',
          details: i === 1 ? 'Flight AI-101 at 10:30 AM' : 'Metro/Taxi as needed',
          cost: i === 1 ? '₹5000' : '₹500'
        },
        activities: [
          `Morning: Explore local attractions`,
          `Afternoon: Cultural experiences`,
          `Evening: Local cuisine and markets`
        ],
        weather: {
          temp: `${25 + Math.floor(Math.random() * 10)}°C`,
          condition: i % 3 === 0 ? "Sunny" : i % 3 === 1 ? "Partly Cloudy" : "Clear",
          humidity: `${50 + Math.floor(Math.random() * 30)}%`
        }
      });
    }
    
    setItinerary(mockItinerary);
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        type: 'user',
        message: chatInput
      };
      
      setChatMessages([...chatMessages, newMessage]);
      setChatInput('');
      
      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: chatMessages.length + 2,
          type: 'bot',
          message: "I understand your question. Let me help you with that information about your trip."
        };
        setChatMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#2e7f43] mb-4">Loading your itinerary...</h2>
          <p className="text-gray-600">Please wait while we prepare your trip details.</p>
        </div>
      </div>
    );
  }

  const currentDayData = itinerary.find(day => day.day === selectedDay);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100">
      {/* Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2e7f43] to-[#6da57b] rounded-full flex items-center justify-center">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#2e7f43] to-[#6da57b] bg-clip-text text-transparent">
                Tripzy
              </span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <button onClick={() => navigate('/')} className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Home</button>
              <button onClick={() => navigate('/plan')} className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Plan Trip</button>
              <a href="#about" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">About</a>
              <a href="#contact" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Contact</a>
            </div>

            {/* Dynamic Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3">
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full border-2 border-[#2e7f43]"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-[#2e7f43] to-[#6da57b] rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      Welcome, {user?.name?.split(' ')[0]}
                    </span>
                  </div>
                  <Button 
                    onClick={() => navigate('/profile')}
                    variant="outline" 
                    className="border-[#2e7f43] text-[#2e7f43] hover:bg-[#2e7f43] hover:text-white"
                  >
                    Profile
                  </Button>
                  <Button 
                    onClick={handleLogout}
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="border-[#2e7f43] text-[#2e7f43] hover:bg-[#2e7f43] hover:text-white"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] hover:from-[#245f35] hover:to-[#5a8f66] text-white"
                    onClick={() => navigate('/login')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            <button 
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t py-4">
              <div className="flex flex-col space-y-4">
                <button onClick={() => navigate('/')} className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium text-left">Home</button>
                <button onClick={() => navigate('/plan')} className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium text-left">Plan Trip</button>
                <a href="#about" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">About</a>
                <a href="#contact" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Contact</a>
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center space-x-3 py-2">
                        {user?.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full border-2 border-[#2e7f43]"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-[#2e7f43] to-[#6da57b] rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          Welcome, {user?.name?.split(' ')[0]}
                        </span>
                      </div>
                      <Button 
                        onClick={() => navigate('/profile')}
                        variant="outline" 
                        className="border-[#2e7f43] text-[#2e7f43] hover:bg-[#2e7f43] hover:text-white"
                      >
                        Profile
                      </Button>
                      <Button 
                        onClick={handleLogout}
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="border-[#2e7f43] text-[#2e7f43] hover:bg-[#2e7f43] hover:text-white"
                        onClick={() => navigate('/login')}
                      >
                        Sign In
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] text-white"
                        onClick={() => navigate('/login')}
                      >
                        Sign Up
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Header Section - Updated to match content partition exactly */}
      <div className="w-full bg-gradient-to-r from-[#2e7f43] to-[#6da57b] text-white">
        <div className="flex">
          {/* Left Header - Trip Details (60% width to match content) */}
          <div className="w-3/5 py-4 px-4 border-r border-white/20">
            <div className="grid grid-cols-5 gap-3 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-semibold text-xs">{formData?.startLocation}</span>
                </div>
                <div className="text-xs text-green-100">Start Location</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-semibold text-xs">{formData?.destinations?.[0] || formData?.destination}</span>
                </div>
                <div className="text-xs text-green-100">Destination</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold text-xs">{formData?.numberOfDays} Days</span>
                </div>
                <div className="text-xs text-green-100">{formData?.startDate} to {endDate}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-xs">{formData?.travelers} Travelers</span>
                </div>
                <div className="text-xs text-green-100">Group Size</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold text-xs capitalize">{formData?.budget}</span>
                </div>
                <div className="text-xs text-green-100">Budget Level</div>
              </div>
            </div>
          </div>

          {/* Right Header - Travel Assistant (40% width to match content) */}
          <div className="w-2/5 py-4 px-6 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Bot className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">Travel Assistant</h2>
                <p className="text-green-100 text-xs">AI companion for travel queries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Columns with 60:40 ratio */}
      <div className="flex" style={{height: 'calc(100vh - 150px)'}}>
        {/* Left Column - Day Info & Map (60% width) */}
        <div className="w-3/5 overflow-y-auto bg-white border-r border-gray-200">
          <div className="p-8 space-y-8">
            {/* Day Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-[#2e7f43] mb-4">Select Day</h3>
              <div className="flex flex-wrap gap-3">
                {itinerary.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(day.day)}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors text-base ${
                      selectedDay === day.day
                        ? 'bg-[#2e7f43] text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Day {day.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Information */}
            {currentDayData && (
              <div className="space-y-8">
                {/* Hotel Information */}
                <div className="border-b border-gray-200 pb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#2e7f43]/10 rounded-lg">
                      <Hotel className="w-7 h-7 text-[#2e7f43]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#2e7f43]">Accommodation</h3>
                  </div>
                  <div className="ml-16 space-y-4">
                    <h4 className="font-bold text-xl text-gray-800">{currentDayData.hotel.name}</h4>
                    <p className="text-gray-600 text-lg">{currentDayData.hotel.address}</p>
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 text-lg">★</span>
                        <span className="font-semibold text-lg">{currentDayData.hotel.rating}</span>
                        <span className="text-gray-600">Rating</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xl text-[#2e7f43]">{currentDayData.hotel.price}</span>
                        <span className="text-gray-600 ml-1">/night</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transportation */}
                <div className="border-b border-gray-200 pb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#2e7f43]/10 rounded-lg">
                      <Car className="w-7 h-7 text-[#2e7f43]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#2e7f43]">Transportation</h3>
                  </div>
                  <div className="ml-16 space-y-4">
                    <h4 className="font-bold text-xl text-gray-800">{currentDayData.transport.mode}</h4>
                    <p className="text-gray-600 text-lg">{currentDayData.transport.details}</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600">Estimated Cost: </span>
                      <span className="font-bold text-lg text-[#2e7f43]">{currentDayData.transport.cost}</span>
                    </div>
                  </div>
                </div>

                {/* Activities */}
                <div className="border-b border-gray-200 pb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#2e7f43]/10 rounded-lg">
                      <Star className="w-7 h-7 text-[#2e7f43]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#2e7f43]">Planned Activities</h3>
                  </div>
                  <div className="ml-16">
                    <ul className="space-y-4">
                      {currentDayData.activities.map((activity, index) => (
                        <li key={index} className="flex items-start gap-4 bg-gray-50 p-4 rounded-lg">
                          <div className="w-3 h-3 bg-[#2e7f43] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-lg">{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Weather */}
                <div className="border-b border-gray-200 pb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#2e7f43]/10 rounded-lg">
                      <Cloud className="w-7 h-7 text-[#2e7f43]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#2e7f43]">Weather Forecast</h3>
                  </div>
                  <div className="ml-16">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-4xl font-bold text-[#2e7f43] mb-2">{currentDayData.weather.temp}</div>
                          <div className="text-xl text-gray-600">{currentDayData.weather.condition}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg text-gray-600 mb-1">Humidity</div>
                          <div className="font-bold text-xl text-[#2e7f43]">{currentDayData.weather.humidity}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Section */}
                <div className="pb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#2e7f43]/10 rounded-lg">
                      <MapPin className="w-7 h-7 text-[#2e7f43]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#2e7f43]">Location Map</h3>
                  </div>
                  <div className="ml-16">
                    <div className="h-80 rounded-lg overflow-hidden border-2 border-[#6da57b]/20 shadow-lg">
                      <MapComponent
                        hotel={currentDayData?.hotel}
                        attractions={currentDayData?.activities || []}
                        zoom={14}
                        className="w-full h-full"
                      />
                    </div>
                    
                    {/* Map Info */}
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-[#6da57b]/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-[#2e7f43] rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Hotel Location</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#6da57b] rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Attractions & Activities</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-6">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-[#2e7f43] to-[#6da57b] hover:from-[#245f35] hover:to-[#5a8f66] text-white py-3"
                      >
                        Save Draft
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Chatbot (40% width) */}
        <div className="w-2/5 flex flex-col bg-white">

          {/* Chat Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.type === 'user' 
                    ? 'bg-[#2e7f43] text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.type === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span className="text-xs opacity-75">{msg.type === 'bot' ? 'Assistant' : 'You'}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input - Fixed at Bottom */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7f43]"
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#2e7f43] text-white px-4 py-2 rounded-lg hover:bg-[#245f35] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;