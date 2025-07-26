const jwt = require('jsonwebtoken');

// Test function to decode JWT tokens
function decodeToken(token) {
    try {
        // Decode without verification to see the payload
        const decoded = jwt.decode(token, { complete: true });

        if (!decoded) {
            console.log('❌ Token could not be decoded');
            return;
        }

        console.log('✅ Token decoded successfully');
        console.log('Header:', JSON.stringify(decoded.header, null, 2));
        console.log('Payload:', JSON.stringify(decoded.payload, null, 2));

        // Check if it's a valid JWT format
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.log('❌ Invalid JWT format - should have 3 parts');
            return;
        }

        console.log('✅ Valid JWT format (3 parts)');
        console.log('Token length:', token.length);
        console.log('Part 1 length (header):', parts[0].length);
        console.log('Part 2 length (payload):', parts[1].length);
        console.log('Part 3 length (signature):', parts[2].length);

    } catch (error) {
        console.log('❌ Error decoding token:', error.message);
    }
}

// Test with a sample token (this is just for format testing)
const sampleToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMyJ9.eyJpc3MiOiJodHRwczovL2Rldi15OTBnbzY2bS51cy5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8MTIzNDU2Nzg5MCIsImF1ZCI6Imh0dHBzOi8vZGV2LTk5MGdvNjZtLnVzLmF1dGgwLmNvbS9hcGkvdjIvIiwiaWF0IjoxNjM5NzI5NjAwLCJleHAiOjE2Mzk3MzMyMDB9.signature';
console.log('Testing sample token format...');
decodeToken(sampleToken);

console.log('\nTo test with a real token:');
console.log('1. Login through the frontend');
console.log('2. Open browser dev tools');
console.log('3. In the Network tab, find a request to /api/chat');
console.log('4. Copy the Authorization header value');
console.log('5. Run: node test-token.js <your-token>'); 