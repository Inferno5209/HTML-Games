from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os
import shutil
import stat
import time
from pathlib import Path
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'html', 'css', 'js', 'json', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'}

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_project_type(project_path):
    """Determine project type based on files present"""
    files = os.listdir(project_path)
    if 'index.html' in files:
        return 'Web Project'
    elif any(f.endswith('.html') for f in files):
        return 'HTML Files'
    else:
        return 'Files'

@app.route('/')
def index():
    """Serve the home page"""
    return send_file('index.html')

@app.route('/launcher')
def launcher():
    """Serve the launcher page"""
    return send_file('launcher.html')

@app.route('/style.css')
def serve_css():
    """Serve CSS file"""
    return send_file('style.css')

@app.route('/script.js')
def serve_js():
    """Serve JavaScript file"""
    return send_file('script.js')

@app.route('/images/<path:filename>')
def serve_images(filename):
    """Serve images from images folder"""
    return send_from_directory('images', filename)

@app.route('/upload', methods=['POST'])
def upload_files():
    """Handle file/folder uploads"""
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    
    if not files:
        return jsonify({'error': 'No files selected'}), 400
    
    uploaded_files = []
    project_name = None
    
    for file in files:
        if file.filename == '' or file.filename is None:
            continue
            
        # Get the relative path (for folders)
        filename = file.filename
        
        # Extract project name from first folder in path
        parts = filename.split('/') if filename else []
        if len(parts) > 1:
            project_name = secure_filename(parts[0])
            relative_path = '/'.join(parts[1:])
        else:
            # Single file upload - create a project folder based on file name
            project_name = secure_filename(os.path.splitext(parts[0])[0])
            relative_path = parts[0]
        
        # Create full path
        file_path = os.path.join(UPLOAD_FOLDER, project_name, relative_path)
        
        # Create directories if needed
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save file
        file.save(file_path)
        uploaded_files.append(file_path)
    
    return jsonify({
        'message': f'Successfully uploaded {len(uploaded_files)} files',
        'project': project_name,
        'files': uploaded_files
    }), 200

@app.route('/projects', methods=['GET'])
def list_projects():
    """List all uploaded projects"""
    projects = []
    
    if not os.path.exists(UPLOAD_FOLDER):
        return jsonify(projects)
    
    for item in os.listdir(UPLOAD_FOLDER):
        item_path = os.path.join(UPLOAD_FOLDER, item)
        if os.path.isdir(item_path):
            has_index = os.path.exists(os.path.join(item_path, 'index.html'))
            projects.append({
                'name': item,
                'type': get_project_type(item_path),
                'hasIndex': has_index
            })
    
    return jsonify(projects)

@app.route('/project/<project_name>/')
@app.route('/project/<project_name>/<path:filename>')
def serve_project(project_name, filename=None):
    """Serve a project as a website"""
    project_path = os.path.join(UPLOAD_FOLDER, secure_filename(project_name))
    
    if not os.path.exists(project_path):
        return jsonify({'error': 'Project not found'}), 404
    
    # If no filename specified, try to serve index.html
    if filename is None:
        index_path = os.path.join(project_path, 'index.html')
        if os.path.exists(index_path):
            return send_file(index_path)
    else:
        # Serve the requested file
        file_path = os.path.join(project_path, filename)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_file(file_path)
    
    # Otherwise, list files in the project
    files = []
    for root, dirs, filenames in os.walk(project_path):
        for fname in filenames:
            rel_path = os.path.relpath(os.path.join(root, fname), project_path).replace('\\', '/')
            files.append(f'<li><a href="/project/{project_name}/{rel_path}">{rel_path}</a></li>')
    
    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <title>{project_name} - Files</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }}
            .container {{
                background: white;
                color: #333;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }}
            h1 {{
                color: #667eea;
            }}
            ul {{
                list-style: none;
                padding: 0;
            }}
            li {{
                padding: 10px;
                margin: 5px 0;
                background: #f5f5f5;
                border-radius: 5px;
            }}
            a {{
                color: #667eea;
                text-decoration: none;
            }}
            a:hover {{
                text-decoration: underline;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📁 {project_name}</h1>
            <p>Project Files:</p>
            <ul>{''.join(files)}</ul>
        </div>
    </body>
    </html>
    '''
    return html

def handle_remove_readonly(func, path, exc):
    """Error handler for Windows readonly file issues"""
    os.chmod(path, stat.S_IWRITE)
    func(path)

def force_delete_folder(folder_path, max_retries=3):
    """Force delete a folder with retries for Windows file locking issues"""
    for attempt in range(max_retries):
        try:
            # First, make all files writable
            for root, dirs, files in os.walk(folder_path):
                for dir_name in dirs:
                    try:
                        os.chmod(os.path.join(root, dir_name), stat.S_IWRITE)
                    except:
                        pass
                for file_name in files:
                    try:
                        file_path = os.path.join(root, file_name)
                        os.chmod(file_path, stat.S_IWRITE)
                    except:
                        pass
            
            # Now try to delete
            shutil.rmtree(folder_path, onerror=handle_remove_readonly)
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(0.5)  # Wait before retry
                continue
            else:
                raise e
    return False

@app.route('/project/<project_name>', methods=['DELETE'])
def delete_project(project_name):
    """Delete a project"""
    project_path = os.path.join(UPLOAD_FOLDER, secure_filename(project_name))
    
    if not os.path.exists(project_path):
        return jsonify({'error': 'Project not found'}), 404
    
    try:
        force_delete_folder(project_path)
        return jsonify({'message': f'Project {project_name} deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Could not delete project: {str(e)}'}), 500

@app.route('/project/<project_name>/rename', methods=['POST'])
def rename_project(project_name):
    """Rename a project"""
    project_path = os.path.join(UPLOAD_FOLDER, secure_filename(project_name))
    
    if not os.path.exists(project_path):
        return jsonify({'error': 'Project not found'}), 404
    
    data = request.get_json()
    new_name = data.get('newName', '').strip()
    
    if not new_name:
        return jsonify({'error': 'New name is required'}), 400
    
    new_name_safe = secure_filename(new_name)
    new_path = os.path.join(UPLOAD_FOLDER, new_name_safe)
    
    if os.path.exists(new_path):
        return jsonify({'error': 'A project with that name already exists'}), 400
    
    try:
        os.rename(project_path, new_path)
        return jsonify({'message': f'Project renamed to {new_name_safe}', 'newName': new_name_safe}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Solar Galaxy Tech Launcher Server")
    print("=" * 60)
    print(f"📁 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"🌐 Server running on: http://localhost:5000")
    print(f"🎯 Open the launcher at: http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
