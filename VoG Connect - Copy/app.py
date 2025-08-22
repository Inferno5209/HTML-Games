import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory, current_app, g, session, redirect, url_for
from werkzeug.utils import secure_filename
from flask_cors import CORS
from datetime import datetime
import json
from google.oauth2 import id_token
from google.auth.transport import requests
import requests as http_requests

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

# Configure CORS to allow requests from your frontend
CORS(app, resources={
    r"/*": {
        "origins": "*",  # Allow all origins in development
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

UPLOAD_FOLDER = 'uploads'
DATABASE = 'videos.db'
MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size
ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'}

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'your-google-client-id')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', 'your-google-client-secret')

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['DATABASE'] = DATABASE
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

# Create schema.sql file if it doesn't exist
SCHEMA_SQL_CONTENT = """
DROP TABLE IF EXISTS videos;
CREATE TABLE videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL UNIQUE,
    upload_date TEXT NOT NULL,
    user_email TEXT,
    user_name TEXT
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    google_id TEXT UNIQUE,
    created_date TEXT NOT NULL
);
"""

if not os.path.exists('schema.sql'):
    with open('schema.sql', 'w') as f:
        f.write(SCHEMA_SQL_CONTENT)

# Initialize the database
init_db()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def login_required(f):
    """Decorator to require authentication for routes"""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/auth/google', methods=['POST'])
def google_auth():
    """Handle Google OAuth authentication"""
    try:
        data = request.get_json()
        id_token_data = data.get('id_token')
        
        if not id_token_data:
            return jsonify({'error': 'No ID token provided'}), 400
        
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(
            id_token_data, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Get user info from the token
        user_email = idinfo['email']
        user_name = idinfo.get('name', 'Unknown')
        google_id = idinfo['sub']
        
        # Store or update user in database
        db = get_db()
        try:
            # Check if user exists
            user = db.execute(
                'SELECT * FROM users WHERE email = ? OR google_id = ?', 
                (user_email, google_id)
            ).fetchone()
            
            if user:
                # Update existing user
                db.execute(
                    'UPDATE users SET name = ?, google_id = ? WHERE email = ?',
                    (user_name, google_id, user_email)
                )
                user_id = user['id']
            else:
                # Create new user
                cursor = db.execute(
                    'INSERT INTO users (email, name, google_id, created_date) VALUES (?, ?, ?, ?)',
                    (user_email, user_name, google_id, datetime.now().isoformat())
                )
                user_id = cursor.lastrowid
            
            db.commit()
            
            # Store user info in session
            session['user_id'] = user_id
            session['user_email'] = user_email
            session['user_name'] = user_name
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user_id,
                    'email': user_email,
                    'name': user_name
                }
            }), 200
            
        except Exception as e:
            db.rollback()
            return jsonify({'error': f'Database error: {str(e)}'}), 500
            
    except ValueError as e:
        return jsonify({'error': 'Invalid token'}), 400
    except Exception as e:
        return jsonify({'error': f'Authentication error: {str(e)}'}), 500

@app.route('/auth/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'success': True}), 200

@app.route('/auth/status', methods=['GET'])
def auth_status():
    """Check authentication status"""
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'email': session['user_email'],
                'name': session['user_name']
            }
        }), 200
    else:
        return jsonify({'authenticated': False}), 200

@app.route('/upload', methods=['POST', 'OPTIONS'])
@login_required
def upload_video():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file part'}), 400

        file = request.files['video']
        title = request.form.get('title')
        description = request.form.get('description')

        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not title or not description:
            return jsonify({'error': 'Missing form data (title or description)'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Please upload a video file (mp4, mov, avi, wmv, flv, webm)'}), 400

        if file:
            try:
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                # Check if file already exists
                if os.path.exists(filepath):
                    return jsonify({'error': 'A file with this name already exists. Please rename your file.'}), 409
                
                file.save(filepath)
                
                db = get_db()
                try:
                    db.execute(
                        'INSERT INTO videos (title, description, filename, upload_date, user_email, user_name) VALUES (?, ?, ?, ?, ?, ?)',
                        (title, description, filename, datetime.now().isoformat(), session['user_email'], session['user_name'])
                    )
                    db.commit()
                    return jsonify({
                        'message': 'Video uploaded successfully',
                        'filename': filename,
                        'url': f'/uploads/{filename}'
                    }), 201
                except sqlite3.IntegrityError:
                    os.remove(filepath)
                    return jsonify({'error': 'A video with this filename already exists.'}), 409
                except Exception as e:
                    db.rollback()
                    os.remove(filepath)
                    return jsonify({'error': f'Database error: {str(e)}'}), 500
            except Exception as e:
                return jsonify({'error': f'Error saving file: {str(e)}'}), 500

        return jsonify({'error': 'An unexpected error occurred during file upload.'}), 500
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/videos', methods=['GET'])
def get_videos():
    db = get_db()
    # Implement filtering and sorting based on query parameters if needed later
    # For now, just fetch all videos
    videos = db.execute('SELECT * FROM videos').fetchall()
    
    # Convert rows to dictionary for JSON serialization
    videos_list = []
    for video in videos:
        video_dict = dict(video)
        # You might want to generate a URL for the video file here
        # For simplicity, we'll return the filename and frontend can construct the URL
        videos_list.append(video_dict)

    return jsonify(videos_list), 200

# Endpoint to serve video files (optional, can be served by web server)
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Endpoint to delete a video
@app.route('/delete_video/<int:video_id>', methods=['DELETE'])
@login_required
def delete_video(video_id):
    db = get_db()
    try:
        # Get filename before deleting from DB to remove the file
        video = db.execute('SELECT filename, user_email FROM videos WHERE id = ?', (video_id,)).fetchone()
        if video is None:
            return jsonify({'error': 'Video not found'}), 404

        # Check if user owns the video
        if video['user_email'] != session['user_email']:
            return jsonify({'error': 'Unauthorized to delete this video'}), 403

        filename = video['filename']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        db.execute('DELETE FROM videos WHERE id = ?', (video_id,))
        db.commit()

        # Delete the actual video file
        if os.path.exists(filepath):
            os.remove(filepath)

        return jsonify({'message': 'Video deleted successfully'}), 200

    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Error deleting video: {e}'}), 500

# Note: For production, use a production-ready WSGI server like Gunicorn
# gunicorn -w 4 'app:app'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 