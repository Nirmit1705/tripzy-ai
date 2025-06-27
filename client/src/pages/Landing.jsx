import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Clock, DollarSign, Calendar, Menu, X, Plane, Users, Star, Phone, Mail, Facebook, Twitter, Instagram, Hotel, Car, Ticket, Luggage } from "lucide-react"
import { useState, useEffect } from "react"

const Landing = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [carPosition, setCarPosition] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      // Car movement perfectly synchronized with viewport - no head start
      const featuresSection = document.getElementById('features')
      if (featuresSection) {
        const sectionTop = featuresSection.offsetTop
        const sectionHeight = featuresSection.offsetHeight
        const viewportHeight = window.innerHeight
        const currentScroll = window.scrollY
        
        // Car moves only when section is actually in viewport
        const sectionEntersViewport = sectionTop - viewportHeight
        const sectionLeavesViewport = sectionTop + sectionHeight
        
        // Total distance section travels through viewport
        const totalVisibleDistance = sectionLeavesViewport - sectionEntersViewport
        
        // Car progress matches exactly with section visibility
        const carProgress = Math.max(0, Math.min(1, 
          (currentScroll - sectionEntersViewport) / totalVisibleDistance
        ))
        
        setCarPosition(carProgress)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const roadStops = [
    {
      icon: MapPin,
      title: "Smart Destinations",
      description: "AI-powered recommendations based on your preferences and travel style",
      position: "left"
    },
    {
      icon: Clock,
      title: "Time Optimized",
      description: "Efficient itineraries that maximize your travel time and experiences",
      position: "right"
    },
    {
      icon: DollarSign,
      title: "Budget Friendly",
      description: "Plans that fit perfectly within your budget without compromising quality",
      position: "left"
    },
    {
      icon: Calendar,
      title: "Personalized Schedule",
      description: "Customized day-wise itineraries tailored to your interests and pace",
      position: "right"
    }
  ]

  const floatingIcons = [
    { icon: Plane, x: 20, y: 20, delay: 0 },
    { icon: Hotel, x: 80, y: 15, delay: 0.5 },
    { icon: Car, x: 15, y: 70, delay: 1 },
    { icon: Ticket, x: 85, y: 75, delay: 1.5 },
    { icon: Luggage, x: 10, y: 45, delay: 2 },
    { icon: MapPin, x: 90, y: 40, delay: 2.5 },
  ]

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
              <a href="#home" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Home</a>
              <a href="#features" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Features</a>
              <a href="#about" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">About</a>
              <a href="#contact" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Contact</a>
            </div>

            <div className="hidden md:flex space-x-4">
              <Button 
                variant="outline" 
                className="border-[#2e7f43] text-[#2e7f43] hover:bg-[#2e7f43] hover:text-white"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button 
                className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] hover:from-[#245f35] hover:to-[#5a8f66] text-white"
                onClick={() => navigate('/login?mode=signup')}
              >
                Sign Up
              </Button>
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
                <a href="#home" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Home</a>
                <a href="#features" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Features</a>
                <a href="#about" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">About</a>
                <a href="#contact" className="text-gray-700 hover:text-[#2e7f43] transition-colors font-medium">Contact</a>
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="border-[#2e7f43] text-[#2e7f43] hover:bg-[#2e7f43] hover:text-white"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] text-white"
                    onClick={() => navigate('/login?mode=signup')}
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative container mx-auto px-4 py-20 overflow-hidden min-h-screen flex items-center">
        {/* Floating Background Icons - Simple static version */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {floatingIcons.map((item, index) => (
            <motion.div
              key={index}
              className="absolute"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 6,
                delay: item.delay,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <item.icon className="w-20 h-20 text-[#2e7f43] opacity-30" strokeWidth={1} />
            </motion.div>
          ))}
        </div>

        {/* Hero Content - Simple version without blur */}
        <div className="relative z-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center py-20 px-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#2e7f43] via-[#6da57b] to-[#2e7f43] bg-clip-text text-transparent">
                Tripzy
              </span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Plan your perfect trip with AI-powered recommendations, budget optimization, 
              and personalized itineraries tailored just for you.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => navigate('/plan')}
                size="lg"
                className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] hover:from-[#245f35] hover:to-[#5a8f66] text-white px-12 py-6 text-xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                Plan My Trip
                <Plane className="ml-2 w-6 h-6" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Journey Road Section */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="py-5 relative"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-5 bg-gradient-to-r from-[#2e7f43] to-[#6da57b] bg-clip-text text-transparent">
            Your Journey Starts Here
          </h2>
          
          <div className="relative max-w-7xl mx-auto min-h-[700px]">
            {/* Road Progress Bar Container */}
            <div className="absolute inset-0 flex justify-center">
              {/* Road Path - Progress Bar Track */}
              <div className="relative w-[600px] h-full">
                {/* Road Segments as Progress Track */}
                <div className="absolute w-full h-full">
                  {/* Horizontal Road Segments - Further reduced spacing */}
                  <div className="absolute left-0 top-[10px] w-[500px] h-[40px] bg-gray-600 rounded-full"></div>
                  <div className="absolute right-0 top-[130px] w-[500px] h-[40px] bg-gray-600 rounded-full"></div>
                  <div className="absolute left-0 top-[250px] w-[500px] h-[40px] bg-gray-600 rounded-full"></div>
                  <div className="absolute right-0 top-[370px] w-[500px] h-[40px] bg-gray-600 rounded-full"></div>
                  <div className="absolute left-0 top-[490px] w-[500px] h-[40px] bg-gray-600 rounded-full"></div>
                  
                  {/* Connecting Curves - Adjusted for tighter spacing */}
                  <div className="absolute right-[0px] top-[50px] w-[100px] h-[80px]" 
                       style={{borderRadius: '0 80px 80px 0', borderRight: '40px solid #4b5563'}}></div>
                  <div className="absolute left-[0px] top-[170px] w-[100px] h-[80px]" 
                       style={{borderRadius: '80px 0 0 80px', borderLeft: '40px solid #4b5563'}}></div>
                  <div className="absolute right-[0px] top-[290px] w-[100px] h-[80px]" 
                       style={{borderRadius: '0 80px 80px 0', borderRight: '40px solid #4b5563'}}></div>
                  <div className="absolute left-[0px] top-[410px] w-[100px] h-[80px]" 
                       style={{borderRadius: '80px 0 0 80px', borderLeft: '40px solid #4b5563'}}></div>
                  
                  {/* Road Center Lines */}
                  <div className="absolute left-0 top-[28px] w-[500px] h-[4px] opacity-80"
                       style={{background: 'repeating-linear-gradient(to right, #fbbf24 0px, #fbbf24 20px, transparent 20px, transparent 40px)'}}></div>
                  <div className="absolute right-0 top-[148px] w-[500px] h-[4px] opacity-80"
                       style={{background: 'repeating-linear-gradient(to right, #fbbf24 0px, #fbbf24 20px, transparent 20px, transparent 40px)'}}></div>
                  <div className="absolute left-0 top-[268px] w-[500px] h-[4px] opacity-80"
                       style={{background: 'repeating-linear-gradient(to right, #fbbf24 0px, #fbbf24 20px, transparent 20px, transparent 40px)'}}></div>
                  <div className="absolute right-0 top-[388px] w-[500px] h-[4px] opacity-80"
                       style={{background: 'repeating-linear-gradient(to right, #fbbf24 0px, #fbbf24 20px, transparent 20px, transparent 40px)'}}></div>
                  <div className="absolute left-0 top-[508px] w-[500px] h-[4px] opacity-80"
                       style={{background: 'repeating-linear-gradient(to right, #fbbf24 0px, #fbbf24 20px, transparent 20px, transparent 40px)'}}></div>
                </div>
                
                {/* Progress Indicator Car */}
                <div 
                  className="absolute w-10 h-14 transition-all duration-50 ease-linear z-30"
                  style={{
                    left: `${getProgressPosition(carPosition).x}px`,
                    top: `${getProgressPosition(carPosition).y}px`,
                    transform: `translate(-50%, -50%) rotate(${getProgressPosition(carPosition).rotation}deg)`
                  }}
                >
                  <div className="w-full h-full bg-red-500 rounded-lg relative shadow-2xl border-2 border-red-700">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-8 bg-red-600 rounded-t-lg"></div>
                    <div className="absolute bottom-1 left-1.5 w-2 h-2 bg-black rounded-full"></div>
                    <div className="absolute bottom-1 right-1.5 w-2 h-2 bg-black rounded-full"></div>
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-blue-300 rounded-sm"></div>
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>

                {/* Location Checkpoints */}
                <div className="absolute w-12 h-14" style={{left: '540px', top: '30px', transform: 'translate(-50%, -50%)'}}>
                  <MapPin className="w-12 h-14 text-[#2e7f43] drop-shadow-2xl" fill="currentColor" stroke="white" strokeWidth={1} />
                </div>
                <div className="absolute w-12 h-14" style={{left: '60px', top: '150px', transform: 'translate(-50%, -50%)'}}>
                  <MapPin className="w-12 h-14 text-[#6da57b] drop-shadow-2xl" fill="currentColor" stroke="white" strokeWidth={1} />
                </div>
                <div className="absolute w-12 h-14" style={{left: '540px', top: '270px', transform: 'translate(-50%, -50%)'}}>
                  <MapPin className="w-12 h-14 text-[#2e7f43] drop-shadow-2xl" fill="currentColor" stroke="white" strokeWidth={1} />
                </div>
                <div className="absolute w-12 h-14" style={{left: '60px', top: '390px', transform: 'translate(-50%, -50%)'}}>
                  <MapPin className="w-12 h-14 text-[#6da57b] drop-shadow-2xl" fill="currentColor" stroke="white" strokeWidth={1} />
                </div>
              </div>
            </div>

            {/* Journey Stops - Much tighter spacing */}
            <div className="relative z-20">
              {roadStops.map((stop, index) => {
                const cardPositions = [
                  { top: '60px', left: '50px', side: 'left' },
                  { top: '180px', right: '50px', side: 'right' },
                  { top: '300px', left: '50px', side: 'left' },
                  { top: '420px', right: '50px', side: 'right' }
                ]
                const pos = cardPositions[index]
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: pos.side === 'left' ? -100 : 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 + index * 0.4 }}
                    className="absolute"
                    style={{
                      top: pos.top,
                      left: pos.left,
                      right: pos.right,
                      width: '380px'
                    }}
                  >
                    <Card className="shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-4 bg-white border-2 border-gray-100">
                      <CardHeader className="pb-4">
                        <div className={`flex items-center gap-4 ${pos.side === 'right' ? 'flex-row-reverse' : ''}`}>
                          <div className="w-16 h-16 bg-gradient-to-br from-[#2e7f43] to-[#6da57b] rounded-full flex items-center justify-center shadow-lg">
                            <stop.icon className="w-8 h-8 text-white" />
                          </div>
                          <CardTitle className="text-xl bg-gradient-to-r from-[#2e7f43] to-[#6da57b] bg-clip-text text-transparent">
                            {stop.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-gray-600 text-base leading-relaxed">
                          {stop.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* End of Road Message - Reduced margin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.4 }}
            className="text-center mt-5"
          >
            <h3 className="text-3xl font-bold bg-gradient-to-r from-[#2e7f43] to-[#6da57b] bg-clip-text text-transparent mb-4">
              All at One Place
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your one-stop solution for dream travel is Tripzy - where every journey begins with perfect planning
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2e7f43] to-[#6da57b] rounded-full flex items-center justify-center">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-[#2e7f43] to-[#6da57b] bg-clip-text text-transparent">
                  Tripzy
                </span>
              </div>
              <p className="text-gray-400 mb-4">
                Your AI-powered travel companion for unforgettable journeys.
              </p>
              <div className="flex space-x-4">
                <Facebook className="w-6 h-6 text-gray-400 hover:text-[#6da57b] cursor-pointer transition-colors" />
                <Twitter className="w-6 h-6 text-gray-400 hover:text-[#6da57b] cursor-pointer transition-colors" />
                <Instagram className="w-6 h-6 text-gray-400 hover:text-[#6da57b] cursor-pointer transition-colors" />
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-[#6da57b]">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-[#6da57b]">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Trip Planning</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hotel Booking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Flight Search</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Local Guides</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-[#6da57b]">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>info@tripzy.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Mumbai, India</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Tripzy. All rights reserved. Made with ❤️ for travelers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Progress bar position calculator - Car follows exact road segments
function getProgressPosition(progress) {
  // Tighter road segments to match compressed layout
  const roadSegments = [
    // First segment: left to right (0% - 20%)
    { startX: 20, endX: 500, y: 30, rotation: 0, startProgress: 0, endProgress: 0.20 },
    
    // First curve: right turn (20% - 25%)
    { startX: 500, endX: 540, y: 30, rotation: 30, startProgress: 0.20, endProgress: 0.22 },
    { startX: 540, endX: 540, y: 60, rotation: 60, startProgress: 0.22, endProgress: 0.23 },
    { startX: 540, endX: 540, y: 100, rotation: 90, startProgress: 0.23, endProgress: 0.24 },
    { startX: 540, endX: 540, y: 130, rotation: 120, startProgress: 0.24, endProgress: 0.25 },
    
    // Second segment: right to left (25% - 45%)
    { startX: 520, endX: 120, y: 150, rotation: 180, startProgress: 0.25, endProgress: 0.45 },
    
    // Second curve: left turn (45% - 50%)
    { startX: 120, endX: 80, y: 150, rotation: 210, startProgress: 0.45, endProgress: 0.47 },
    { startX: 80, endX: 50, y: 180, rotation: 240, startProgress: 0.47, endProgress: 0.48 },
    { startX: 50, endX: 50, y: 220, rotation: 270, startProgress: 0.48, endProgress: 0.49 },
    { startX: 50, endX: 50, y: 250, rotation: 300, startProgress: 0.49, endProgress: 0.50 },
    
    // Third segment: left to right (50% - 70%)
    { startX: 70, endX: 500, y: 270, rotation: 0, startProgress: 0.50, endProgress: 0.70 },
    
    // Third curve: right turn (70% - 75%)
    { startX: 500, endX: 540, y: 270, rotation: 30, startProgress: 0.70, endProgress: 0.72 },
    { startX: 540, endX: 540, y: 300, rotation: 60, startProgress: 0.72, endProgress: 0.73 },
    { startX: 540, endX: 540, y: 340, rotation: 90, startProgress: 0.73, endProgress: 0.74 },
    { startX: 540, endX: 540, y: 370, rotation: 120, startProgress: 0.74, endProgress: 0.75 },
    
    // Fourth segment: right to left (75% - 95%)
    { startX: 520, endX: 120, y: 390, rotation: 180, startProgress: 0.75, endProgress: 0.95 },
    
    // Fourth curve and final segment (95% - 100%)
    { startX: 120, endX: 80, y: 390, rotation: 210, startProgress: 0.95, endProgress: 0.97 },
    { startX: 80, endX: 50, y: 420, rotation: 240, startProgress: 0.97, endProgress: 0.98 },
    { startX: 50, endX: 50, y: 460, rotation: 270, startProgress: 0.98, endProgress: 0.99 },
    { startX: 50, endX: 50, y: 490, rotation: 300, startProgress: 0.99, endProgress: 1.0 },
    
    // Final segment
    { startX: 70, endX: 250, y: 510, rotation: 0, startProgress: 1.0, endProgress: 1.0 }
  ]
  
  // Find which segment the progress falls into
  for (let segment of roadSegments) {
    if (progress >= segment.startProgress && progress <= segment.endProgress) {
      const segmentLength = segment.endProgress - segment.startProgress
      const segmentProgress = segmentLength > 0 ? (progress - segment.startProgress) / segmentLength : 0
      
      return {
        x: segment.startX + (segment.endX - segment.startX) * segmentProgress,
        y: segment.y,
        rotation: segment.rotation
      }
    }
  }
  
  // Fallback to last position
  return { x: 250, y: 510, rotation: 0 }
}

export default Landing