import React, { useState } from 'react';
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  User, 
  Menu, 
  X, 
  Plane, 
  Edit, 
  Camera, 
  Lock, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Trash2, 
  Play,
  CheckCircle,
  Clock,
  LogOut
} from 'lucide-react';
import { useAuth } from "../contexts/AuthContext"
import apiService from "../services/api"

const Profile = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [savedItineraries, setSavedItineraries] = useState([])
  const [tripHistory, setTripHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Use real user data or fallback to dummy data
  const userData = user || {
    name: "Guest User",
    email: "guest@example.com",
    profileImage: null 
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fetch user's itineraries on component mount
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchUserItineraries();
    }
  }, [isAuthenticated]);

  const fetchUserItineraries = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch all user itineraries
      const response = await apiService.getUserItineraries();
      
      if (response.success) {
        const itineraries = response.data;
        
        // Separate saved drafts and completed trips
        const saved = itineraries.filter(it => 
          it.status === 'confirmed' || it.status === 'saved' || it.status === 'generated'
        );
        const completed = itineraries.filter(it => 
          it.status === 'completed'
        );
        
        setSavedItineraries(saved);
        setTripHistory(completed);
      } else {
        setError('Failed to load your itineraries');
      }
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      setError('Failed to load your travel data');
    } finally {
      setIsLoading(false);
    }
  }

  const getBudgetColor = (budget) => {
    const colors = {
      'low': 'text-green-600 bg-green-50',
      'moderate': 'text-blue-600 bg-blue-50',
      'high': 'text-purple-600 bg-purple-50'
    }
    return colors[budget] || 'text-gray-600 bg-gray-50'
  }

  const handleFinishDraft = (draftId) => {
    console.log(`Finishing draft ${draftId}`)
    // Navigate to results page or implement finish logic
    navigate(`/results?itineraryId=${draftId}`)
  }

  const handleDeleteDraft = async (draftId) => {
    try {
      console.log(`Deleting draft ${draftId}`)
      const response = await apiService.deleteItinerary(draftId);
      
      if (response.success) {
        // Remove from local state
        setSavedItineraries(prev => prev.filter(it => it._id !== draftId));
      } else {
        alert('Failed to delete itinerary');
      }
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      alert('Failed to delete itinerary');
    }
  }

  const formatItineraryForDisplay = (itinerary) => ({
    id: itinerary._id,
    title: itinerary.title,
    startLocation: itinerary.startLocation,
    destination: itinerary.destinations?.[0]?.name || 'Multiple destinations',
    destinations: itinerary.destinations,
    startDate: itinerary.startDate,
    endDate: itinerary.endDate,
    days: itinerary.numberOfDays,
    travelers: itinerary.travelers,
    budget: itinerary.budget,
    createdAt: itinerary.createdAt,
    completedAt: itinerary.completedAt,
    status: itinerary.status,
    rating: itinerary.rating
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#2e7f43] mb-4">Please sign in to view your profile</h2>
          <Button onClick={() => navigate('/login')} className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2e7f43] mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-[#2e7f43] mb-4">Loading your profile...</h2>
        </div>
      </div>
    );
  }

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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* User Info Section */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {userData.profileImage ? (
                    <img 
                      src={userData.profileImage} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover border-4 border-[#2e7f43]"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-[#2e7f43] to-[#6da57b] rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{userData.name}</h1>
                  <p className="text-lg text-gray-600">{userData.email}</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="border-[#2e7f43] text-[#2e7f43] hover:bg-[#2e7f43] hover:text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Change Name
                </Button>
                <Button 
                  variant="outline" 
                  className="border-[#6da57b] text-[#6da57b] hover:bg-[#6da57b] hover:text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-500 text-gray-700 hover:bg-gray-500 hover:text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Saved Drafts */}
          <div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-[#2e7f43] flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Saved Itineraries ({savedItineraries.length})
                </CardTitle>
                <CardDescription>
                  Your saved trip plans ready for your adventures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                
                {savedItineraries.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No saved itineraries yet</p>
                    <Button 
                      onClick={() => navigate('/plan')} 
                      className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] text-white"
                    >
                      Plan Your First Trip
                    </Button>
                  </div>
                ) : (
                  savedItineraries.map((itinerary) => {
                    const draft = formatItineraryForDisplay(itinerary);
                    return (
                      <Card key={draft.id} className="border-l-4 border-l-[#2e7f43] hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-gray-800">{draft.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBudgetColor(draft.budget)}`}>
                              {draft.budget.charAt(0).toUpperCase() + draft.budget.slice(1)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              <span>{draft.startLocation}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-green-500" />
                              <span>{draft.destination}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(draft.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{draft.days} days</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{draft.travelers} travelers</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Created: {new Date(draft.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] hover:from-[#245f35] hover:to-[#5a8f66] text-white"
                                onClick={() => handleFinishDraft(draft.id)}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteDraft(draft.id)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Trip History */}
          <div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-[#2e7f43] flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Trip History ({tripHistory.length})
                </CardTitle>
                <CardDescription>
                  Your completed adventures and memories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tripHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No completed trips yet</p>
                    <p className="text-sm text-gray-500">Complete your saved trips to see them here</p>
                  </div>
                ) : (
                  tripHistory.map((itinerary) => {
                    const trip = formatItineraryForDisplay(itinerary);
                    return (
                      <Card key={trip.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-gray-800">{trip.title}</h3>
                            {trip.rating && (
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="text-sm font-medium">{trip.rating}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              <span>{trip.startLocation}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-green-500" />
                              <span>{trip.destination}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{trip.days} days</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{trip.travelers} travelers</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            {trip.completedAt && (
                              <span className="text-xs text-gray-500">
                                Completed: {new Date(trip.completedAt).toLocaleDateString()}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBudgetColor(trip.budget)}`}>
                              {trip.budget.charAt(0).toUpperCase() + trip.budget.slice(1)}
                            </span>
                          </div>
                          
                          <div className="mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-[#2e7f43] text-[#2e7f43] hover:bg-[#2e7f43] hover:text-white w-full"
                              onClick={() => handleFinishDraft(trip.id)}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
