# Auth0 Backend Integration Setup

This backend server is now integrated with Auth0 for authentication and authorization.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Auth0 Configuration
AUTH0_AUDIENCE=https://dev-y90go66m.us.auth0.com/api/v2/
AUTH0_ISSUER_BASE_URL=https://dev-y90go66m.us.auth0.com/
```

## Protected Endpoints

The following endpoints now require authentication:

- `POST /api/chat` - Bedrock chat endpoint
- `POST /api/ollama-chat` - Ollama chat endpoint  
- `GET /api/profile` - Get user profile information

## Public Endpoints

- `GET /status` - Server status (no authentication required)

## How It Works

1. **Frontend**: Your React app uses Auth0 React SDK to handle login/logout
2. **Token**: After login, Auth0 provides a JWT token
3. **API Calls**: Frontend includes the token in Authorization header: `Bearer <token>`
4. **Backend**: Express middleware validates the JWT token using Auth0's public keys
5. **User Info**: If valid, user information is extracted and available in `req.user`

## Frontend Integration

Make sure your frontend API calls include the Auth0 token:

```javascript
import { useAuth0 } from '@auth0/auth0-react';

const { getAccessTokenSilently } = useAuth0();

const callApi = async () => {
  try {
    const token = await getAccessTokenSilently();
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: [...] })
    });
    // Handle response
  } catch (error) {
    console.error('Error calling API:', error);
  }
};
```

## Testing

1. Start the backend server: `npm start`
2. Test the status endpoint: `curl http://localhost:8000/status`
3. Test protected endpoint without token (should return 401):
   ```bash
   curl -X POST http://localhost:8000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Hello"}]}'
   ```

## Troubleshooting

- **401 Unauthorized**: Check that the token is valid and not expired
- **403 Forbidden**: Check Auth0 audience and issuer configuration
- **500 Internal Server Error**: Check server logs for detailed error information

## Security Notes

- JWT tokens are validated using Auth0's public keys (JWKS)
- Tokens are automatically verified for signature, expiration, and issuer
- User information is extracted from the token payload
- All authentication failures are logged for monitoring 