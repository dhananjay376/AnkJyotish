const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

// Import auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(uploadsDir, req.body.category || 'general');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Data storage
let contentData = {
    basic: [],
    advanced: []
};

// Load existing data
const dataFile = path.join(__dirname, 'content-data.json');
if (fs.existsSync(dataFile)) {
    contentData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

// Save data to file
function saveData() {
    fs.writeFileSync(dataFile, JSON.stringify(contentData, null, 2));
}

// Routes

// Get all content
app.get('/api/content', (req, res) => {
    res.json(contentData);
});

// Upload content
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        const { title, description, category, type } = req.body;
        
        if (!title || !category || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const contentItem = {
            id: Date.now(),
            title,
            description,
            category: category.toLowerCase(),
            type,
            filename: req.file ? req.file.filename : null,
            originalName: req.file ? req.file.originalname : null,
            uploadDate: new Date().toISOString()
        };

        if (category.toLowerCase() === 'basic') {
            contentData.basic.push(contentItem);
        } else if (category.toLowerCase() === 'advanced') {
            contentData.advanced.push(contentItem);
        }

        saveData();
        res.json({ success: true, message: 'Content uploaded successfully', data: contentItem });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete content
app.delete('/api/content/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    contentData.basic = contentData.basic.filter(item => item.id !== id);
    contentData.advanced = contentData.advanced.filter(item => item.id !== id);
    
    saveData();
    res.json({ success: true, message: 'Content deleted successfully' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
