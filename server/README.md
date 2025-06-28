# TripzyAI Backend

AI-powered trip planning backend service that generates personalized travel itineraries using advanced language models.

## Features

- User authentication and profile management
- AI-powered itinerary generation with multi-destination support
- Starting location and multiple destinations planning
- Route optimization for multiple destinations
- Real-time weather integration
- Interactive AI agent for trip modifications including activity swapping
- Hotel search and booking via Amadeus API
- Place recommendations via OpenStreetMap
- Budget optimization
- OpenStreetMap integration for location services

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **AI/LLM**: Groq API
- **External APIs**: Weather API, OpenStreetMap Nominatim, Amadeus Hotel API
- **Maps**: OpenStreetMap with Leaflet (frontend)
- **Authentication**: JWT tokens

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your API keys
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### User Routes (`/api/user`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile
- `GET /trip-history` - Get user's past completed trips
- `GET /current-trips` - Get user's current and upcoming trips
- `GET /travel-stats` - Get user's travel statistics and analytics
- `PUT /rate-trip/:id` - Rate and review a completed trip

### Itinerary Routes (`/api/itinerary`)
- `POST /generate` - Generate new itinerary from form data
- `POST /save-draft` - Save draft itinerary
- `GET /` - Get user itineraries (with pagination and filtering)
- `GET /:id` - Get specific itinerary
- `PUT /:id` - Update itinerary
- `PUT /:id/save` - Save/confirm itinerary
- `PUT /:id/regenerate` - Regenerate itinerary with AI
- `DELETE /:id` - Delete itinerary

### Agent Routes (`/api/agent`)
- `POST /chat` - Chat with AI agent (includes actionable changes and activity swapping)
- `POST /update` - Update itinerary via AI  
- `POST /apply-change` - Apply specific actionable change to itinerary (supports swapping)

### Map Routes (`/api/map`)
- `GET /geocode` - Convert address to coordinates
- `GET /reverse-geocode` - Convert coordinates to address
- `GET /search` - Search for places
- `GET /distance` - Calculate distance between points
- `GET /config` - Get map configuration
- `GET /hotels` - Search hotels by city using Amadeus API
- `GET /hotel-offers` - Get hotel offers and pricing
- `POST /multi-destination-route` - Plan optimal route for multiple destinations
- `POST /geocode-multiple` - Geocode multiple locations at once
- `POST /multi-destination-hotels` - Get hotels for multiple destinations

## Supported Modification Types

The AI agent supports various types of itinerary modifications:

### Basic Modifications
- **Add activities**: "Add Taj Mahal to day 2"
- **Remove activities**: "Remove the shopping activity from day 1"
- **Change hotels**: "Change the hotel on day 1 to luxury"
- **Update meals**: "Replace lunch with Italian cuisine on day 2"

### Advanced Operations
- **Activity swapping**: "Swap day 1 activities with day 2 activities"
- **Full day exchange**: "Exchange everything between day 1 and day 3"
- **Selective swapping**: "Move day 2 activities to day 1"

### Feasibility Checking
- Validates impossible requests (e.g., "travel from USA to India in 1 day")
- Checks budget constraints for luxury requests
- Ensures day numbers are within trip duration

## Environment Variables

See `.env` file for required environment variables including API keys for various services.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
