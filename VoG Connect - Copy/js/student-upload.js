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
const authRequiredMessage = document.getElementById('auth-required-message');
const loginSection = document.getElementById('login-section');
const userSection = document.getElementById('user-section');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

// State
let currentPage = 1;
let isLoading = false;
let videos = [];
let isAuthenticated = false;
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
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

    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
}

// Authentication Functions
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status', {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
            isAuthenticated = true;
            currentUser = data.user;
            updateAuthUI();
        } else {
            isAuthenticated = false;
            currentUser = null;
            updateAuthUI();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        isAuthenticated = false;
        updateAuthUI();
    }
}

function updateAuthUI() {
    if (isAuthenticated && currentUser) {
        // Show user section
        loginSection.style.display = 'none';
        userSection.style.display = 'flex';
        userName.textContent = currentUser.name;
        
        // Show upload form
        authRequiredMessage.style.display = 'none';
        videoUploadForm.style.display = 'block';
    } else {
        // Show login section
        loginSection.style.display = 'flex';
        userSection.style.display = 'none';
        
        // Show auth required message
        authRequiredMessage.style.display = 'block';
        videoUploadForm.style.display = 'none';
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            isAuthenticated = false;
            currentUser = null;
            updateAuthUI();
            
            // Reset form
            videoUploadForm.reset();
            resetVideoPreview();
            
            // Reload videos
            currentPage = 1;
            videoGallery.innerHTML = '';
            await loadVideos();
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Google OAuth callback function (called by Google Sign-In)
async function handleCredentialResponse(response) {
    try {
        const authResponse = await fetch('/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                id_token: response.credential
            })
        });
        
        const data = await authResponse.json();
        
        if (data.success) {
            isAuthenticated = true;
            currentUser = data.user;
            updateAuthUI();
            
            // Reload videos
            currentPage = 1;
            videoGallery.innerHTML = '';
            await loadVideos();
        } else {
            console.error('Authentication failed:', data.error);
            alert('Authentication failed. Please try again.');
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        alert('Authentication error. Please try again.');
    }
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

    if (!isAuthenticated) {
        alert('Please sign in to upload videos');
        return;
    }

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
        // Create FormData for upload
        const uploadFormData = new FormData();
        uploadFormData.append('video', file);
        uploadFormData.append('title', formData.get('title'));
        uploadFormData.append('description', formData.get('description'));

        // Upload to server
        const response = await fetch('/upload', {
            method: 'POST',
            credentials: 'include',
            body: uploadFormData
        });

        const result = await response.json();

        if (response.ok) {
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
        } else {
            throw new Error(result.error || 'Upload failed');
        }

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

// Load Videos from Server
async function loadVideos() {
    if (isLoading) return;

    isLoading = true;
    loadMoreBtn.querySelector('i').style.display = 'inline-block';
    loadMoreBtn.disabled = true;

    try {
        const response = await fetch('/videos', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const serverVideos = await response.json();
            videos = serverVideos;
            
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
        } else {
            throw new Error('Failed to load videos');
        }

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

    // Create video URL
    const videoUrl = `/uploads/${video.filename}`;

    // Create thumbnail (using a placeholder for now)
    const thumbnail = await createThumbnail(videoUrl);

    // Check if current user can delete this video
    const canDelete = isAuthenticated && currentUser && video.user_email === currentUser.email;

    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${thumbnail}" alt="${video.title}" class="thumbnail-image">
            <span class="video-duration">00:00</span>
        </div>
        <div class="video-info">
            <h3>${video.title}</h3>
            <p>${video.description}</p>
            <div class="video-meta">
                <span class="upload-date">${formatDate(video.upload_date)}</span>
                ${video.user_name ? `<span class="uploader">by ${video.user_name}</span>` : ''}
            </div>
        </div>
        <div class="video-actions">
            <div class="left-actions">
                <button onclick="openVideoPlaybackModal('${video.id}', '${videoUrl}', '${video.title}', '${video.description}')" class="play-btn">
                    <i class="fas fa-play"></i> Play
                </button>
            </div>
            <div class="right-actions">
                ${canDelete ? `
                    <button onclick="deleteVideo('${video.id}', this.closest('.video-card'))" class="delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : ''}
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
        video.crossOrigin = 'anonymous';
        
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
        };

        video.onerror = () => {
            // Fallback to a placeholder image
            resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNjAgOTBDMTQzLjQzMSA5MCAxMzAgMTAzLjQzMSAxMzAgMTIwQzEzMCAxMzYuNTY5IDE0My40MzEgMTUwIDE2MCAxNTBDMTc2LjU2OSAxNTAgMTkwIDEzNi41NjkgMTkwIDEyMEMxOTAgMTAzLjQzMSAxNzYuNTY5IDkwIDE2MCA5MFoiIGZpbGw9IiM5Q0E2RkYiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDEyVjI4TDI4IDIwTDE2IDEyWiIgZmlsbD0iIzlDQTZGRiIvPgo8L3N2Zz4KPC9zdmc+');
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
    if (!isAuthenticated) {
        alert('Please sign in to delete videos');
        return;
    }

    if (confirm('Are you sure you want to delete this video?')) {
        try {
            const response = await fetch(`/delete_video/${videoId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                // Remove from videos array
                videos = videos.filter(v => v.id !== parseInt(videoId));

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
            } else {
                const error = await response.json();
                alert('Error deleting video: ' + (error.error || 'Unknown error'));
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

// Video Playback Modal
function openVideoPlaybackModal(videoId, videoUrl, title, description) {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <video id="playback-video" controls autoplay>
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="modal-info">
                <h2>${title}</h2>
                <p>${description}</p>
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