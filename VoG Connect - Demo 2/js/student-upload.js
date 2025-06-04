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

// State
let currentPage = 1;
let isLoading = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadVideos();
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

        // Validate file size (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            alert('File size exceeds 100MB limit. Please choose a smaller file.');
            videoFileInput.value = '';
            resetVideoPreview();
        }
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

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
        alert('File size exceeds 100MB limit. Please choose a smaller file.');
        return;
    }

    // Show upload progress modal
    uploadProgressModal.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';

    try {
        // Create XMLHttpRequest for better upload progress tracking
        const xhr = new XMLHttpRequest();
        
        // Set up progress tracking
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressFill.style.width = percentComplete + '%';
                progressText.textContent = Math.round(percentComplete) + '%';
            }
        };

        // Create a promise to handle the XHR request
        const uploadPromise = new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(xhr.responseText || 'Upload failed'));
                }
            };
            xhr.onerror = () => {
                reject(new Error('Network error - Please check if the server is running'));
            };
            xhr.ontimeout = () => {
                reject(new Error('Request timed out - Please try again'));
            };
        });

        // Open and send the request
        xhr.open('POST', 'http://localhost:5000/upload', true);
        xhr.timeout = 30000; // Set timeout to 30 seconds
        xhr.send(formData);

        // Wait for the upload to complete
        const result = await uploadPromise;

        // Reset form and preview
        videoUploadForm.reset();
        resetVideoPreview();

        // Show success message
        alert(result.message || 'Video uploaded successfully!');

        // Reload videos to show the new upload
        currentPage = 1;
        videoGallery.innerHTML = '';
        loadVideos();

    } catch (error) {
        console.error('Upload error:', error);
        let errorMessage = 'Error uploading video: ';
        
        if (error.message.includes('Network error')) {
            errorMessage += 'Could not connect to the server. Please make sure the server is running at http://localhost:5000';
        } else if (error.message.includes('timed out')) {
            errorMessage += 'The upload took too long. Please try again.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        // Hide upload progress modal
        uploadProgressModal.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
    }
}

// Load Videos
async function loadVideos() {
    if (isLoading) return; // Prevent multiple simultaneous loads

    isLoading = true;
    loadMoreBtn.querySelector('i').style.display = 'inline-block';
    loadMoreBtn.disabled = true; // Disable button while loading

    try {
        // Fetch videos from the backend
        const response = await fetch('http://localhost:5000/videos');
        const videos = await response.json();

        if (!response.ok) {
            throw new Error(videos.error || 'Failed to fetch videos');
        }

        if (videos.length === 0) {
            loadMoreBtn.style.display = 'none'; // Hide button if no videos returned
            if (currentPage === 1) { // If it's the first page and no videos, show no results
                showNoVideosMessage();
            }
        } else {
            renderVideos(videos);
            loadMoreBtn.style.display = 'none';
            hideNoVideosMessage(); // Hide no results message if videos are loaded
        }

    } catch (error) {
        console.error('Error loading videos:', error);
        if (currentPage === 1) { // Show error message if initial load fails
            showErrorMessage('Error loading videos. Please make sure the server is running at http://localhost:5000');
        }
    } finally {
        isLoading = false;
        loadMoreBtn.querySelector('i').style.display = 'none';
        loadMoreBtn.disabled = false; // Re-enable button (though it will be hidden)
    }
}

// Render Videos
function renderVideos(videos) {
    // Clear existing videos only if it's the first page
    if (currentPage === 1) {
        videoGallery.innerHTML = '';
    }

    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        videoGallery.appendChild(videoCard);

        // Animate new cards
        gsap.from(videoCard, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            ease: 'power2.out'
        });
    });
}

