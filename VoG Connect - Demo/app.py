import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory, current_app, g
from werkzeug.utils import secure_filename
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
# Configure CORS to allow requests from your frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://127.0.0.1:5000", "http://localhost:5000"],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

UPLOAD_FOLDER = 'uploads'
DATABASE = 'videos.db'
MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size
ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'}

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
    pillars TEXT,
    upload_date TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0
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

@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_video():
    if request.method == 'OPTIONS':
        return '', 200
        
    if 'video' not in request.files:
        return jsonify({'error': 'No video file part'}), 400

    file = request.files['video']
    title = request.form.get('title')
    description = request.form.get('description')
    pillars = request.form.getlist('pillars')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not title or not description or not pillars:
        return jsonify({'error': 'Missing form data (title, description, or pillars)'}), 400

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
                    'INSERT INTO videos (title, description, filename, pillars, upload_date) VALUES (?, ?, ?, ?, ?)',
                    (title, description, filename, ','.join(pillars), datetime.now().isoformat())
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
def delete_video(video_id):
    db = get_db()
    try:
        # Get filename before deleting from DB to remove the file
        video = db.execute('SELECT filename FROM videos WHERE id = ?', (video_id,)).fetchone()
        if video is None:
            return jsonify({'error': 'Video not found'}), 404

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
    app.run(debug=True) 