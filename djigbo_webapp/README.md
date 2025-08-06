# Džigbo Web Application

A React-based web application for the Džigbo empathy chatbot system.

## Environment Variables

The application uses the following environment variables:

### Required
- `VITE_API_BASE_URL` - The base URL for the backend API (e.g., `http://localhost:8000`)

### Optional
- `VITE_USE_REAL_CHAT` - Toggle between mock and real chat endpoints (defaults to mock if not specified)

### Chat Endpoint Toggle

The `VITE_USE_REAL_CHAT` variable controls which chat endpoint to use:

- `0` or not set - Use mock endpoint (`/api/chat-mock`) for testing
- `1` - Use real Together.ai chat endpoint (`/api/together-chat`)

### Example Configuration

Create a `.env` file in the project root with:

```bash
# Use mock endpoint (default)
VITE_API_BASE_URL=http://localhost:8000
# VITE_USE_REAL_CHAT=0  # or omit this line

# Use real Together.ai endpoint
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_REAL_CHAT=1
```

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
