import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Handle HTML routes without extensions
app.get('*', (req, res, next) => {
    if (req.path.includes('.')) {
        next(); // Skip if the path has a file extension
        return;
    }

    // Remove trailing slash if present
    const cleanPath = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
    
    // Map clean URLs to HTML files
    const routes = {
        '/': './index.html',
        '/about-us': './about-us.html',
        '/dashboard': './dashboard.html',
        '/create-listing': './create-listing.html',
        '/marketplace': './marketplace.html'
    };

    try {
        // Get the mapped file path or use the clean path with .html
        const htmlFile = routes[cleanPath] || `${cleanPath}.html`;
        const filePath = path.join(__dirname, htmlFile);

        // Check if file exists before sending
        if (require('fs').existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            // Log the attempted path for debugging
            console.log('File not found:', filePath);
            next();
        }
    } catch (error) {
        console.error('Error serving file:', error);
        next();
    }
});

// Add a 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Firebase config endpoint
app.get('/config', (req, res) => {
    res.json({
        firebase: {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Log the available routes
    console.log('Available routes:', Object.keys(routes));
}); 