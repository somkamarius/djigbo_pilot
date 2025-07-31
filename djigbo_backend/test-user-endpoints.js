const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8000';

// Mock Auth0 token for testing (you'll need to replace this with a real token)
const MOCK_TOKEN = 'your-auth0-token-here';

async function testUserEndpoints() {
    console.log('Testing User Management Endpoints...\n');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOCK_TOKEN}`
    };

    try {
        // Test 1: Check if user exists
        console.log('1. Testing GET /api/user/check');
        const checkResponse = await fetch(`${BASE_URL}/api/user/check`, {
            method: 'GET',
            headers
        });

        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            console.log('✅ User check successful:', checkData);
        } else {
            console.log('❌ User check failed:', checkResponse.status, checkResponse.statusText);
        }

        // Test 2: Register new user
        console.log('\n2. Testing POST /api/user/register');
        const registerData = {
            nickname: 'TestUser',
            avatar: 'https://example.com/avatar.jpg'
        };

        const registerResponse = await fetch(`${BASE_URL}/api/user/register`, {
            method: 'POST',
            headers,
            body: JSON.stringify(registerData)
        });

        if (registerResponse.ok) {
            const registerResult = await registerResponse.json();
            console.log('✅ User registration successful:', registerResult);
        } else {
            const errorData = await registerResponse.json();
            console.log('❌ User registration failed:', errorData);
        }

        // Test 3: Update user
        console.log('\n3. Testing PUT /api/user/update');
        const updateData = {
            nickname: 'UpdatedTestUser',
            avatar: 'https://example.com/new-avatar.jpg'
        };

        const updateResponse = await fetch(`${BASE_URL}/api/user/update`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateData)
        });

        if (updateResponse.ok) {
            const updateResult = await updateResponse.json();
            console.log('✅ User update successful:', updateResult);
        } else {
            const errorData = await updateResponse.json();
            console.log('❌ User update failed:', errorData);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the tests
testUserEndpoints(); 