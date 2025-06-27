const mongoose = require('mongoose');
const logger = require('./utils/logger');

async function startupCheck() {
  console.log('🚀 Starting Tripzy Server...\n');

  // Check environment
  const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'GROQ_API_KEY'];
  const missingEnv = requiredEnv.filter(env => !process.env[env]);

  if (missingEnv.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingEnv.forEach(env => console.log(`  - ${env}`));
    console.log('\nPlease check your .env file');
    process.exit(1);
  }

  console.log('Environment variables loaded');

  // Test database connection
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected');
  } catch (error) {
    console.log('Database connection failed:', error.message);
    process.exit(1);
  }

  // Test Groq API
  try {
    const groqService = require('./services/groqService');
    await groqService.chatCompletion([
      { role: 'user', content: 'Test connection' }
    ], { maxTokens: 10 });
    console.log('Groq API connected');
  } catch (error) {
    console.log('Groq API connection issue:', error.message);
    console.log('   Server will start but AI features may not work');
  }

  console.log('\nAll systems ready!');
  console.log('Server starting on port', process.env.PORT || 5000);
}

module.exports = startupCheck;