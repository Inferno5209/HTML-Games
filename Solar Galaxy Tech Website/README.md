# 🚀 Solar Galaxy Tech Launcher

A beautiful web-based file launcher that allows you to upload files and folders, and open them as websites.

## Features

- 📁 Upload individual files or entire folders
- 🌐 Serve uploaded projects as websites
- 🎨 Beautiful gradient UI with modern design
- 🗑️ Delete projects with one click
- 📦 Automatically detects project types (HTML, Web Projects, Files)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the Python server:
```bash
python server.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Use the interface to:
   - Click "Upload Files" to upload individual files
   - Click "Upload Folder" to upload entire folders
   - Click on any uploaded project to open it in a new tab
   - Click the × button to delete a project

## How It Works

- **Frontend**: HTML, CSS, and JavaScript provide a modern, responsive interface
- **Backend**: Python Flask server handles file uploads and serves projects
- **Storage**: All uploads are stored in the `uploads/` folder
- **Serving**: Projects with `index.html` are served as websites, others show a file listing

## Project Structure

```
Solar Galaxy Tech Website/
├── index.html          # Main launcher interface
├── style.css           # Styling for the launcher
├── script.js           # Client-side JavaScript
├── server.py           # Python Flask server
├── requirements.txt    # Python dependencies
├── uploads/            # Uploaded projects folder
└── README.md           # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python 3, Flask, Flask-CORS
- **Design**: Gradient backgrounds, modern UI/UX, responsive layout

## Security Note

This launcher is designed for local development use. For production deployment, add proper authentication and security measures.

## License

Free to use for educational and personal projects.
