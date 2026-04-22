# BookFlow
smart library management system

## Google Authentication Setup

To enable Google login/register, create OAuth credentials in Google Cloud Console and set these values:

- Backend: `APP_AUTH_GOOGLE_CLIENT_ID=<google-oauth-client-id>`
- Frontend: `VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>`

Optional API URL for frontend:

- Frontend: `VITE_API_BASE_URL=http://localhost:8080/api`

### Fix for Error 400: origin_mismatch

If Google shows `Access blocked` with `Error 400: origin_mismatch`, the frontend origin is not whitelisted in your OAuth client.

1. Open Google Cloud Console -> APIs & Services -> Credentials.
2. Open your OAuth 2.0 Client ID used in `VITE_GOOGLE_CLIENT_ID`.
3. Ensure application type is `Web application`.
4. Add these to `Authorized JavaScript origins` (as needed):
	- `http://localhost:5173`
	- `http://127.0.0.1:5173`
	- `http://192.168.8.122:5173` (only if you open the app via this LAN URL)
5. Add this to `Authorized redirect URIs`:
	- `http://localhost:5173`
6. Save changes and wait 1-5 minutes for Google to propagate.

Important:
- The origin must match exactly (scheme + host + port).
- `localhost` and `127.0.0.1` are different origins.
- If Vite runs on a different port, update both Vite config and Google origins.
