import { BrowserRouter, Routes, Route } from "react-router-dom"
import Landing from "./pages/Landing"
import Home from "./pages/Home"
import TripForm from "./pages/TripForm"
import Results from "./pages/Results"
import Profile from "./pages/Profile"
import NotFound from "./pages/NotFound"
import LoginPage from "./pages/login"

const App = () => (
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/plan" element={<TripForm />} />
      <Route path="/results" element={<Results />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)

export default App
