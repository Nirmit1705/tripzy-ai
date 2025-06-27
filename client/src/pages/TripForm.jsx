import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, MapPin, DollarSign, Clock, Users, X, Plane, Menu, LogOut, User } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

const TripForm = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      destinations: [],
      startDate: "",
      numberOfDays: 3,
      budget: "moderate",
      travelers: 1,
      interests: [],
      startTime: "09:00",
      endTime: "18:00",
      currency: "INR"
    }
  })

  const [selectedInterests, setSelectedInterests] = useState([])
  const [selectedBudget, setSelectedBudget] = useState("moderate")
  const [selectedCurrency, setSelectedCurrency] = useState("INR")
  const [destinationsList, setDestinationsList] = useState([])
  const [currentDestination, setCurrentDestination] = useState("")

  const interests = [
    "Adventure", "Culture", "Food", "Nature", "History", 
    "Art", "Shopping", "Photography", "Sports"
  ]

  const budgetOptions = [
    { value: "low", label: "Low Budget", description: "Economical options & local experiences" },
    { value: "moderate", label: "Moderate Budget", description: "Balanced comfort & value" },
    { value: "high", label: "High Budget", description: "Premium experiences & luxury" }
  ]

  const currencies = [
    { value: "INR", label: "₹ Indian Rupee (INR)" },
    { value: "USD", label: "$ US Dollar (USD)" },
    { value: "EUR", label: "€ Euro (EUR)" },
    { value: "GBP", label: "£ British Pound (GBP)" },
    { value: "JPY", label: "¥ Japanese Yen (JPY)" },
    { value: "AUD", label: "A$ Australian Dollar (AUD)" },
    { value: "CAD", label: "C$ Canadian Dollar (CAD)" }
  ]

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleInterest = (interest) => {
    const updated = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest]
    setSelectedInterests(updated)
    setValue("interests", updated)
  }

  const handleDestinationKeyPress = (e) => {
    if (e.key === 'Enter' && currentDestination.trim()) {
      e.preventDefault()
      if (!destinationsList.includes(currentDestination.trim())) {
        const updatedDestinations = [...destinationsList, currentDestination.trim()]
        setDestinationsList(updatedDestinations)
        setValue("destinations", updatedDestinations)
      }
      setCurrentDestination("")
    }
  }

  const removeDestination = (destinationToRemove) => {
    const updatedDestinations = destinationsList.filter(dest => dest !== destinationToRemove)
    setDestinationsList(updatedDestinations)
    setValue("destinations", updatedDestinations)
  }

  const onSubmit = (data) => {
    sessionStorage.setItem('tripFormData', JSON.stringify({
      ...data,
      destinations: destinationsList,
      interests: selectedInterests,
      budget: selectedBudget,
      currency: selectedCurrency
    }))
    navigate('/results')
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
              <a href="#features" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Features</a>
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
                <a href="#features" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Features</a>
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

      {/* Form Content */}
      <div className="py-2">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-2xl border-2 border-gray-100">
              <CardHeader className="text-center bg-gradient-to-r from-[#2e7f43] to-[#6da57b] text-white rounded-t-lg py-7">
                <CardTitle className="text-4xl font-bold">
                  Plan Your Perfect Trip
                </CardTitle>
                <CardDescription className="text-xl text-green-100 mt-1">
                  Tell us about your travel preferences and we'll create a personalized itinerary
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Destination */}
                      <div className="space-y-2">
                        <Label htmlFor="destination" className="flex items-center gap-2 text-[#2e7f43] font-semibold text-base">
                          <MapPin className="w-5 h-5" />
                          Destinations
                        </Label>
                        <Input
                          id="destination"
                          placeholder="Type destination and press Enter to add"
                          className="border-[#6da57b] focus:ring-[#2e7f43] h-10 text-base"
                          value={currentDestination}
                          onChange={(e) => setCurrentDestination(e.target.value)}
                          onKeyPress={handleDestinationKeyPress}
                        />
                        
                        {/* Destination Tags */}
                        {destinationsList.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {destinationsList.map((destination, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 bg-gradient-to-r from-[#2e7f43] to-[#6da57b] text-white px-3 py-1 rounded-full text-sm font-medium"
                              >
                                <span>{destination}</span>
                                <button
                                  type="button"
                                  onClick={() => removeDestination(destination)}
                                  className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Start Date and Number of Days */}
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="space-y-3">
                          <Label htmlFor="startDate" className="flex items-center gap-2 text-[#2e7f43] font-semibold text-base">
                            <Calendar className="w-5 h-5" />
                            Start Date
                          </Label>
                          <Input
                            id="startDate"
                            type="date"
                            className="border-[#6da57b] focus:ring-[#2e7f43] h-12 text-base"
                            {...register("startDate", { required: true })}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="numberOfDays" className="text-[#2e7f43] font-semibold text-base">Number of Days</Label>
                          <Input
                            id="numberOfDays"
                            type="number"
                            min="1"
                            max="30"
                            placeholder="3"
                            className="border-[#6da57b] focus:ring-[#2e7f43] h-12 text-base"
                            {...register("numberOfDays", { required: true })}
                          />
                        </div>
                      </div>

                      {/* Preferred Times */}
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="space-y-3">
                          <Label htmlFor="startTime" className="flex items-center gap-2 text-[#2e7f43] font-semibold text-base">
                            <Clock className="w-5 h-5" />
                            Start Time
                          </Label>
                          <Input
                            id="startTime"
                            type="time"
                            className="border-[#6da57b] focus:ring-[#2e7f43] h-12 text-base"
                            {...register("startTime")}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="endTime" className="text-[#2e7f43] font-semibold text-base">End Time</Label>
                          <Input
                            id="endTime"
                            type="time"
                            className="border-[#6da57b] focus:ring-[#2e7f43] h-12 text-base"
                            {...register("endTime")}
                          />
                        </div>
                      </div>

                      {/* Number of Travelers */}
                      <div className="space-y-3">
                        <Label htmlFor="travelers" className="flex items-center gap-2 text-[#2e7f43] font-semibold text-base">
                          <Users className="w-5 h-5" />
                          Number of Travelers
                        </Label>
                        <Input
                          id="travelers"
                          type="number"
                          min="1"
                          max="20"
                          className="border-[#6da57b] focus:ring-[#2e7f43] h-12 text-base"
                          {...register("travelers", { required: true })}
                        />
                      </div>

                      {/* Currency Selection */}
                      <div className="space-y-3">
                        <Label htmlFor="currency" className="flex items-center gap-2 text-[#2e7f43] font-semibold text-base">
                          <DollarSign className="w-5 h-5" />
                          Preferred Currency
                        </Label>
                        <select
                          id="currency"
                          className="w-full border border-[#6da57b] focus:ring-[#2e7f43] focus:border-[#2e7f43] h-12 text-base rounded-md px-3 bg-white"
                          value={selectedCurrency}
                          onChange={(e) => {
                            setSelectedCurrency(e.target.value)
                            setValue("currency", e.target.value)
                          }}
                        >
                          {currencies.map((currency) => (
                            <option key={currency.value} value={currency.value}>
                              {currency.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Budget Selection */}
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-[#2e7f43] font-semibold text-base">
                          <DollarSign className="w-5 h-5" />
                          Budget Range
                        </Label>
                        <div className="space-y-3">
                          {budgetOptions.map((option) => (
                            <div
                              key={option.value}
                              onClick={() => {
                                setSelectedBudget(option.value)
                                setValue("budget", option.value)
                              }}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                selectedBudget === option.value
                                  ? 'border-[#2e7f43] bg-green-50'
                                  : 'border-gray-200 hover:border-[#6da57b]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className={`font-semibold text-base ${
                                    selectedBudget === option.value ? 'text-[#2e7f43]' : 'text-gray-700'
                                  }`}>
                                    {option.label}
                                  </h4>
                                  <p className="text-sm text-gray-600">{option.description}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 ${
                                  selectedBudget === option.value
                                    ? 'border-[#2e7f43] bg-[#2e7f43]'
                                    : 'border-gray-300'
                                }`}>
                                  {selectedBudget === option.value && (
                                    <div className="w-3 h-3 bg-white rounded-full m-0.5"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Interests */}
                      <div className="space-y-4">
                        <Label className="text-[#2e7f43] font-semibold text-base">Select Your Interests</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {interests.map((interest) => (
                            <Button
                              key={interest}
                              type="button"
                              variant={selectedInterests.includes(interest) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleInterest(interest)}
                              className={`justify-center h-9 text-xs ${
                                selectedInterests.includes(interest)
                                  ? 'bg-gradient-to-r from-[#2e7f43] to-[#6da57b] text-white'
                                  : 'border-[#6da57b] text-[#2e7f43] hover:bg-green-50'
                              }`}
                            >
                              {interest}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button - Outside columns and centered */}
                  <div className="pt-8">
                    <div className="flex justify-center">
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] hover:from-[#245f35] hover:to-[#5a8f66] text-white py-4 px-12 text-xl font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300" 
                        size="lg"
                      >
                        Generate My Itinerary
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default TripForm;