// Animated Background for Coook App
// Adapted from React Bits Iridescence effect

class AnimatedBackground {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.time = 0;
        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.amplitude = 0.1;
        this.speed = 1.0;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.bindEvents();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX / window.innerWidth;
            this.mouseY = 1.0 - (e.clientY / window.innerHeight);
        });
        
        // Touch movement for mobile
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouseX = touch.clientX / window.innerWidth;
            this.mouseY = 1.0 - (touch.clientY / window.innerHeight);
        });
    }
    
    // Fragment shader logic adapted to Canvas 2D
    getColor(x, y) {
        const resolution = Math.min(this.canvas.width, this.canvas.height);
        const uv = [(x * 2.0 - 1.0) * this.canvas.width / resolution, 
                    (y * 2.0 - 1.0) * this.canvas.height / resolution];
        
        // Add mouse influence
        uv[0] += (this.mouseX - 0.5) * this.amplitude;
        uv[1] += (this.mouseY - 0.5) * this.amplitude;
        
        const d = -this.time * 0.5 * this.speed;
        let a = 0.0;
        
        // Create iridescent effect
        for (let i = 0; i < 8; ++i) {
            a += Math.cos(i - d - a * uv[0]);
            d += Math.sin(uv[1] * i + a);
        }
        
        const d2 = d + this.time * 0.5 * this.speed;
        const col = [
            Math.cos(uv[0] * d2) * 0.6 + 0.4,
            Math.cos(uv[1] * a) * 0.6 + 0.4,
            Math.cos(a + d2) * 0.5 + 0.5
        ];
        
        // Apply color transformation
        const finalCol = [
            Math.cos(col[0] * Math.cos(d2) * 0.5 + 0.5) * 0.8 + 0.2,
            Math.cos(col[1] * Math.cos(a) * 0.5 + 0.5) * 0.8 + 0.2,
            Math.cos(col[2] * Math.cos(d2 + a) * 0.5 + 0.5) * 0.8 + 0.2
        ];
        
        return finalCol;
    }
    
    animate() {
        this.time += 16; // 60 FPS
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create gradient background
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width * 0.5, 
            this.canvas.height * 0.5, 
            0,
            this.canvas.width * 0.5, 
            this.canvas.height * 0.5, 
            Math.max(this.canvas.width, this.canvas.height) * 0.7
        );
        
        // Add gradient stops with iridescent colors
        for (let i = 0; i <= 1; i += 0.1) {
            const color = this.getColor(i, i);
            gradient.addColorStop(i, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, 0.8)`);
        }
        
        // Fill background
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add subtle animated patterns
        this.drawPatterns();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawPatterns() {
        // Create subtle wave patterns
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            for (let x = 0; x < this.canvas.width; x += 10) {
                const y = this.canvas.height * 0.5 + 
                          Math.sin(x * 0.01 + this.time * 0.001 * (i + 1)) * 50 * (i + 1);
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
    }
}

// Initialize background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnimatedBackground();
});
