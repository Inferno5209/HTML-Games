# Google OAuth Setup Guide

To enable Google Sign-In for video uploads, you need to configure Google OAuth credentials.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "VoG Connect"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email addresses)

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the following:
   - Name: "VoG Connect Web Client"
   - Authorized JavaScript origins: 
     - `http://localhost:5000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5000` (for development)
     - `https://yourdomain.com` (for production)

## Step 4: Update Configuration

1. Copy your Client ID and Client Secret
2. Update the following files:

### In `student-upload.html`:
Replace `your-google-client-id` with your actual Client ID:
```html
<div id="g_id_onload"
     data-client_id="YOUR_ACTUAL_CLIENT_ID"
     data-callback="handleCredentialResponse"
     data-auto_prompt="false">
</div>
```

### In `app.py`:
Set environment variables or update the default values:
```python
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'YOUR_ACTUAL_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', 'YOUR_ACTUAL_CLIENT_SECRET')
```

## Step 5: Set Environment Variables (Recommended)

For production, set these environment variables:
```bash
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export SECRET_KEY="your-secret-key-for-sessions"
```

## Step 6: Test the Setup

1. Run your Flask application
2. Go to the student upload page
3. Click the "Sign in with Google" button
4. Complete the OAuth flow
5. Try uploading a video

## Troubleshooting

### Common Issues:

1. **"Invalid client" error**: Check that your Client ID is correct
2. **"Unauthorized domain" error**: Make sure your domain is in the authorized origins
3. **"Redirect URI mismatch"**: Verify the redirect URIs in Google Console match your app
4. **CORS errors**: Ensure your Flask CORS configuration allows your domain

### For Development:
- Use `http://localhost:5000` in authorized origins
- Make sure you're running the app on the correct port
- Check browser console for any JavaScript errors

### For Production:
- Use HTTPS URLs in authorized origins
- Set proper environment variables
- Use a strong SECRET_KEY
- Consider using a production WSGI server like Gunicorn

## Security Notes

- Never commit your Client Secret to version control
- Use environment variables for sensitive configuration
- Regularly rotate your Client Secret
- Monitor your OAuth usage in Google Cloud Console
