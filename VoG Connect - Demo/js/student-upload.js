// DOM Elements
const videoUploadForm = document.getElementById('video-upload-form');
const videoFileInput = document.getElementById('video-file');
const videoPreview = document.getElementById('video-preview');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const uploadProgressModal = document.getElementById('upload-progress-modal');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');
const galleryPillarFilter = document.getElementById('gallery-pillar-filter');
const gallerySort = document.getElementById('gallery-sort');
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

    // Gallery filters
    galleryPillarFilter.addEventListener('change', () => {
        currentPage = 1;
        videoGallery.innerHTML = '';
        loadVideos();
    });

    gallerySort.addEventListener('change', () => {
        currentPage = 1;
        videoGallery.innerHTML = '';
        loadVideos();
    });

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

        // Validate file size (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            alert('File size exceeds 100MB limit. Please choose a smaller file.');
            videoFileInput.value = '';
            resetVideoPreview();
        }
    }
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

    const selectedPillars = Array.from(formData.getAll('pillars'));

    if (selectedPillars.length === 0) {
        alert('Please select at least one pillar');
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
        xhr.open('POST', 'http://127.0.0.1:5000/upload', true);
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
            errorMessage += 'Could not connect to the server. Please make sure the server is running.';
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
        const response = await fetch('http://127.0.0.1:5000/videos'); // Replace with your backend URL if different
        const videos = await response.json();

        if (!response.ok) {
            throw new Error(videos.error || 'Failed to fetch videos');
        }

        if (videos.length === 0) {
            // hasMoreVideos = false; // Removed
            loadMoreBtn.style.display = 'none'; // Hide button if no videos returned
            if (currentPage === 1) { // If it's the first page and no videos, show no results
                showNoVideosMessage();
            }
        } else {
            renderVideos(videos);
            // With the current backend fetching all videos, we hide the button after the first load
            loadMoreBtn.style.display = 'none';
            hideNoVideosMessage(); // Hide no results message if videos are loaded
        }

    } catch (error) {
        console.error('Error loading videos:', error);
        // alert('Error loading videos. Please try again.'); // Avoid excessive alerts
        if (currentPage === 1) { // Show error message if initial load fails
            showErrorMessage('Error loading videos. Please try again.');
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
    // Assuming your backend serves files from /uploads/
    const videoUrl = `http://127.0.0.1:5000/uploads/${video.filename}`; // Replace with your backend URL if different
    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.thumbnail || 'assets/video-placeholder.jpg'}" alt="${video.title}">
            <span class="video-duration">${video.duration || '--:--'}</span>
        </div>
        <div class="video-info">
            <h3>${video.title}</h3>
            <p class="video-description">${video.description || 'No description provided.'}</p>
            <div class="video-meta">
                <span class="pillar-tag">${video.pillars ? video.pillars.split(',').join(', ') : 'No Pillars Tagged'}</span>
                <span class="upload-date">${formatDate(video.upload_date)}</span>
            </div>
            <div class="video-stats">
                <span><i class="fas fa-heart"></i> ${video.likes}</span>
                <span><i class="fas fa-comment"></i> ${video.comments}</span>
                <span><i class="fas fa-bookmark"></i> ${video.bookmarks}</span>
            </div>
            <button class="delete-video-btn" data-video-id="${video.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
    `;

    // Add click event for video playback
    card.addEventListener('click', () => {
        // Implement video playback logic (e.g., open a modal with a video player)
        console.log('Play video:', video.id, videoUrl);
        openVideoPlaybackModal(videoUrl, video);
    });

    // Add click event for delete button
    card.querySelector('.delete-video-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the card click from triggering
        const videoId = e.currentTarget.dataset.videoId;
        if (confirm('Are you sure you want to delete this video?')) {
            deleteVideo(videoId, card);
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
        <span class="pillar-tag">${video.pillars ? video.pillars.split(',').join(', ') : 'No Pillars Tagged'}</span>
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
        const response = await fetch(`http://127.0.0.1:5000/delete_video/${videoId}`, { // Replace with your backend URL if different
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

// Helper function to format date (optional)
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(); // Or format as needed
    } catch (e) {
        return dateString; // Return original string if invalid
    }
}

// Show a message when no videos are found
function showNoVideosMessage() {
    let noVideosMessage = document.querySelector('.no-videos-message');
    if (!noVideosMessage) {
        noVideosMessage = document.createElement('div');
        noVideosMessage.className = 'no-videos-message';
        noVideosMessage.style.textAlign = 'center';
        noVideosMessage.style.padding = '2rem';
        noVideosMessage.style.color = '#6c757d';
        noVideosMessage.innerHTML = '<p>No videos found in the gallery.</p>';
        videoGallery.appendChild(noVideosMessage);
    }
    noVideosMessage.style.display = 'block';
}

// Hide the no videos message
function hideNoVideosMessage() {
    const noVideosMessage = document.querySelector('.no-videos-message');
    if (noVideosMessage) {
        noVideosMessage.style.display = 'none';
    }
}

// Show an error message
function showErrorMessage(message) {
    let errorMessage = document.querySelector('.error-message');
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.padding = '2rem';
        errorMessage.style.color = 'red';
        videoGallery.appendChild(errorMessage);
    }
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Hide the error message
function hideErrorMessage() {
    const errorMessage = document.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Print Handling
window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.video-card').forEach(card => {
        card.style.transform = 'none';
    });
}); 