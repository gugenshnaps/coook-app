// Coook Application Logic - Universal Version
// This file handles the main functionality for Coook - works everywhere

// Debug information
console.log('🔍 === COOK APP DEBUG INFO ===');
console.log('🔍 User Agent:', navigator.userAgent);
console.log('🔍 Platform:', navigator.platform);
console.log('🔍 Screen size:', window.innerWidth, 'x', window.innerHeight);
console.log('🔍 Telegram WebApp available:', !!(window.Telegram && window.Telegram.WebApp));
console.log('🔍 Current URL:', window.location.href);
console.log('🔍 === END DEBUG INFO ===');

// Global variables
let cafesData = [];
let citiesData = [];
let currentCity = null;
let currentCafe = null;

// Load saved city from localStorage
function loadSavedCity() {
    const savedCity = localStorage.getItem('coook_selected_city');
    if (savedCity) {
        currentCity = savedCity;
        console.log('🔧 Loaded saved city:', currentCity);
    }
}

// Save selected city to localStorage
function saveSelectedCity(city) {
    currentCity = city;
    localStorage.setItem('coook_selected_city', city);
    console.log('🔧 Saved city selection:', city);
}

// Load cities from static file
async function loadCities() {
    console.log('🔧 Starting to load cities...');
    try {
        const response = await fetch('./cities.json');
        console.log('🔧 Response status:', response.status);
        console.log('🔧 Response URL:', response.url);
        
        const cities = await response.json();
        console.log('🔧 Raw cities data:', cities);
        
        if (cities && cities.length > 0) {
            // Extract city names from the array
            const cityNames = cities.map(city => city.name);
            console.log('🔧 City names extracted:', cityNames);
            populateCitySelect(cityNames);
            console.log('🔧 Cities loaded from cities.json:', cityNames);
        } else {
            console.error('❌ Failed to load cities from cities.json - empty or invalid data');
            // Fallback to default cities
            populateCitySelect(['São Paulo', 'Rio de Janeiro', 'Brasília']);
        }
    } catch (error) {
        console.error('❌ Error loading cities from cities.json:', error);
        // Fallback to default cities
        populateCitySelect(['São Paulo', 'Rio de Janeiro', 'Brasília']);
    }
}

// Populate city select dropdown
function populateCitySelect(cities) {
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) return;
    
    // Clear existing options
    citySelect.innerHTML = '<option value="">Selecione uma cidade</option>';
    
    // Add cities from API
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
    
    // Restore saved city selection if exists
    if (currentCity && cities.includes(currentCity)) {
        citySelect.value = currentCity;
    }
}

// Initialize the application
function initializeApp() {
    loadSavedCity(); // Load saved city first
    loadCities(); // Load cities from cities.json
    loadData();
    setupEventListeners();
    setupUniversalIntegration();
    initMobileGestures();
    
    // Auto-refresh data every 5 seconds
    setInterval(refreshData, 5000);
    
    console.log('✅ Coook Universal App initialized successfully!');
}

// Setup universal integration (works everywhere)
function setupUniversalIntegration() {
    // Check if we're in Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Set app theme
        tg.setHeaderColor('#4A90E2');
        tg.setBackgroundColor('#ffffff');
        
        // Expand to fullscreen
        tg.expand();
        
        // Load user info from Telegram
        loadUserInfo(tg);
        
        // Set up main button for cafe details
        tg.mainButton.setText('Ver Detalhes');
        tg.mainButton.setColor('#4A90E2');
        tg.mainButton.setTextColor('#ffffff');
        
        // Set up back button
        tg.backButton.onClick(function() {
            closeModal();
        });
        
        console.log('🔧 Telegram WebApp integration configured');
    } else {
        // Running in browser - create mock user info
        createMockUserInfo();
        console.log('🔧 Browser mode - using mock user info');
    }
}

// Load user info from Telegram
function loadUserInfo(tg) {
    const user = tg.initDataUnsafe?.user;
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (user) {
        // Set username
        if (userNameElement) {
            userNameElement.textContent = user.first_name || 'Usuário';
        }
        
        // Set avatar
        if (userAvatarElement && user.photo_url) {
            userAvatarElement.src = user.photo_url;
        }
        
        console.log('🔧 User info loaded from Telegram:', user.first_name);
    } else {
        // Fallback if no user data
        if (userNameElement) {
            userNameElement.textContent = 'Visitante';
        }
        console.log('🔧 No Telegram user data available, using fallback');
    }
}

