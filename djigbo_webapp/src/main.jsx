import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react';
import * as Sentry from "@sentry/react";
import './index.css'
import App from './App.jsx'

Sentry.init({
  dsn: "https://372487d259aee632bcbe1e8dce16a379@o4504626835619840.ingest.us.sentry.io/4509798071402496",
  integrations: [Sentry.browserTracingIntegration()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.1,
  // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api\//],
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>}>
      <Auth0Provider
        domain="dev-y90go66m.us.auth0.com"
        clientId="V7vtBCzYDBCYchw6lhEZardIfv6B9dhU"
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: "https://dev-y90go66m.us.auth0.com/api/v2/"
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Auth0Provider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
