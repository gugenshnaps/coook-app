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

// API endpoint для получения всех городов
server.get('/api/cities', (req, res) => {
    try {
        // Читаем файл с городами
        const citiesData = fs.readFileSync('cities.json', 'utf8');
        const cities = JSON.parse(citiesData);
        
        // Возвращаем только названия городов для приложения
        const cityNames = cities.map(city => city.name);
        
        res.json({
            success: true,
            cities: cityNames
        });
    } catch (error) {
        console.error('❌ Error loading cities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load cities'
        });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📱 Aplicação Coook está pronta para uso!`);
    console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`📱 Telegram Version: http://localhost:${PORT}/telegram`);
    console.log(`🌍 Cidades disponíveis: São Paulo, Rio de Janeiro, Brasília`);
    console.log(`📋 Instruções:`);
    console.log(`   • Usuários: http://localhost:${PORT}`);
    console.log(`   • Administradores: http://localhost:${PORT}/admin`);
    console.log(`   • Telegram: http://localhost:${PORT}/telegram`);
    console.log(`   • Изменения в админ панели автоматически синхронизируются с основным приложением`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
