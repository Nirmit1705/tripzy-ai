const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('🔧 Environment Setup Test\n');

// Check essential environment variables
const requiredEnvVars = {
  'NODE_ENV': process.env.NODE_ENV,
  'PORT': process.env.PORT,
  'MONGO_URI': process.env.MONGO_URI ? 'Set' : 'Missing',
  'JWT_SECRET': process.env.JWT_SECRET ? 'Set' : 'Missing',
  'GROQ_API_KEY': process.env.GROQ_API_KEY ? 'Set' : 'Missing'
};

console.log('Environment Variables:');
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// Test Groq API connection
async function testGroqConnection() {
  if (!process.env.GROQ_API_KEY) {
    console.log('\nCannot test Groq API - API key missing');
    return;
  }

  try {
    const groqService = require('./services/groqService');
    console.log('\nTesting Groq API connection...');
    
    const response = await groqService.chatCompletion([
      {
        role: 'user',
        content: 'Say "Hello World" if you can hear me.'
      }
    ], {
      maxTokens: 50,
      temperature: 0.1
    });

    if (response.choices && response.choices[0]) {
      console.log('Groq API connection successful!');
      console.log(`Response: ${response.choices[0].message.content}`);
    } else {
      console.log('Groq API responded but format unexpected');
    }
  } catch (error) {
    console.log('Groq API connection failed:', error.message);
  }
}

// Test database connection
async function testDatabaseConnection() {
  if (!process.env.MONGO_URI) {
    console.log('\nCannot test database - MONGO_URI missing');
    return;
  }

  try {
    console.log('\nTesting database connection...');
    const mongoose = require('mongoose');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connection successful!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('Database connection failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testDatabaseConnection();
  await testGroqConnection();
  
  console.log('\nSetup Complete! Next steps:');
  console.log('1. Start your server: npm run dev');
  console.log('2. Start your client: cd client && npm run dev');
  console.log('3. Test the trip form submission');
}

runTests().catch(console.error);