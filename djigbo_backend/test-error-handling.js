const fetch = require('node-fetch');

// Test script to verify error handling
async function testErrorHandling() {
    const baseUrl = 'http://localhost:8000';

    console.log('Testing error handling...\n');

    // Test 1: Invalid API key error (should be caught by Sentry)
    console.log('Test 1: Testing Together.ai with invalid API key...');
    try {
        const response = await fetch(`${baseUrl}/api/together-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // This will be rejected by Auth0
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Hello' }
                ]
            })
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);
    } catch (error) {
        console.log('Request failed:', error.message);
    }

    console.log('\nTest completed. Check Sentry for error reports.');
}

// Run the test
testErrorHandling().catch(console.error); 