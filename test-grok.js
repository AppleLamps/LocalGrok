// Test script for Grok API
import fetch from 'node-fetch';

// Extract API key from command line or use the one provided in the file
const apiKey = process.argv[2] || ''; // Pass your API key as a command line argument

// Make sure we have an API key
if (!apiKey) {
  console.error('Please provide an API key as a command line argument:');
  console.error('node test-grok.js YOUR_API_KEY');
  process.exit(1);
}

// Function to test the Grok API
async function testGrokApi() {
  try {
    console.log('Testing Grok API connection...');
    
    // Log a masked version of the key for debugging
    const maskedKey = apiKey.length > 8 
      ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
      : '********';
    console.log(`Using API key: ${maskedKey}`);
    
    // Define the API endpoint (x.ai is the correct domain for Grok)
    const apiEndpoint = 'https://api.x.ai/v1/chat/completions';
    
    // Create a test payload
    const payload = {
      model: 'grok-2-latest',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Hello! Can you tell me if you\'re working?'
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    };
    
    console.log('Sending request to:', apiEndpoint);
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    // Send the request
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log('Response headers:', response.headers);
    
    // Try to parse the response as JSON
    try {
      const data = await response.json();
      console.log('Response body:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ SUCCESS: Grok API is working correctly!');
        if (data.choices && data.choices[0] && data.choices[0].message) {
          console.log('\nGrok says:', data.choices[0].message.content);
        }
      } else {
        console.error('❌ ERROR: API returned an error status code');
        if (data.error) {
          console.error('Error details:', data.error);
        }
      }
    } catch (jsonError) {
      // If JSON parsing fails, try to get the raw text
      console.error('Could not parse JSON response:', jsonError.message);
      const text = await response.text();
      console.log('Raw response:', text);
    }
  } catch (error) {
    console.error('❌ ERROR connecting to Grok API:', error);
  }
}

// Run the test
testGrokApi(); 