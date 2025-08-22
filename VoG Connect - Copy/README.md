# VoG Connect - Student Video Upload System

A web application for students to upload and share videos showcasing their growth and experiences with the VoG (Vision of the Graduate) pillars. Features Google OAuth authentication for secure video uploads.

## Features

- **Google OAuth Authentication**: Secure sign-in using Google accounts
- **Video Upload**: Upload videos with titles and descriptions
- **Video Gallery**: Browse and watch uploaded videos
- **User Management**: Users can only delete their own videos
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Python 3.7 or higher
- Google Cloud Platform account (for OAuth)

### Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Google OAuth** (see `setup-google-oauth.md` for detailed instructions):
   - Create a Google Cloud Project
   - Enable Google+ API
   - Configure OAuth consent screen
   - Create OAuth 2.0 credentials
   - Update the Client ID in the code

4. **Update configuration**:
   - Replace `your-google-client-id` in `student-upload.html` with your actual Client ID
   - Set environment variables (recommended):
     ```bash
     export GOOGLE_CLIENT_ID="your-client-id"
     export GOOGLE_CLIENT_SECRET="your-client-secret"
     export SECRET_KEY="your-secret-key"
     ```

5. **Run the application**:
   ```bash
   python app.py
   ```

6. **Open in browser**:
   - Navigate to `http://localhost:5000/student-upload.html`
   - Click "Sign in with Google"
   - Start uploading videos!

## File Structure

```
VoG Connect - Copy/
├── app.py                          # Main Flask application
├── requirements.txt                # Python dependencies
├── setup-google-oauth.md          # Google OAuth setup guide
├── test_auth.py                   # Authentication test script
├── student-upload.html            # Main upload page
├── js/
│   └── student-upload.js          # Frontend JavaScript
├── styles/
│   └── student-upload.css         # Styling
├── uploads/                       # Video storage directory
└── videos.db                      # SQLite database
```

## How It Works

### Authentication Flow

1. **User clicks "Sign in with Google"** on the student upload page
2. **Google OAuth popup** appears for user authentication
3. **Google returns an ID token** to the frontend
4. **Frontend sends token** to `/auth/google` endpoint
5. **Backend verifies token** with Google's servers
6. **User session is created** and stored in Flask session
7. **Upload form becomes available** for authenticated users

### Video Upload Process

1. **Authenticated user** fills out video upload form
2. **Form data and video file** are sent to `/upload` endpoint
3. **Backend validates** authentication and file type
4. **Video is saved** to `uploads/` directory
5. **Database record** is created with user information
6. **Success response** is returned to frontend

### Security Features

- **Authentication required** for all upload operations
- **Users can only delete** their own videos
- **Session-based authentication** with secure cookies
- **File type validation** for video uploads
- **CSRF protection** through session management

## API Endpoints

### Authentication
- `GET /auth/status` - Check authentication status
- `POST /auth/google` - Authenticate with Google OAuth
- `POST /auth/logout` - Logout user

### Videos
- `GET /videos` - Get all videos (public)
- `POST /upload` - Upload video (requires authentication)
- `DELETE /delete_video/<id>` - Delete video (requires authentication + ownership)
- `GET /uploads/<filename>` - Serve video files

## Testing

Run the test script to verify authentication endpoints:

```bash
python test_auth.py
```

## Troubleshooting

### Common Issues

1. **"Invalid client" error**:
   - Check that your Google Client ID is correct
   - Verify the Client ID is updated in both `student-upload.html` and `app.py`

2. **"Unauthorized domain" error**:
   - Add your domain to authorized origins in Google Cloud Console
   - For development: add `http://localhost:5000`

3. **Upload fails with 401**:
   - Make sure you're signed in with Google
   - Check browser console for authentication errors

4. **CORS errors**:
   - Ensure Flask CORS is properly configured
   - Check that your domain is allowed

### Development Tips

- Use browser developer tools to check for JavaScript errors
- Monitor Flask server logs for backend errors
- Test with different Google accounts
- Verify file permissions on the `uploads/` directory

## Production Deployment

For production deployment:

1. **Use HTTPS** - Google OAuth requires secure connections
2. **Set environment variables** for sensitive configuration
3. **Use a production WSGI server** like Gunicorn
4. **Configure proper CORS** for your domain
5. **Set up proper file storage** (consider cloud storage for videos)
6. **Use a production database** (PostgreSQL, MySQL, etc.)

Example Gunicorn command:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Contributing

1. Follow the existing code style
2. Test authentication flows thoroughly
3. Ensure security best practices
4. Update documentation as needed

## License

This project is created for Windham Technical High School VoG Connect.

## Support

For technical support or questions about the Google OAuth setup, refer to the `setup-google-oauth.md` file or contact the development team.
