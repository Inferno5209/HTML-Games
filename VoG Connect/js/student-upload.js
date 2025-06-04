// DOM Elements
const videoUploadForm = document.getElementById('video-upload-form');
const videoFileInput = document.getElementById('video-file');
const videoPreview = document.getElementById('video-preview');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const uploadProgressModal = document.getElementById('upload-progress-modal');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');
const videoGallery = document.querySelector('.video-gallery');
const loadMoreBtn = document.querySelector('.load-more-btn');

// IndexedDB setup
const dbName = 'VideoStorageDB';
const dbVersion = 1;
let db;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('videos')) {
                db.createObjectStore('videos', { keyPath: 'id' });
            }
        };
    });
}

// State
let currentPage = 1;
let isLoading = false;
let videos = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    await loadVideos();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Video file input change
    videoFileInput.addEventListener('change', handleVideoFileSelect);

    // Form submission
    videoUploadForm.addEventListener('submit', handleVideoUpload);

    // Load more button
    loadMoreBtn.addEventListener('click', () => {
        if (!isLoading) {
            currentPage++;
            loadVideos();
        }
    });
}

// Handle Video File Selection
function handleVideoFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Update file input label
        const label = document.querySelector('.file-upload-label span');
        label.textContent = file.name;

        // Show video preview
        const videoURL = URL.createObjectURL(file);
        videoPreview.src = videoURL;
        videoPreview.style.display = 'block';
        previewPlaceholder.style.display = 'none';

        // Get video duration when metadata is loaded
        videoPreview.onloadedmetadata = () => {
            const duration = formatDuration(videoPreview.duration);
            videoPreview.dataset.duration = duration;
        };
    }
}

// Format duration in MM:SS format
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Reset Video Preview
function resetVideoPreview() {
    videoPreview.src = '';
    videoPreview.style.display = 'none';
    previewPlaceholder.style.display = 'flex';
    const label = document.querySelector('.file-upload-label span');
    label.textContent = 'Choose a video file';
}

// Handle Video Upload
async function handleVideoUpload(event) {
    event.preventDefault();

    const formData = new FormData(videoUploadForm);
    const file = videoFileInput.files[0];

    if (!file) {
        alert('Please select a video file');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file');
        return;
    }

    // Show upload progress modal
    uploadProgressModal.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';

    try {
        // Create video metadata
        const videoId = Date.now().toString();
        const video = {
            id: videoId,
            title: formData.get('title'),
            description: formData.get('description'),
            uploadDate: new Date().toISOString(),
            duration: videoPreview.dataset.duration || '00:00',
            size: file.size,
            type: file.type
        };

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        video.data = arrayBuffer;

        // Store video in IndexedDB
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        await store.add(video);

        // Update progress
        progressFill.style.width = '100%';
        progressText.textContent = '100%';

        // Reset form and preview
        videoUploadForm.reset();
        resetVideoPreview();

        // Show success message
        alert('Video uploaded successfully!');

        // Reload videos to show the new upload
        currentPage = 1;
        videoGallery.innerHTML = '';
        await loadVideos();

    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading video: ' + error.message);
    } finally {
        // Hide upload progress modal
        uploadProgressModal.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
    }
}

// Load Videos
async function loadVideos() {
    if (isLoading) return;

    isLoading = true;
    loadMoreBtn.querySelector('i').style.display = 'inline-block';
    loadMoreBtn.disabled = true;

    try {
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        const request = store.getAll();

        request.onsuccess = async () => {
            videos = request.result;
            const startIndex = (currentPage - 1) * 6;
            const endIndex = startIndex + 6;
            const pageVideos = videos.slice(startIndex, endIndex);

            if (pageVideos.length === 0) {
                loadMoreBtn.style.display = 'none';
                if (currentPage === 1) {
                    showNoVideosMessage();
                }
            } else {
                await renderVideos(pageVideos);
                loadMoreBtn.style.display = videos.length > endIndex ? 'block' : 'none';
                hideNoVideosMessage();
            }
        };

        request.onerror = () => {
            throw new Error('Failed to load videos');
        };

    } catch (error) {
        console.error('Error loading videos:', error);
        if (currentPage === 1) {
            showErrorMessage('Error loading videos');
        }
    } finally {
        isLoading = false;
        loadMoreBtn.querySelector('i').style.display = 'none';
        loadMoreBtn.disabled = false;
    }
}

// Render Videos
async function renderVideos(videos) {
    if (currentPage === 1) {
        videoGallery.innerHTML = '';
    }

    for (const video of videos) {
        const videoCard = await createVideoCard(video);
        videoGallery.appendChild(videoCard);

        gsap.from(videoCard, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            ease: 'power2.out'
        });
    }
}

