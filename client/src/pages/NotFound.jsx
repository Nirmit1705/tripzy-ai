import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, MapPin, Plane, Compass } from "lucide-react"

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        {/* Travel-themed 404 */}
        <div className="relative mb-8">
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-[#2e7f43] to-[#6da57b] bg-clip-text text-transparent opacity-20">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-6 shadow-2xl border-4 border-[#2e7f43]/20">
              <Compass className="w-16 h-16 text-[#2e7f43]" />
            </div>
          </div>
        </div>

        {/* Travel-themed messaging */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2e7f43] mb-4">
            Oops! You've Lost Your Way
          </h2>
          <p className="text-xl text-gray-600 mb-4 leading-relaxed">
            It looks like this destination doesn't exist on our travel map.
          </p>
          <p className="text-lg text-gray-500">
            Let's get you back on track to plan your perfect trip!
          </p>
        </div>

        {/* Travel icons decoration */}
        <div className="flex justify-center gap-6 mb-8 opacity-60">
          <MapPin className="w-8 h-8 text-[#6da57b]" />
          <Plane className="w-8 h-8 text-[#2e7f43]" />
          <Compass className="w-8 h-8 text-[#6da57b]" />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center gap-2 border-[#6da57b] text-[#6da57b] hover:bg-[#6da57b] hover:text-white px-8 py-3 text-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-gradient-to-r from-[#2e7f43] to-[#6da57b] hover:from-[#245f35] hover:to-[#5a8f66] text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
        </div>

        {/* Additional CTA */}
        <div className="mt-8 p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-[#6da57b]/20">
          <p className="text-gray-600 mb-4">
            Ready to start planning your next adventure?
          </p>
          <Button 
            onClick={() => navigate('/plan')}
            className="bg-gradient-to-r from-[#2e7f43] to-[#6da57b] hover:from-[#245f35] hover:to-[#5a8f66] text-white"
          >
            <Plane className="w-4 h-4 mr-2" />
            Plan My Trip
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
