const fetch = require('node-fetch');

// Test the Together.ai endpoint
async function testTogetherEndpoint() {
    const testUrl = 'http://localhost:8000/api/together-chat';

    const testData = {
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello! Can you tell me a short joke?' }
        ],
        max_tokens: 100
    };

    try {
        console.log('Testing Together.ai endpoint...');
        console.log('Request data:', JSON.stringify(testData, null, 2));

        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: You'll need to add a valid JWT token here for authentication
                // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
            },
            body: JSON.stringify(testData)
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Response data:', JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log('Error response:', errorText);
        }
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the test
testTogetherEndpoint(); 