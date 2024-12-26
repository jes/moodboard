import express from 'express';
import multer from 'multer';
import path from 'path';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Add this helper function to check if moodboard exists
async function moodboardExists(id) {
    try {
        await fs.access(path.join(dataDir, `${id}.json`));
        return true;
    } catch {
        return false;
    }
}

// Add this route before the static middleware
app.get('/:id', async (req, res, next) => {
    const id = req.params.id;
    
    // Check if this ID exists as a moodboard
    if (await moodboardExists(id)) {
        // Serve the index.html file
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        // If it's not a moodboard ID, continue to static file handling
        next();
    }
});

// Keep the static middleware after the route
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
fs.mkdir(dataDir).catch(() => {});

// Generate new moodboard ID
app.post('/api/create-moodboard', async (req, res) => {
    const id = crypto.randomBytes(5).toString('hex');
    const moodboardData = {
        id,
        images: []
    };
    
    await fs.writeFile(
        path.join(dataDir, `${id}.json`),
        JSON.stringify(moodboardData)
    );
    
    res.json({ id });
});

// Get moodboard data
app.get('/api/moodboard/:id', async (req, res) => {
    try {
        const data = await fs.readFile(
            path.join(dataDir, `${req.params.id}.json`),
            'utf-8'
        );
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(404).json({ error: 'Moodboard not found' });
    }
});

// Update moodboard state
app.post('/api/moodboard/:id/update', async (req, res) => {
    try {
        await fs.writeFile(
            path.join(dataDir, `${req.params.id}.json`),
            JSON.stringify(req.body)
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update moodboard' });
    }
});

// Handle URL-based image uploads
app.post('/api/upload-url', async (req, res) => {
    try {
        const { url } = req.body;
        const response = await fetch(url);
        const buffer = await response.buffer();
        
        const filename = `image-${Date.now()}${path.extname(url)}`;
        await fs.writeFile(`uploads/${filename}`, buffer);
        
        res.json({
            success: true,
            imageUrl: `/uploads/${filename}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to download and save image'
        });
    }
});

// Handle file uploads
app.post('/api/upload-file', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded'
        });
    }

    res.json({
        success: true,
        imageUrl: `/uploads/${req.file.filename}`
    });
});

const PORT = process.env.PORT || 10303;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 