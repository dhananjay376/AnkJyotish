require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth');
const { authenticateToken, requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

// Protected routes for admin pages
app.get('/admin.html', authenticateToken, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/course-upload.html', authenticateToken, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'course-upload.html'));
});

// Serve content.html without authentication
app.get('/content.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'content.html'));
});

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

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
    }
});

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

// Auth routes
app.use('/api/auth', authRoutes);

// Get all content (public)
app.get('/api/content', (req, res) => {
    res.json(contentData);
});

// Get content by category (public)
app.get('/api/content/:category', (req, res) => {
    const category = req.params.category.toLowerCase();
    if (contentData[category]) {
        res.json(contentData[category]);
    } else {
        res.status(404).json({ error: 'Category not found' });
    }
});

// Upload content (protected)
app.post('/api/upload', authenticateToken, requireAdmin, upload.single('file'), (req, res) => {
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
            uploadDate: new Date().toISOString(),
            uploadedBy: req.user.username
        };

        if (category.toLowerCase() === 'basic') {
            contentData.basic.push(contentItem);
        } else if (category.toLowerCase() === 'advanced') {
            contentData.advanced.push(contentItem);
        } else {
            return res.status(400).json({ error: 'Invalid category. Use "basic" or "advanced"' });
        }

        saveData();
        res.json({ success: true, message: 'Content uploaded successfully', data: contentItem });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update content (protected)
app.put('/api/content/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, description, category, type } = req.body;

        let updated = false;
        
        // Update in basic category
        const basicIndex = contentData.basic.findIndex(item => item.id === id);
        if (basicIndex !== -1) {
            contentData.basic[basicIndex] = {
                ...contentData.basic[basicIndex],
                title: title || contentData.basic[basicIndex].title,
                description: description || contentData.basic[basicIndex].description,
                category: category || contentData.basic[basicIndex].category,
                type: type || contentData.basic[basicIndex].type,
                updatedAt: new Date().toISOString(),
                updatedBy: req.user.username
            };
            updated = true;
        }

        // Update in advanced category
        const advancedIndex = contentData.advanced.findIndex(item => item.id === id);
        if (advancedIndex !== -1) {
            contentData.advanced[advancedIndex] = {
                ...contentData.advanced[advancedIndex],
                title: title || contentData.advanced[advancedIndex].title,
                description: description || contentData.advanced[advancedIndex].description,
                category: category || contentData.advanced[advancedIndex].category,
                type: type || contentData.advanced[advancedIndex].type,
                updatedAt: new Date().toISOString(),
                updatedBy: req.user.username
            };
            updated = true;
        }

        if (!updated) {
            return res.status(404).json({ error: 'Content not found' });
        }

        saveData();
        res.json({ success: true, message: 'Content updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete content (protected)
app.delete('/api/content/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        let deleted = false;
        
        const basicLength = contentData.basic.length;
        contentData.basic = contentData.basic.filter(item => item.id !== id);
        if (contentData.basic.length !== basicLength) deleted = true;
        
        const advancedLength = contentData.advanced.length;
        contentData.advanced = contentData.advanced.filter(item => item.id !== id);
        if (contentData.advanced.length !== advancedLength) deleted = true;
        
        if (!deleted) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        saveData();
        res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log('Available endpoints:');
    console.log('  POST /api/auth/login - User login');
    console.log('  POST /api/auth/register - User registration');
    console.log('  GET  /api/content - Get all content');
    console.log('  GET  /api/content/:category - Get content by category');
    console.log('  POST /api/upload - Upload content (protected)');
    console.log('  PUT  /api/content/:id - Update content (protected)');
    console.log('  DELETE /api/content/:id - Delete content (protected)');
    console.log('  GET  /api/health - Health check');
});
