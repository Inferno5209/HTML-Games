// API endpoint
const API_URL = 'http://localhost:5000';

// Store current project being renamed
let currentRenamingProject = null;

// Load projects on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only run launcher functionality if the required elements exist
    const fileInput = document.getElementById('fileInput');
    const singleFileInput = document.getElementById('singleFileInput');
    const projectsList = document.getElementById('projectsList');
    
    // Check if we're on the launcher page
    if (projectsList) {
        loadProjects();
    }
    
    // Only attach event listeners if elements exist
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                await uploadFiles(files, true);
            }
            e.target.value = ''; // Reset input
        });
    }
    
    if (singleFileInput) {
        singleFileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                await uploadFiles(files, false);
            }
            e.target.value = ''; // Reset input
        });
    }
});

// Upload files function
async function uploadFiles(files, isFolder) {
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.className = 'upload-status uploading';
    statusDiv.textContent = `Uploading ${files.length} file(s)...`;

    const formData = new FormData();
    
    files.forEach(file => {
        // Preserve folder structure
        const path = file.webkitRelativePath || file.name;
        formData.append('files', file, path);
    });

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            statusDiv.className = 'upload-status success';
            statusDiv.textContent = `✓ Successfully uploaded ${files.length} file(s)!`;
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
            loadProjects();
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        statusDiv.className = 'upload-status error';
        statusDiv.textContent = `✗ Error: ${error.message}`;
    }
}

// Load and display projects
async function loadProjects() {
    const projectsList = document.getElementById('projectsList');
    
    // If element doesn't exist (not on launcher page), return early
    if (!projectsList) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/projects`);
        const projects = await response.json();

        if (projects.length === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <p>No projects uploaded yet. Upload a folder to get started!</p>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-preview">
                    ${project.hasIndex ? 
                        `<iframe src="${API_URL}/project/${encodeURIComponent(project.name)}/" sandbox="allow-same-origin"></iframe>` :
                        `<div class="project-preview-placeholder">🌐</div>`
                    }
                </div>
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-type">${project.type}</div>
                    <div class="project-actions">
                        <button class="action-btn action-btn-open" onclick="openProject('${project.name}')">
                            🚀 Open
                        </button>
                        <button class="action-btn action-btn-rename" onclick="showRenameModal('${project.name}')">
                            ✏️ Rename
                        </button>
                        <button class="action-btn action-btn-delete" onclick="deleteProject('${project.name}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading projects:', error);
        const projectsList = document.getElementById('projectsList');
        if (projectsList) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <p style="color: #f5576c;">Error loading projects. Make sure the server is running!</p>
                </div>
            `;
        }
    }
}

// Open project in new tab
function openProject(projectName) {
    window.open(`${API_URL}/project/${encodeURIComponent(projectName)}`, '_blank');
}

// Delete project
async function deleteProject(projectName) {
    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/project/${encodeURIComponent(projectName)}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const statusDiv = document.getElementById('uploadStatus');
            statusDiv.className = 'upload-status success';
            statusDiv.textContent = `✓ Project "${projectName}" deleted successfully!`;
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
            loadProjects();
        } else {
            const result = await response.json();
            alert(`Error deleting project: ${result.error}`);
        }
    } catch (error) {
        alert(`Error deleting project: ${error.message}`);
    }
}

// Show rename modal
function showRenameModal(projectName) {
    currentRenamingProject = projectName;
    const modal = document.getElementById('renameModal');
    const input = document.getElementById('renameInput');
    input.value = projectName;
    modal.classList.add('active');
    input.focus();
    input.select();
}

// Close rename modal
function closeRenameModal() {
    const modal = document.getElementById('renameModal');
    modal.classList.remove('active');
    currentRenamingProject = null;
}

// Confirm rename
async function confirmRename() {
    const newName = document.getElementById('renameInput').value.trim();
    
    if (!newName) {
        alert('Please enter a valid name');
        return;
    }
    
    if (newName === currentRenamingProject) {
        closeRenameModal();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/project/${encodeURIComponent(currentRenamingProject)}/rename`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newName: newName })
        });

        const result = await response.json();

        if (response.ok) {
            const statusDiv = document.getElementById('uploadStatus');
            statusDiv.className = 'upload-status success';
            statusDiv.textContent = `✓ Project renamed to "${newName}"!`;
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
            closeRenameModal();
            loadProjects();
        } else {
            alert(`Error renaming project: ${result.error}`);
        }
    } catch (error) {
        alert(`Error renaming project: ${error.message}`);
    }
}

// Allow Enter key to confirm rename
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('renameInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmRename();
            }
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('renameModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRenameModal();
            }
        });
    }
});
