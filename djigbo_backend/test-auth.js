const fetch = require('node-fetch');

// Test script to demonstrate Auth0 integration
async function testEndpoints() {
    const baseUrl = 'http://localhost:8000';

    console.log('🔍 Testing Auth0 Integration\n');

    // Test 1: Public endpoint (should work without token)
    console.log('1. Testing public endpoint (/status)...');
    try {
        const statusResponse = await fetch(`${baseUrl}/status`);
        const statusData = await statusResponse.json();
        console.log('✅ Status endpoint response:', statusData);
    } catch (error) {
        console.log('❌ Status endpoint error:', error.message);
    }

    console.log('\n2. Testing protected endpoint without token (/api/chat)...');
    try {
        const chatResponse = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Hello' }
                ]
            })
        });

        if (chatResponse.status === 401) {
            console.log('✅ Correctly returned 401 Unauthorized (no token provided)');
        } else {
            console.log('❌ Unexpected response:', chatResponse.status);
        }
    } catch (error) {
        console.log('❌ Chat endpoint error:', error.message);
    }

    console.log('\n3. Testing protected endpoint with invalid token...');
    try {
        const chatResponse = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid-token'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Hello' }
                ]
            })
        });

        if (chatResponse.status === 401) {
            console.log('✅ Correctly returned 401 Unauthorized (invalid token)');
        } else {
            console.log('❌ Unexpected response:', chatResponse.status);
        }
    } catch (error) {
        console.log('❌ Chat endpoint error:', error.message);
    }

    console.log('\n📋 Summary:');
    console.log('- Public endpoints work without authentication');
    console.log('- Protected endpoints require valid Auth0 JWT token');
    console.log('- Invalid or missing tokens return 401 Unauthorized');
    console.log('\n🔐 To test with a valid token:');
    console.log('1. Login through your React frontend');
    console.log('2. Get the access token using getAccessTokenSilently()');
    console.log('3. Include it in the Authorization header: Bearer <token>');
}

// Run the test
testEndpoints().catch(console.error); 