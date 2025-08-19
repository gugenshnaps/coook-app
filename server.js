const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 7000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Route handling
    if (req.url === '/admin') {
        filePath = '/admin.html';
    } else if (req.url === '/telegram') {
        filePath = '/telegram.html';
    }
    
    // Get file extension
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Read file
    fs.readFile(path.join(__dirname, filePath), (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log('📱 Aplicação Caaafe está pronta para uso!');
    
    // Load cities data
    try {
        const citiesData = fs.readFileSync('cities.json', 'utf8');
        const cities = JSON.parse(citiesData);
        console.log('🌍 Cidades disponíveis:', cities.map(c => c.name).join(', '));
    } catch (error) {
        console.log('⚠️ Não foi possível carregar cities.json');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

// API endpoint для получения всех городов
server.get('/api/cities', (req, res) => {
    try {
        const citiesData = fs.readFileSync('cities.json', 'utf8');
        const cities = JSON.parse(citiesData);
        
        res.json({
            success: true,
            cities: cities
        });
    } catch (error) {
        console.error('❌ Error loading cities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load cities'
        });
    }
});

// API endpoint для добавления нового города
server.post('/api/cities', (req, res) => {
    try {
        const citiesData = fs.readFileSync('cities.json', 'utf8');
        const cities = JSON.parse(citiesData);
        
        const newCity = req.body;
        newCity.id = newCity.name.toLowerCase().replace(/\s+/g, '-');
        
        cities.push(newCity);
        
        fs.writeFileSync('cities.json', JSON.stringify(cities, null, 2));
        
        res.json({
            success: true,
            message: 'City added successfully',
            city: newCity
        });
    } catch (error) {
        console.error('❌ Error adding city:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add city'
        });
    }
});

// API endpoint для удаления города
server.delete('/api/cities/:id', (req, res) => {
    try {
        const citiesData = fs.readFileSync('cities.json', 'utf8');
        let cities = JSON.parse(citiesData);
        
        const cityId = req.params.id;
        cities = cities.filter(city => city.id !== cityId);
        
        fs.writeFileSync('cities.json', JSON.stringify(cities, null, 2));
        
        res.json({
            success: true,
            message: 'City deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting city:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete city'
        });
    }
});

// API endpoint для получения всех кафе
server.get('/api/cafes', (req, res) => {
    try {
        const cafesData = fs.readFileSync('cafes.json', 'utf8');
        const cafes = JSON.parse(cafesData);
        
        res.json({
            success: true,
            cafes: cafes
        });
    } catch (error) {
        console.error('❌ Error loading cafes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load cafes'
        });
    }
});

// API endpoint для добавления нового кафе
server.post('/api/cafes', (req, res) => {
    try {
        const cafesData = fs.readFileSync('cafes.json', 'utf8');
        const cafes = JSON.parse(cafesData);
        
        const newCafe = req.body;
        newCafe.id = Date.now().toString();
        
        cafes.push(newCafe);
        
        fs.writeFileSync('cafes.json', JSON.stringify(cafes, null, 2));
        
        res.json({
            success: true,
            message: 'Cafe added successfully',
            cafe: newCafe
        });
    } catch (error) {
        console.error('❌ Error adding cafe:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add cafe'
        });
    }
});
