import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome Back!</h1>
        <p className="text-lg text-gray-600 mb-8">Ready to plan your next adventure?</p>
        <Button 
          onClick={() => navigate('/plan')}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Start Planning
        </Button>
      </div>
    </div>
  )
}

export default Home
