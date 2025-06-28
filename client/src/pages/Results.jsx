import { Button } from "@/components/ui/button";
import { Bot, Calendar, Car, Cloud, DollarSign, Hotel, LogOut, MapPin, Menu, Plane, Send, Star, User, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";
import MapComponent from "../components/MapComponent";
import weatherService from "../services/weatherService";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState('');
  const [weatherData, setWeatherData] = useState({});
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    
    // Check if we have AI-generated daily itinerary
    if (dbItinerary.dailyItinerary && dbItinerary.dailyItinerary.length > 0) {
      console.log('Using AI-generated daily itinerary');
      
      // Convert database format to display format
      const processedItinerary = dbItinerary.dailyItinerary.map(day => ({
        day: day.day,
        location: day.location,
        date: day.date,
        hotel: {
          name: day.accommodation?.name || `Hotel in ${day.location}`,
          address: day.accommodation?.address || `${day.location} area`,
          rating: day.accommodation?.rating || 3.5,
          price: `${day.accommodation?.currency || formData.currency}${day.accommodation?.price || 100}`
        },
        transport: {
          mode: day.transportation?.mode || 'Local Transport',
          details: day.transportation?.details || 'Local transportation as needed',
          cost: `${day.transportation?.currency || formData.currency}${day.transportation?.cost || 20}`
        },
        activities: day.activities && day.activities.length > 0 
          ? day.activities 
          : [`Explore ${day.location}`, 'Local sightseeing', 'Cultural activities'],
        meals: {
          breakfast: day.meals?.breakfast || `Local breakfast in ${day.location}`,
          lunch: day.meals?.lunch || `Traditional lunch in ${day.location}`,
          dinner: day.meals?.dinner || `Local dinner in ${day.location}`
        },
        weather: day.weather || {
          temp: '25°C',
          condition: 'Loading weather...',
          humidity: '65%',
          available: false
        },
        estimatedCost: day.estimatedCost || 150
      }));
      
      setItinerary(processedItinerary);
      
      // Fetch real weather data
      fetchWeatherForItinerary(processedItinerary);
      
      // Store the itinerary ID for regeneration
      if (dbItinerary._id) {
        sessionStorage.setItem('currentItineraryId', dbItinerary._id);
      }
    } else {
      console.log('No AI-generated content, using enhanced fallback');
      generateEnhancedMockItinerary(formData);
    }
  };

  const generateEnhancedMockItinerary = (data) => {
    const days = parseInt(data.numberOfDays) || 3;
    const destinations = data.destinations || [data.destination];
    const mockItinerary = [];
    
    for (let i = 1; i <= days; i++) {
      const currentDestination = destinations[Math.floor((i-1) / Math.ceil(days / destinations.length))] || destinations[0];
      
      // Calculate date for this day
      const dayDate = new Date(data.startDate);
      dayDate.setDate(dayDate.getDate() + i - 1);
      
      mockItinerary.push({
        day: i,
        location: currentDestination,
        date: dayDate.toISOString().split('T')[0],
        hotel: {
          name: `${currentDestination} Hotel (Day ${i})`,
          address: `${currentDestination} city center`,
          rating: 3.5 + Math.random() * 1.5,
          price: data.budget === 'low' ? `${data.currency}50` : data.budget === 'moderate' ? `${data.currency}100` : `${data.currency}200`
        },
        transport: {
          mode: i === 1 ? 'Arrival Transport' : 'Local Transport',
          details: i === 1 ? 'Travel to destination' : 'Local transportation within city',
          cost: i === 1 ? `${data.currency}100` : `${data.currency}25`
        },
        activities: [
          `Morning exploration of ${currentDestination}`,
          `Visit popular attractions in ${currentDestination}`,
          `Cultural experiences in ${currentDestination}`,
          `Evening activities in ${currentDestination}`
        ],
        meals: {
          breakfast: `Local breakfast cafe in ${currentDestination}`,
          lunch: `Traditional restaurant in ${currentDestination}`,
          dinner: `Popular dinner spot in ${currentDestination}`
        },
        weather: {
          temp: 'Loading...',
          condition: 'Loading weather...',
          humidity: 'N/A',
          available: false
        },
        estimatedCost: data.budget === 'low' ? 75 : data.budget === 'moderate' ? 150 : 300
      });
    }
    
    setItinerary(mockItinerary);
    // Fetch real weather data for mock itinerary too
    fetchWeatherForItinerary(mockItinerary);
  };

  // New function to fetch weather data
  const fetchWeatherForItinerary = async (itineraryData) => {
    setIsLoadingWeather(true);
    
    try {
      console.log('Fetching weather for itinerary:', itineraryData);
      
      const weatherResults = await weatherService.getWeatherForItinerary(itineraryData);
      console.log('Weather results:', weatherResults);
      
      // Create weather lookup object
      const weatherLookup = {};
      weatherResults.forEach(dayWeather => {
        weatherLookup[dayWeather.day] = dayWeather.weather;
      });
      
      setWeatherData(weatherLookup);
      
      // Update itinerary with weather data
      setItinerary(prev => prev.map(day => ({
        ...day,
        weather: weatherLookup[day.day] || {
          temp: 'N/A',
          condition: 'Weather not available',
          humidity: 'N/A',
          available: false
        }
      })));
      
    } catch (error) {
      console.error('Failed to fetch weather for itinerary:', error);
      
      // Set fallback weather data
      setItinerary(prev => prev.map(day => ({
        ...day,
        weather: {
          temp: 'N/A',
          condition: 'Weather not available',
          humidity: 'N/A',
          available: false
        }
      })));
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleSendMessage = async () => {
    if (chatInput.trim() && !isLoading) {
      const userMessage = chatInput.trim();
      const newUserMessage = {
        id: Date.now(),
        type: 'user',
        message: userMessage
      };
      
      setChatMessages(prev => [...prev, newUserMessage]);
      setChatInput('');
      setIsLoading(true);
      
      try {
        // Add loading message
        const loadingMessage = {
          id: Date.now() + 1,
          type: 'bot',
          message: 'Processing your request...',
          isLoading: true
        };
        setChatMessages(prev => [...prev, loadingMessage]);

        // Get current itinerary ID for modifications
        const itineraryId = sessionStorage.getItem('currentItineraryId');

        // Call the chat API with enhanced context
        const response = await apiService.chatWithAgent(userMessage, {
          itinerary: formData,
          currentDay: selectedDay,
          itineraryId: itineraryId
        });

        // Remove loading message
        setChatMessages(prev => prev.filter(msg => !msg.isLoading));

        // Handle the response
        if (response.modified && response.itinerary) {
          // Itinerary was modified - update the display
          console.log('Itinerary was modified by AI:', response.itinerary);
          
          generateItineraryFromDatabase(response.itinerary, formData);
          sessionStorage.setItem('itineraryData', JSON.stringify(response.itinerary));
          
          // Add success message
          const modificationMessage = {
            id: Date.now() + 2,
            type: 'bot',
            message: `✅ ${response.message}`,
            isModification: true
          };
          setChatMessages(prev => [...prev, modificationMessage]);

        } else {
          // Regular chat response with potential actionable changes
          const chatMessage = {
            id: Date.now() + 2,
            type: 'bot',
            message: response.message || 'I can help you modify your itinerary.',
            suggestions: response.suggestions || [],
            actionableChanges: response.actionableChanges || [],
            canApplyChanges: response.canApplyChanges || false,
            itineraryId: itineraryId
          };
          setChatMessages(prev => [...prev, chatMessage]);
        }

      } catch (error) {
        console.error('Chat error:', error);
        
        setChatMessages(prev => {
          const withoutLoading = prev.filter(msg => !msg.isLoading);
          return [...withoutLoading, {
            id: Date.now() + 2,
            type: 'bot',
            message: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.'
          }];
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleApplyChange = async (changeAction, messageId, itineraryId) => {
    try {
      console.log('Applying change:', changeAction);
      
      // Update the message to show loading state
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, applyingChangeId: changeAction.id }
          : msg
      ));

      const response = await apiService.applyActionableChange(itineraryId, changeAction);
      
      if (response.success && response.itinerary) {
        // Update the itinerary display
        generateItineraryFromDatabase(response.itinerary, formData);
        sessionStorage.setItem('itineraryData', JSON.stringify(response.itinerary));
        
        // Update the message to show applied state
        setChatMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                applyingChangeId: null,
                appliedChanges: [...(msg.appliedChanges || []), changeAction.id]
              }
            : msg
        ));

        // Add success feedback message
        const successMessage = {
          id: Date.now(),
          type: 'bot',
          message: `✅ ${response.message}`,
          isChangeApplied: true
        };
        setChatMessages(prev => [...prev, successMessage]);

      } else {
        throw new Error(response.message || 'Failed to apply change');
      }

    } catch (error) {
      console.error('Error applying change:', error);
      
      // Remove loading state and show error
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, applyingChangeId: null }
          : msg
      ));

      // Add error message
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        message: `❌ Failed to apply change: ${error.message}`,
        isError: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveItinerary = async () => {
    const itineraryId = sessionStorage.getItem('currentItineraryId');
    
    if (!itineraryId) {
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        message: '❌ Cannot save - itinerary ID not found. Please try regenerating your itinerary first.',
        isError: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsSaving(true);

    try {
      console.log('Saving itinerary:', itineraryId);
      
      const response = await apiService.saveItinerary(itineraryId);
      
      if (response.success) {
        console.log('Itinerary saved successfully');
        
        // Add success message to chat
        const successMessage = {
          id: Date.now(),
          type: 'bot',
          message: '✅ Perfect! Your itinerary has been saved successfully. You can now find it in your profile under saved trips. I\'m here if you need any more help planning your adventure!',
          isSuccess: true
        };
        setChatMessages(prev => [...prev, successMessage]);
        
        // Update the stored itinerary data
        const formData = JSON.parse(sessionStorage.getItem('tripFormData'));
        sessionStorage.setItem('itineraryData', JSON.stringify(response.data));
        
      } else {
        throw new Error(response.message || 'Failed to save itinerary');
      }
    } catch (error) {
      console.error('Save failed:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        message: `❌ Sorry, I couldn't save your itinerary: ${error.message}. Please try again or let me know if you need help.`,
        isError: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateItinerary = async () => {
    const itineraryId = sessionStorage.getItem('currentItineraryId');
    
    if (!itineraryId) {
      setRegenerateError('Cannot regenerate - itinerary ID not found');
      return;
    }

    setIsRegenerating(true);
    setRegenerateError('');

    try {
      console.log('Regenerating itinerary:', itineraryId);
      
      const response = await apiService.regenerateItinerary(itineraryId);
      
      if (response.success) {
        console.log('Itinerary regenerated successfully');
        
        // Update the display with new data
        const formData = JSON.parse(sessionStorage.getItem('tripFormData'));
        generateItineraryFromDatabase(response.data, formData);
        
        // Update stored itinerary data
        sessionStorage.setItem('itineraryData', JSON.stringify(response.data));
        
        // Add success message to chat
        const successMessage = {
          id: Date.now(),
          type: 'bot',
          message: 'Great! I\'ve regenerated your itinerary with fresh recommendations. Check out the updated activities, accommodations, and suggestions!'
        };
        setChatMessages(prev => [...prev, successMessage]);
        
      } else {
        throw new Error(response.message || 'Failed to regenerate itinerary');
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
      setRegenerateError(error.message || 'Failed to regenerate itinerary');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        message: 'Sorry, I had trouble regenerating your itinerary. Please try again or let me know if you need help with specific changes.'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsRegenerating(false);
    }
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

      {/* AI Controls Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">AI Assistant</h3>
          </div>
          
          <Button
            onClick={handleRegenerateItinerary}
            disabled={isRegenerating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {isRegenerating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Regenerating...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Regenerate Itinerary
              </>
            )}
          </Button>
        </div>
        
        {regenerateError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {regenerateError}
          </div>
        )}
        
        <p className="text-gray-600 text-sm">
          Not satisfied with your itinerary? Let me create a fresh set of recommendations with different activities, restaurants, and accommodations!
        </p>
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
                    {isLoadingWeather && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2e7f43]"></div>
                    )}
                  </div>
                  <div className="ml-16">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      {currentDayData?.weather?.available === false ? (
                        <div className="text-center py-4">
                          <p className="text-gray-600 text-lg mb-2">Weather information not available</p>
                          <p className="text-gray-500 text-sm">
                            {isLoadingWeather ? 'Loading weather data...' : 'Unable to fetch weather data for this location and date'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-4xl font-bold text-[#2e7f43] mb-2">
                              {currentDayData?.weather?.temp || 'N/A'}
                            </div>
                            <div className="text-xl text-gray-600">
                              {currentDayData?.weather?.condition || 'Unknown'}
                            </div>
                            {currentDayData?.weather?.description && (
                              <div className="text-sm text-gray-500 mt-1 capitalize">
                                {currentDayData.weather.description}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg text-gray-600 mb-1">Humidity</div>
                            <div className="font-bold text-xl text-[#2e7f43]">
                              {currentDayData?.weather?.humidity || 'N/A'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Weather Status Indicator */}
                    <div className="mt-3 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        currentDayData?.weather?.available !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {currentDayData?.weather?.available !== false ? '✓ Live Weather Data' : '⚠ Weather Unavailable'}
                      </span>
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
                        location={currentDayData?.location}
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
                        onClick={handleSaveItinerary}
                        disabled={isSaving}
                        className="flex-1 bg-gradient-to-r from-[#2e7f43] to-[#6da57b] hover:from-[#245f35] hover:to-[#5a8f66] text-white py-3"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          'Save Itinerary'
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
                        onClick={() => navigate('/plan')}
                      >
                        Plan New Trip
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
                <div className={`max-w-sm px-4 py-2 rounded-lg ${
                  msg.type === 'user' 
                    ? 'bg-[#2e7f43] text-white' 
                    : msg.isModification 
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : msg.isChangesSummary
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : msg.isChangeApplied
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : msg.isError
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : msg.isSuccess
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.type === 'bot' ? (
                      msg.isModification || msg.isChangeApplied ? (
                        <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      ) : msg.isError ? (
                        <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">!</span>
                        </div>
                      ) : msg.isSuccess ? (
                        <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      ) : (
                        <Bot className="w-4 h-4" />
                      )
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-75">
                      {msg.type === 'bot' ? 
                        msg.isModification ? 'Modified' : 
                        msg.isChangesSummary ? 'Changes' : 
                        msg.isChangeApplied ? 'Applied' :
                        msg.isError ? 'Error' :
                        msg.isSuccess ? 'Saved' : 'Assistant' 
                        : 'You'}
                    </span>
                  </div>
                  
                  <p className="text-sm whitespace-pre-line mb-2">{msg.message}</p>
                  
                  {/* Actionable Changes Buttons */}
                  {msg.actionableChanges && msg.actionableChanges.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Quick Actions:</p>
                      <div className="space-y-1">
                        {msg.actionableChanges.map((change) => {
                          const isApplying = msg.applyingChangeId === change.id;
                          const isApplied = msg.appliedChanges?.includes(change.id);
                          
                          return (
                            <button
                              key={change.id}
                              onClick={() => handleApplyChange(change, msg.id, msg.itineraryId)}
                              disabled={isApplying || isApplied}
                              className={`w-full text-left p-2 rounded text-xs transition-colors ${
                                isApplied 
                                  ? 'bg-green-200 text-green-800 cursor-default' 
                                  : isApplying
                                  ? 'bg-yellow-100 text-yellow-800 cursor-wait'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-[#2e7f43]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{change.description}</span>
                                {isApplying && (
                                  <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
                                )}
                                {isApplied && (
                                  <span className="text-green-600">✓ Applied</span>
                                )}
                                {!isApplying && !isApplied && (
                                  <span className="text-[#2e7f43] text-xs">Apply →</span>
                                )}
                              </div>
                              {change.targetDay && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Day {change.targetDay}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Text Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-600">Suggestions:</p>
                      {msg.suggestions.slice(0, 3).map((suggestion, index) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded p-1">
                          • {suggestion}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.isLoading && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                    </div>
                  )}
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
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder={isLoading ? "AI is typing..." : "Type your message..."}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7f43] disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !chatInput.trim()}
                className="bg-[#2e7f43] text-white px-4 py-2 rounded-lg hover:bg-[#245f35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;