// Create Video Card
async function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';

    // Create blob URL from video data
    const blob = new Blob([video.data], { type: video.type });
    const videoUrl = URL.createObjectURL(blob);

    // Create thumbnail
    const thumbnail = await createThumbnail(videoUrl);

    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${thumbnail}" alt="${video.title}" class="thumbnail-image">
            <span class="video-duration">${video.duration}</span>
        </div>
        <div class="video-info">
            <h3>${video.title}</h3>
            <p>${video.description}</p>
            <div class="video-meta">
                <span class="upload-date">${formatDate(video.uploadDate)}</span>
            </div>
        </div>
        <div class="video-actions">
            <div class="left-actions">
                <button onclick="openVideoPlaybackModal('${video.id}')" class="play-btn">
                    <i class="fas fa-play"></i> Play
                </button>
            </div>
            <div class="right-actions">
                <button onclick="deleteVideo('${video.id}', this.closest('.video-card'))" class="delete-btn">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    return card;
}

// Create thumbnail from video
function createThumbnail(videoUrl) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.preload = 'metadata';
        
        video.onloadeddata = () => {
            // Set video to first frame
            video.currentTime = 0;
        };

        video.onseeked = () => {
            // Create canvas for thumbnail
            const canvas = document.createElement('canvas');
            canvas.width = 320; // Fixed width for thumbnails
            canvas.height = 180; // 16:9 aspect ratio
            
            // Draw video frame to canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64
            const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
            resolve(thumbnail);
            
            // Cleanup
            video.src = '';
            URL.revokeObjectURL(videoUrl);
        };
    });
}

// Add CSS for thumbnail sizing and buttons
const style = document.createElement('style');
style.textContent = `
    .video-thumbnail {
        position: relative;
        width: 100%;
        height: 180px;
        overflow: hidden;
        background: #000;
        border-radius: 8px;
    }

    .thumbnail-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .video-thumbnail:hover .thumbnail-image {
        transform: scale(1.05);
    }

    .video-duration {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 2;
    }

    .video-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }

    .video-card:hover {
        transform: translateY(-2px);
    }

    .video-info {
        padding: 16px;
    }

    .video-info h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: #333;
    }

    .video-info p {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #666;
    }

    .video-meta {
        font-size: 12px;
        color: #888;
    }

    .video-actions {
        padding: 8px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #eee;
    }

    .left-actions, .right-actions {
        display: flex;
        gap: 8px;
    }

    .play-btn, .delete-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
    }

    .play-btn {
        background: #4CAF50;
        color: white;
    }

    .play-btn:hover {
        background: #45a049;
    }

    .delete-btn {
        background: #ff4444;
        color: white;
    }

    .delete-btn:hover {
        background: #ff0000;
    }

    .play-btn i, .delete-btn i {
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// Delete Video
async function deleteVideo(videoId, cardElement) {
    if (confirm('Are you sure you want to delete this video?')) {
        try {
            const transaction = db.transaction(['videos'], 'readwrite');
            const store = transaction.objectStore('videos');
            await store.delete(videoId);

            // Remove from videos array
            videos = videos.filter(v => v.id !== videoId);

            // Remove card with animation
            gsap.to(cardElement, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                onComplete: () => cardElement.remove()
            });

            // Reload videos if needed
            if (videos.length === 0) {
                showNoVideosMessage();
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('Error deleting video');
        }
    }
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Show No Videos Message
function showNoVideosMessage() {
    const message = document.createElement('div');
    message.className = 'no-videos-message';
    message.innerHTML = `
        <i class="fas fa-video-slash"></i>
        <p>No videos uploaded yet</p>
    `;
    videoGallery.appendChild(message);
}

// Hide No Videos Message
function hideNoVideosMessage() {
    const message = document.querySelector('.no-videos-message');
    if (message) {
        message.remove();
    }
}

// Show Error Message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
    `;
    videoGallery.appendChild(errorDiv);
}

// Hide Error Message
function hideErrorMessage() {
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Print Handling
window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.video-card').forEach(card => {
        card.style.transform = 'none';
    });
});

// Add back the video playback modal functionality
function openVideoPlaybackModal(videoId) {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <video id="playback-video" controls autoplay>
                <source src="${URL.createObjectURL(new Blob([video.data], { type: video.type }))}" type="${video.type}">
            </video>
            <div class="modal-info">
                <h2>${video.title}</h2>
                <p>${video.description}</p>
                <div class="modal-meta">
                    <span>Uploaded on ${formatDate(video.uploadDate)}</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add modal styles
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .video-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .modal-content {
            position: relative;
            width: 90%;
            max-width: 1000px;
            background: white;
            border-radius: 12px;
            overflow: hidden;
        }

        .close-modal {
            position: absolute;
            top: 10px;
            right: 10px;
            color: white;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1001;
            background: rgba(0, 0, 0, 0.5);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-content video {
            width: 100%;
            max-height: 70vh;
            background: black;
        }

        .modal-info {
            padding: 20px;
        }

        .modal-info h2 {
            margin: 0 0 10px 0;
            color: #333;
        }

        .modal-info p {
            margin: 0 0 10px 0;
            color: #666;
        }

        .modal-meta {
            font-size: 14px;
            color: #888;
        }
    `;
    document.head.appendChild(modalStyle);

    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        const video = modal.querySelector('video');
        video.pause();
        video.src = '';
        modal.remove();
    };

    // Close on click outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            const video = modal.querySelector('video');
            video.pause();
            video.src = '';
            modal.remove();
        }
    };
} 