// Create mock user info for browser mode
function createMockUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = 'Visitante';
    }
}

// Load data from server
async function loadData() {
    try {
        const response = await fetch('/api/cafes');
        const data = await response.json();
        
        if (data.success) {
            cafesData = data.cafes;
            citiesData = data.cities;
            console.log('✅ Data loaded successfully');
            displayCafes();
        } else {
            console.error('❌ Failed to load data:', data.error);
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
        // Load mock data for development
        loadMockData();
    }
}

// Load mock data for development
function loadMockData() {
    cafesData = [
        {
            id: 'cafe-central',
            name: 'Café Central',
            city: 'São Paulo',
            description: 'Um café acolhedor no coração da cidade com os melhores grãos brasileiros.',
            image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400'
        },
        {
            id: 'bella-vista',
            name: 'Bella Vista',
            city: 'Rio de Janeiro',
            description: 'Café com vista panorâmica e ambiente sofisticado para momentos especiais.',
            image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400'
        }
    ];
    
    console.log('🔧 Mock data loaded for development');
    displayCafes();
}

// Setup event listeners
function setupEventListeners() {
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            saveSelectedCity(this.value);
            displayCafes();
        });
    }
    
    // Modal close button
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('cafeModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Display cafes based on selected city
function displayCafes() {
    const cafesList = document.getElementById('cafesList');
    const noCafes = document.getElementById('noCafes');
    
    if (!cafesList) return;
    
    if (!currentCity) {
        cafesList.innerHTML = '<div class="loading">Selecione uma cidade para ver os cafés</div>';
        if (noCafes) noCafes.style.display = 'none';
        return;
    }
    
    // Set selected city in dropdown
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.value = currentCity;
    }
    
    const cityCafes = cafesData.filter(cafe => cafe.city === currentCity);
    
    if (cityCafes.length === 0) {
        cafesList.innerHTML = '';
        if (noCafes) noCafes.style.display = 'block';
        return;
    }
    
    if (noCafes) noCafes.style.display = 'none';
    
    const cafesHTML = cityCafes.map(cafe => `
        <div class="cafe-card" onclick="showCafeDetails('${cafe.id}')">
            <img src="${cafe.image}" alt="${cafe.name}" class="cafe-image">
            <div class="cafe-info">
                <div class="cafe-name">${cafe.name}</div>
                <div class="cafe-location">${cafe.city}</div>
                <div class="cafe-description">${cafe.description}</div>
            </div>
        </div>
    `).join('');
    
    cafesList.innerHTML = cafesHTML;
}

// Show cafe details in modal
function showCafeDetails(cafeId) {
    const cafe = cafesData.find(c => c.id === cafeId);
    if (!cafe) return;
    
    currentCafe = cafe;
    
    const modal = document.getElementById('cafeModal');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal || !modalContent) return;
    
    modalContent.innerHTML = `
        <img src="${cafe.image}" alt="${cafe.name}" class="cafe-detail-image">
        <div class="cafe-detail-info">
            <h2 class="cafe-detail-name">${cafe.name}</h2>
            <div class="cafe-detail-city">${cafe.city}</div>
            <p class="cafe-detail-description">${cafe.description}</p>
            <div class="cafe-detail-hours">
                <h3>Horário de Funcionamento</h3>
                <p>Segunda a Sexta: 7h às 22h</p>
                <p>Sábado e Domingo: 8h às 23h</p>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    
    console.log('🔧 Cafe details modal opened for:', cafe.name);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('cafeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Refresh data
function refreshData() {
    loadData();
}

// Initialize mobile gestures
function initMobileGestures() {
    // Add touch gestures for mobile
    let startY = 0;
    let startX = 0;
    
    document.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
    });
    
    document.addEventListener('touchend', function(e) {
        const endY = e.changedTouches[0].clientY;
        const endX = e.changedTouches[0].clientX;
        const diffY = startY - endY;
        const diffX = startX - endX;
        
        // Swipe up to refresh
        if (diffY > 50 && Math.abs(diffX) < 50) {
            refreshData();
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Coook Universal App starting...');
    initializeApp();
});
