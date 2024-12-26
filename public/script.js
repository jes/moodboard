let moodboardId = null;
let moodboardState = {
    images: []
};
let syncStateTimeout = null;

// Initialize interact.js for dragging and resizing
interact('.image-container')
    .draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
            })
        ],
        listeners: {
            move: dragMoveListener,
        }
    })
    .resizable({
        edges: { right: true, bottom: true, left: true, top: true },
        restrictEdges: {
            outer: 'parent',
            endOnly: true,
        },
        restrictSize: {
            min: { width: 100, height: 100 },
        },
        inertia: true,
    })
    .on('resizemove', function (event) {
        let target = event.target;
        let x = (parseFloat(target.getAttribute('data-x')) || 0);
        let y = (parseFloat(target.getAttribute('data-y')) || 0);

        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';

        x += event.deltaRect.left;
        y += event.deltaRect.top;

        updateImagePosition(target, x, y);

        // Update size in state using data-original-url
        const originalUrl = target.querySelector('img').getAttribute('data-original-url');
        const image = moodboardState.images.find(img => img.url === originalUrl);
        if (image) {
            image.size = {
                width: event.rect.width,
                height: event.rect.height
            };
            syncState();
        } else {
            console.error('Image not found in moodboard state:', originalUrl);
        }
    });

function updateImagePosition(target, x, y) {
    target.style.transform = `translate(${x}px, ${y}px)`;
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);

    // Update state using data-original-url
    const originalUrl = target.querySelector('img').getAttribute('data-original-url');
    const image = moodboardState.images.find(img => img.url === originalUrl);
    if (image) {
        image.position = { x, y };
        syncState();
    }
}

function dragMoveListener(event) {
    let target = event.target;
    let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    updateImagePosition(target, x, y);
}

async function addImageFromUrl() {
    const urlInput = document.getElementById('imageUrl');
    const url = urlInput.value.trim();
    
    if (!url) return;

    try {
        const response = await fetch('/api/upload-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();
        if (data.success) {
            addImageToBoard(data.imageUrl);
            urlInput.value = '';
        }
    } catch (error) {
        console.error('Error uploading image:', error);
    }
}

async function addImageFromFile() {
    const fileInput = document.getElementById('imageFile');
    const file = fileInput.files[0];
    
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            addImageToBoard(data.imageUrl);
            fileInput.value = '';
        }
    } catch (error) {
        console.error('Error uploading image:', error);
    }
}

function addImageToBoard(imageUrl) {
    const container = document.createElement('div');
    container.className = 'image-container';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.setAttribute('data-original-url', imageUrl);
    
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = '×';
    deleteButton.onclick = function() {
        const originalUrl = img.getAttribute('data-original-url');
        const index = moodboardState.images.findIndex(img => img.url === originalUrl);
        if (index !== -1) {
            moodboardState.images.splice(index, 1);
            syncState();
        }
        container.remove();
    };
    
    container.appendChild(img);
    container.appendChild(resizeHandle);
    container.appendChild(deleteButton);
    
    document.getElementById('moodboard').appendChild(container);
    
    // Add to state
    moodboardState.images.push({
        url: imageUrl,
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 }
    });
    syncState();
}

// Initialize moodboard
async function initMoodboard() {
    const pathId = window.location.pathname.slice(1);
    
    if (pathId) {
        // Load existing moodboard
        try {
            const response = await fetch(`/api/moodboard/${pathId}`);
            if (response.ok) {
                const data = await response.json();
                moodboardId = pathId;
                moodboardState = data;
                renderMoodboard();
            } else {
                alert('Moodboard not found');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error loading moodboard:', error);
        }
    } else {
        // Create new moodboard
        try {
            const response = await fetch('/api/create-moodboard', {
                method: 'POST'
            });
            const data = await response.json();
            moodboardId = data.id;
            window.history.pushState({}, '', `/${moodboardId}`);
        } catch (error) {
            console.error('Error creating moodboard:', error);
        }
    }
}

// Sync state with server
async function syncState() {
    // Clear any existing timeout
    if (syncStateTimeout) {
        clearTimeout(syncStateTimeout);
    }

    // Set a new timeout
    syncStateTimeout = setTimeout(async () => {
        console.log('Syncing state:', moodboardId, moodboardState);
        if (!moodboardId) return;
        
        try {
            await fetch(`/api/moodboard/${moodboardId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(moodboardState)
            });
        } catch (error) {
            console.error('Error syncing state:', error);
        }
    }, 1000); // 1 second delay
}

function renderMoodboard() {
    // Clear existing board
    const board = document.getElementById('moodboard');
    board.innerHTML = '';
    
    // Render each image
    moodboardState.images.forEach(image => {
        const container = document.createElement('div');
        container.className = 'image-container';
        
        const img = document.createElement('img');
        img.src = image.url;
        img.setAttribute('data-original-url', image.url);
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '×';
        deleteButton.onclick = function() {
            const index = moodboardState.images.findIndex(img => img.url === image.url);
            if (index !== -1) {
                moodboardState.images.splice(index, 1);
                syncState();
            }
            container.remove();
        };
        
        container.appendChild(img);
        container.appendChild(resizeHandle);
        container.appendChild(deleteButton);
        
        // Apply stored position and size
        if (image.position) {
            container.style.transform = `translate(${image.position.x}px, ${image.position.y}px)`;
            container.setAttribute('data-x', image.position.x);
            container.setAttribute('data-y', image.position.y);
        }
        if (image.size) {
            container.style.width = `${image.size.width}px`;
            container.style.height = `${image.size.height}px`;
        }
        
        board.appendChild(container);
    });
}

// Add this to your window.onload or DOMContentLoaded event
document.addEventListener('DOMContentLoaded', initMoodboard); 