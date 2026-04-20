# BookFlow
smart library management system

## Google Authentication Setup

To enable Google login/register, create OAuth credentials in Google Cloud Console and set these values:

- Backend: `APP_AUTH_GOOGLE_CLIENT_ID=<google-oauth-client-id>`
- Frontend: `VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>`

Optional API URL for frontend:

- Frontend: `VITE_API_BASE_URL=http://localhost:8080/api`
