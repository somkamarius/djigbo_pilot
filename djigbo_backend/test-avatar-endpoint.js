const fetch = require('node-fetch');

async function testAvatarEndpoint() {
    const baseUrl = 'http://localhost:3001'; // Adjust port if needed

    console.log('Testing avatar endpoint...');

    // Test 1: Get avatar for a non-existent user
    try {
        const response = await fetch(`${baseUrl}/api/user/avatar/nonexistent`);
        console.log('Test 1 - Non-existent user:', response.status, response.statusText);
    } catch (error) {
        console.log('Test 1 - Error:', error.message);
    }

    // Test 2: Get avatar for a user without avatar
    try {
        const response = await fetch(`${baseUrl}/api/user/avatar/some-user-id`);
        console.log('Test 2 - User without avatar:', response.status, response.statusText);
    } catch (error) {
        console.log('Test 2 - Error:', error.message);
    }

    console.log('Avatar endpoint tests completed.');
}

testAvatarEndpoint().catch(console.error); 