// Create Video Card
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    const videoUrl = `http://localhost:5000/uploads/${video.filename}`;
    
    // Create a video element to get the thumbnail
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.crossOrigin = 'anonymous';
    
    // Get video duration and thumbnail
    videoElement.onloadedmetadata = () => {
        const duration = formatDuration(videoElement.duration);
        videoElement.currentTime = 1; // Seek to 1 second to get a good thumbnail
    };
    
    videoElement.onseeked = () => {
        // Create a canvas to capture the thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Update the card with the thumbnail and duration
        const thumbnail = card.querySelector('.video-thumbnail img');
        const durationSpan = card.querySelector('.video-duration');
        
        if (thumbnail) {
            thumbnail.src = canvas.toDataURL();
        }
        if (durationSpan) {
            durationSpan.textContent = formatDuration(videoElement.duration);
        }
    };

    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="assets/video-placeholder.jpg" alt="${video.title}">
            <span class="video-duration">--:--</span>
        </div>
        <div class="video-info">
            <h3>${video.title}</h3>
            <p class="video-description">${video.description || 'No description provided.'}</p>
            <div class="video-meta">
                <span class="upload-date">${formatDate(video.upload_date)}</span>
            </div>
            <button class="delete-video-btn" data-video-id="${video.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
    `;

    // Add click event for video playback
    card.addEventListener('click', (e) => {
        // Don't trigger playback if clicking the delete button
        if (!e.target.closest('.delete-video-btn')) {
            openVideoPlaybackModal(videoUrl, video);
        }
    });

    // Add delete button event listener
    const deleteBtn = card.querySelector('.delete-video-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent video playback when clicking delete
        if (confirm('Are you sure you want to delete this video?')) {
            deleteVideo(video.id, card);
        }
    });

    return card;
}

// Open the video playback modal
function openVideoPlaybackModal(videoUrl, video) {
    const playbackVideo = document.getElementById('playback-video');
    const playbackVideoTitle = document.getElementById('playback-video-title');
    const playbackVideoDescription = document.getElementById('playback-video-description');
    const playbackVideoMeta = document.getElementById('playback-video-meta');
    const videoPlaybackModal = document.getElementById('video-playback-modal');

    playbackVideo.src = videoUrl;
    playbackVideoTitle.textContent = video.title;
    playbackVideoDescription.textContent = video.description || 'No description provided.';
    playbackVideoMeta.innerHTML = `
        <span class="upload-date">Uploaded on: ${formatDate(video.upload_date)}</span>
    `;

    videoPlaybackModal.style.display = 'block';

    // Close modal when close button is clicked
    videoPlaybackModal.querySelector('.close-modal').addEventListener('click', () => {
        closeVideoPlaybackModal();
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === videoPlaybackModal) {
            closeVideoPlaybackModal();
        }
    });
}

// Close the video playback modal
function closeVideoPlaybackModal() {
    const playbackVideo = document.getElementById('playback-video');
    const videoPlaybackModal = document.getElementById('video-playback-modal');

    playbackVideo.pause(); // Pause the video
    playbackVideo.src = ''; // Clear the video source
    videoPlaybackModal.style.display = 'none';
}

// Delete Video function
async function deleteVideo(videoId, cardElement) {
    try {
        const response = await fetch(`http://localhost:5000/delete_video/${videoId}`, { // Replace with your backend URL if different
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete video');
        }

        // Remove the video card from the gallery on successful deletion
        cardElement.remove();

        // Check if gallery is empty after deletion
        if (videoGallery.children.length === 0) {
            showNoVideosMessage();
        }

        alert('Video deleted successfully!');

    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting video: ' + error.message);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Show no videos message
function showNoVideosMessage() {
    const message = document.createElement('div');
    message.className = 'no-videos-message';
    message.innerHTML = `
        <i class="fas fa-video-slash"></i>
        <p>No videos uploaded yet. Be the first to share your vision!</p>
    `;
    videoGallery.appendChild(message);
}

// Hide no videos message
function hideNoVideosMessage() {
    const message = videoGallery.querySelector('.no-videos-message');
    if (message) {
        message.remove();
    }
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
    `;
    videoGallery.appendChild(errorDiv);
}

// Hide error message
function hideErrorMessage() {
    const errorDiv = videoGallery.querySelector('.error-message');
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