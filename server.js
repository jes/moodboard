import express from 'express';
import multer from 'multer';
import path from 'path';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 