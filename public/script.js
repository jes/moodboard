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

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    });

function dragMoveListener(event) {
    let target = event.target;
    let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    target.style.transform = `translate(${x}px, ${y}px)`;
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
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
    
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    
    // Add delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = '×'; // Using × symbol for delete
    deleteButton.onclick = function() {
        container.remove();
    };
    
    container.appendChild(img);
    container.appendChild(resizeHandle);
    container.appendChild(deleteButton);
    
    document.getElementById('moodboard').appendChild(container);
} 