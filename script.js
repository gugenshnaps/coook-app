// Coook Application Logic - Firebase Version
// This file handles the main functionality for Coook using Firebase

// Debug information
console.log('🔍 === COOK APP DEBUG INFO ===');
console.log('🔍 User Agent:', navigator.userAgent);
console.log('🔍 Platform:', navigator.platform);
console.log('🔍 Screen size:', window.innerWidth, 'x', window.innerHeight);
console.log('🔍 Firebase available:', !!(window.firebase && window.firebase.db));
console.log('🔍 Current URL:', window.location.href);
console.log('🔍 === END DEBUG INFO ===');

// Wait for Firebase to be available before proceeding
if (!window.firebase || !window.firebase.db) {
    console.log('⏳ Firebase not ready yet, waiting...');
}

// Global variables
let cafesData = [];
let citiesData = [];
let currentCity = null;
let currentCafe = null;

// Load saved city from localStorage
function loadSavedCity() {
    const savedCity = localStorage.getItem('coook_selected_city');
    console.log('🔧 loadSavedCity called, savedCity from localStorage:', savedCity);
    
    if (savedCity) {
        currentCity = savedCity;
        console.log('🔧 Loaded saved city:', currentCity);
        
        // Show "Show all" button if city is selected
        const showAllBtn = document.getElementById('showAllCafes');
        if (showAllBtn) {
            showAllBtn.style.display = 'block';
        }
    } else {
        console.log('🔧 No saved city found, currentCity remains:', currentCity);
        
        // Hide "Show all" button if no city is selected
        const showAllBtn = document.getElementById('showAllCafes');
        if (showAllBtn) {
            showAllBtn.style.display = 'none';
        }
    }
}

// Save selected city to localStorage
function saveSelectedCity(city) {
    console.log('🔧 saveSelectedCity called with:', city);
    console.log('🔧 Previous currentCity:', currentCity);
    
    currentCity = city;
    localStorage.setItem('coook_selected_city', city);
    
    // Show/hide "Show all" button
    const showAllBtn = document.getElementById('showAllCafes');
    if (showAllBtn) {
        showAllBtn.style.display = city ? 'block' : 'none';
    }
    
    console.log('🔧 New currentCity:', currentCity);
    console.log('🔧 Saved city selection:', city);
}

// Load cities from Firebase
async function loadCities() {
    console.log('🔧 Starting to load cities from Firebase...');
    
    if (!window.firebase || !window.firebase.db) {
        console.error('❌ Firebase not initialized');
        showCitiesError();
        return;
    }
    
    try {
        const citiesRef = window.firebase.collection(window.firebase.db, 'cities');
        const citiesSnapshot = await window.firebase.getDocs(citiesRef);
        
        if (!citiesSnapshot.empty) {
            citiesData = citiesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('🔧 Cities loaded from Firebase:', citiesData);
            populateCitySelect(citiesData.map(city => city.name));
            
            // Set up real-time listener for cities
            setupCitiesListener();
        } else {
            console.log('🔧 No cities found, creating default cities...');
            await createDefaultCities();
        }
    } catch (error) {
        console.error('❌ Error loading cities from Firebase:', error);
        showCitiesError();
    }
}

// Create default cities if none exist
async function createDefaultCities() {
    const defaultCities = [
        { name: 'São Paulo', id: 'sao-paulo' },
        { name: 'Rio de Janeiro', id: 'rio-de-janeiro' },
        { name: 'Brasília', id: 'brasilia' },
        { name: 'Salvador', id: 'salvador' }
    ];
    
    try {
        const citiesRef = window.firebase.collection(window.firebase.db, 'cities');
        for (const city of defaultCities) {
            await window.firebase.addDoc(citiesRef, city);
        }
        console.log('✅ Default cities created');
        
        // Load cities again
        await loadCities();
    } catch (error) {
        console.error('❌ Error creating default cities:', error);
        showCitiesError();
    }
}

// Set up real-time listener for cities
function setupCitiesListener() {
    try {
        console.log('🔧 Setting up cities listener...');
        const citiesRef = window.firebase.collection(window.firebase.db, 'cities');
        const citiesQuery = window.firebase.query(citiesRef, window.firebase.orderBy('name'));
        
        window.firebase.onSnapshot(citiesQuery, (snapshot) => {
            console.log('🔧 Cities updated in real-time');
            citiesData = [];
            snapshot.forEach((doc) => {
                citiesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            populateCitySelect(citiesData.map(city => city.name));
        });
    } catch (error) {
        console.error('❌ Error setting up cities listener:', error);
    }
}

// Load cafes from Firebase
async function loadCafes() {
    console.log('🔧 Starting to load cafes from Firebase...');
    
    if (!window.firebase || !window.firebase.db) {
        console.error('❌ Firebase not initialized');
        showCafesError();
        return;
    }
    
    try {
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafesSnapshot = await window.firebase.getDocs(cafesRef);
        
        if (!cafesSnapshot.empty) {
            cafesData = cafesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('🔧 Cafes loaded from Firebase:', cafesData);
            
            // Set up real-time listener for cafes (this will also display cafes)
            setupCafesListener();
        } else {
            console.log('🔧 No cafes found, creating default cafes...');
            await createDefaultCafes();
        }
    } catch (error) {
        console.error('❌ Error loading cafes from Firebase:', error);
        showCafesError();
    }
}

// Create default cafes if none exist
async function createDefaultCafes() {
    const defaultCafes = [
        {
            name: 'Café Central',
            city: 'São Paulo',
            description: 'Уютное кафе в центре города',
            hours: '8:00 - 22:00'
        }
    ];
    
    try {
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        for (const cafe of defaultCafes) {
            await window.firebase.addDoc(cafesRef, cafe);
        }
        console.log('✅ Default cafes created');
        
        // Load cafes again
        await loadCafes();
    } catch (error) {
        console.error('❌ Error creating default cafes:', error);
        showCafesError();
    }
}

// Set up real-time listener for cafes
function setupCafesListener() {
    try {
        console.log('🔧 Setting up cafes listener...');
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafesQuery = window.firebase.query(cafesRef, window.firebase.orderBy('name'));
        
        window.firebase.onSnapshot(cafesQuery, (snapshot) => {
            console.log('🔧 Cafes updated in real-time');
            cafesData = [];
            snapshot.forEach((doc) => {
                cafesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            displayCafes();
        });
    } catch (error) {
        console.error('❌ Error setting up cafes listener:', error);
    }
}

// Populate city select dropdown
function populateCitySelect(cities) {
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) {
        console.error('❌ City select element not found');
        return;
    }
    
    citySelect.innerHTML = '<option value="">Selecione uma cidade</option>';
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
    
    console.log('🔧 City select populated with:', cities);
}

// Display cafes based on selected city
function displayCafes() {
    const cafesList = document.getElementById('cafesList');
    if (!cafesList) {
        console.error('❌ Cafes list element not found');
        return;
    }
    
    console.log('🔧 displayCafes called with:');
    console.log('🔧 currentCity:', currentCity);
    console.log('🔧 cafesData length:', cafesData.length);
    console.log('🔧 cafesData:', cafesData);
    
    if (!currentCity) {
        console.log('🔧 No city selected, showing ALL cafes');
        // Show ALL cafes when no city is selected
        if (cafesData.length === 0) {
            cafesList.innerHTML = `
                <div class="no-cafes">
                    <p>Carregando cafés...</p>
                    <div class="loading"></div>
                </div>
            `;
        } else {
            cafesList.innerHTML = `
                <h3 class="cafe-section-header">Todos os cafés (${cafesData.length})</h3>
                <div class="cafes-grid">
                    ${cafesData.map(cafe => `
                        <div class="cafe-card" onclick="showCafeDetails('${cafe.id}')">
                            <div class="cafe-info">
                                <h3>${cafe.name}</h3>
                                <p class="cafe-city">${cafe.city}</p>
                                <p class="cafe-description">${cafe.description || 'Sem descrição'}</p>
                                <p class="cafe-hours">${cafe.hours || 'Horário não informado'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        return;
    }
    
    console.log('🔧 City selected, filtering cafes for:', currentCity);
    // Show cafes for selected city
    const cityCafes = cafesData.filter(cafe => cafe.city === currentCity);
    console.log('🔧 Filtered cafes:', cityCafes);
    
    if (cityCafes.length === 0) {
        cafesList.innerHTML = `
            <div class="no-cafes">
                <p>Nenhum café encontrado em ${currentCity}</p>
            </div>
        `;
    } else {
        cafesList.innerHTML = `
            <h3 class="cafe-section-header">Cafés em ${currentCity} (${cityCafes.length})</h3>
            <div class="cafes-grid">
                ${cityCafes.map(cafe => `
                    <div class="cafe-card" onclick="showCafeDetails('${cafe.id}')">
                        <div class="cafe-info">
                            <h3>${cafe.name}</h3>
                            <p class="cafe-city">${cafe.city}</p>
                            <p class="cafe-description">${cafe.description || 'Sem descrição'}</p>
                            <p class="cafe-hours">${cafe.hours || 'Horário não informado'}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    console.log('🔧 Cafes displayed for city:', currentCity, 'Count:', cityCafes.length);
    
    // Update map if it's open
    updateMapData();
}

// Show cafe details in modal
function showCafeDetails(cafeId) {
    const cafe = cafesData.find(c => c.id === cafeId);
    if (!cafe) {
        console.error('❌ Cafe not found:', cafeId);
        return;
    }
    
    currentCafe = cafe;
    
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    
    if (modal && modalContent) {
        modalContent.innerHTML = `
            <div class="cafe-detail-image">
                <div class="coffee-icon">☕</div>
            </div>
            <div class="cafe-detail-info">
                <h2 class="cafe-detail-name">${cafe.name}</h2>
                <p class="cafe-detail-city">${cafe.city}</p>
                <p class="cafe-detail-description">${cafe.description || 'Sem descrição'}</p>
                <p class="cafe-detail-hours">${cafe.hours || 'Horário não informado'}</p>
            </div>
        `;
        
        modal.style.display = 'flex';
        console.log('🔧 Cafe details shown:', cafe);
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
        currentCafe = null;
        console.log('🔧 Modal closed');
    }
}

// Show all cafes regardless of city selection
function showAllCafes() {
    console.log('🔧 showAllCafes called');
    currentCity = null;
    localStorage.removeItem('coook_selected_city');
    
    // Update city select
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.value = '';
    }
    
    // Hide show all button
    const showAllBtn = document.getElementById('showAllCafes');
    if (showAllBtn) {
        showAllBtn.style.display = 'none';
    }
    
    // Display all cafes
    displayCafes();
    
    // Update map if it's open
    updateMapData();
    
    console.log('🔧 All cafes will be shown');
}

// Show cities error
function showCitiesError() {
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.innerHTML = '<option value="">Erro ao carregar cidades</option>';
    }
    console.error('❌ Cities loading failed');
}

// Show cafes error
function showCafesError() {
    const cafesList = document.getElementById('cafesList');
    if (cafesList) {
        cafesList.innerHTML = '<div class="no-cafes"><p>Erro ao carregar cafés</p></div>';
    }
    console.error('❌ Cafes loading failed');
}

// Initialize app
async function initializeApp() {
    console.log('🔧 Initializing Coook app...');
    
    try {
        // Initialize Telegram WebApp if available
        initializeTelegramWebApp();
        
        // Load saved city
        loadSavedCity();
        
        // Wait for Firebase to be ready
        let retryCount = 0;
        const maxRetries = 10;
        
        while (!window.firebase || !window.firebase.db) {
            if (retryCount >= maxRetries) {
                console.error('❌ Firebase not available after retries');
                return;
            }
            console.log(`🔧 Waiting for Firebase... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;
        }
        
        console.log('✅ Firebase is ready, loading data...');
        
        // Load cities and cafes from Firebase
        await loadCities();
        await loadCafes();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
    }
}

// Initialize Telegram WebApp
function initializeTelegramWebApp() {
    console.log('🔧 Checking Telegram WebApp availability...');
    console.log('🔧 window.Telegram:', window.Telegram);
    console.log('🔧 window.Telegram?.WebApp:', window.Telegram?.WebApp);
    console.log('🔧 window.location.href:', window.location.href);
    console.log('🔧 window.location.search:', window.location.search);
    console.log('🔧 User agent:', navigator.userAgent);
    
    // Check for Telegram WebApp in URL parameters (both search and hash)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1)); // Remove # from hash
    
    const tgWebAppData = urlParams.get('tgWebAppData') || hashParams.get('tgWebAppData');
    console.log('🔧 tgWebAppData from search:', urlParams.get('tgWebAppData'));
    console.log('🔧 tgWebAppData from hash:', hashParams.get('tgWebAppData'));
    console.log('🔧 Final tgWebAppData:', tgWebAppData);
    
    // Check if we're in Telegram browser
    const isTelegramBrowser = navigator.userAgent.includes('TelegramWebApp') || 
                             navigator.userAgent.includes('Telegram') ||
                             window.location.href.includes('tgWebAppData');
    
    console.log('🔧 Is Telegram browser:', isTelegramBrowser);
    
    if (window.Telegram && window.Telegram.WebApp) {
        console.log('🔧 Telegram WebApp detected, initializing...');
        
        try {
            // Initialize Telegram WebApp
            window.Telegram.WebApp.ready();
            console.log('✅ Telegram WebApp ready');
            
            // Set up user info
            const user = window.Telegram.WebApp.initDataUnsafe?.user;
            console.log('🔧 User data:', user);
            console.log('🔧 initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);
            console.log('🔧 initData:', window.Telegram.WebApp.initData);
            
            if (user) {
                // Update user avatar
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar && user.photo_url) {
                    userAvatar.src = user.photo_url;
                    userAvatar.alt = `${user.first_name} ${user.last_name || ''}`;
                    console.log('✅ Avatar updated:', user.photo_url);
                } else {
                    console.log('❌ Avatar element not found or no photo_url');
                }
                
                // Update user name
                const userName = document.getElementById('userName');
                if (userName) {
                    const fullName = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
                    userName.textContent = fullName;
                    console.log('✅ User name updated:', fullName);
                } else {
                    console.log('❌ User name element not found');
                }
                
                console.log('✅ Telegram user info loaded:', user);
            } else {
                console.log('ℹ️ No Telegram user data available');
                console.log('🔧 initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);
                console.log('🔧 initData:', window.Telegram.WebApp.initData);
                
                // Try alternative ways to get user data
                const initData = window.Telegram.WebApp.initData;
                if (initData) {
                    console.log('🔧 Trying to parse initData:', initData);
                    // Parse initData manually if needed
                }
            }
        } catch (error) {
            console.error('❌ Error initializing Telegram WebApp:', error);
        }
    } else if (isTelegramBrowser) {
        console.log('🔧 Telegram browser detected, but WebApp API not available');
        console.log('🔧 This might be a BotFather configuration issue');
        console.log('🔧 Available global objects:', Object.keys(window).filter(key => key.toLowerCase().includes('telegram')));
        
        // Try to detect Telegram WebApp in other ways
        if (window.TelegramWebApp) {
            console.log('🔧 Found window.TelegramWebApp, trying to use it...');
            try {
                window.TelegramWebApp.ready();
                console.log('✅ TelegramWebApp ready');
                
                const user = window.TelegramWebApp.initDataUnsafe?.user;
                if (user) {
                    updateUserInfo(user);
                }
            } catch (error) {
                console.error('❌ Error with TelegramWebApp:', error);
            }
        }
        
        // Try to parse Telegram data from hash if available
        if (tgWebAppData) {
            console.log('🔧 Found tgWebAppData in hash, trying to parse...');
            try {
                const parsedData = parseTelegramWebAppData(tgWebAppData);
                if (parsedData && parsedData.user) {
                    console.log('✅ Parsed Telegram user data:', parsedData.user);
                    updateUserInfo(parsedData.user);
                    return; // Don't set fallback if we got user data
                }
            } catch (error) {
                console.error('❌ Error parsing tgWebAppData:', error);
            }
        }
        
        // Fallback: Set default user info for testing
        setFallbackUserInfo();
    } else {
        console.log('ℹ️ Not running in Telegram WebApp');
        console.log('🔧 Available global objects:', Object.keys(window).filter(key => key.toLowerCase().includes('telegram')));
        
        // Fallback: Set default user info for testing
        setFallbackUserInfo();
    }
}

// Parse Telegram WebApp data from hash
function parseTelegramWebAppData(tgWebAppData) {
    console.log('🔧 Parsing tgWebAppData:', tgWebAppData);
    
    try {
        // Parse the URL-encoded data
        const decodedData = decodeURIComponent(tgWebAppData);
        console.log('🔧 Decoded data:', decodedData);
        
        // Extract user data from the query string
        const userMatch = decodedData.match(/user=([^&]+)/);
        if (userMatch) {
            const userData = userMatch[1];
            console.log('🔧 User data string:', userData);
            
            // Parse the user JSON (it's double-encoded)
            const userJson = decodeURIComponent(userData);
            console.log('🔧 User JSON string:', userJson);
            
            const user = JSON.parse(userJson);
            console.log('🔧 Parsed user object:', user);
            
            return { user };
        }
        
        console.log('❌ No user data found in tgWebAppData');
        return null;
    } catch (error) {
        console.error('❌ Error parsing tgWebAppData:', error);
        return null;
    }
}

// Update user info with Telegram data
function updateUserInfo(user) {
    console.log('🔧 Updating user info with:', user);
    
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (userAvatar && user.photo_url) {
        userAvatar.src = user.photo_url;
        userAvatar.alt = `${user.first_name} ${user.last_name || ''}`;
        console.log('✅ Avatar updated:', user.photo_url);
    }
    
    if (userName) {
        const fullName = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
        userName.textContent = fullName;
        console.log('✅ User name updated:', fullName);
    }
}

// Set fallback user info
function setFallbackUserInfo() {
    console.log('🔧 Setting fallback user info for testing...');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (userAvatar) {
        userAvatar.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0QTkwRTIiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTggMTJDMTAuMjA5MSAxMiAxMiAxMC4yMDkxIDEyIDhDMTIgNS43OTA5IDEwLjIwOTEgNCA4IDRDNS43OTA5IDQgNCA1Ljc5MDkgNCA4QzQgMTAuMjA5MSA1Ljc5MDkgNCA4IDRaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNOCAxNEMxMC4yMDkxIDE0IDEyIDEyLjIwOTEgMTIgMTBDMTIgOS43OTA5IDEwLjIwOTEgOCA4IDhDNi4yMDkxIDggNCA5Ljc5MDkgNCAxMkM0IDEyLjIwOTEgNi4yMDkxIDE0IDggMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+';
        userAvatar.alt = 'Default User';
        console.log('✅ Fallback avatar set');
    }
    
    if (userName) {
        userName.textContent = 'Usuário Teste';
        console.log('✅ Fallback user name set');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM loaded, setting up event listeners...');
    
    // City selection
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            const selectedCity = e.target.value;
            if (selectedCity) {
                saveSelectedCity(selectedCity);
                displayCafes();
                console.log('🔧 City selected:', selectedCity);
            }
        });
    }
    
    // Show all cafes button
    const showAllBtn = document.getElementById('showAllCafes');
    if (showAllBtn) {
        showAllBtn.addEventListener('click', showAllCafes);
    }
    
    // Modal close
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close button click
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
    }
    
    // Initialize app
    initializeApp();
});

// Close modal with escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ===== GOOGLE MAPS FUNCTIONALITY =====

// Global variables for map
let map = null;
let userMarker = null;
let cafeMarkers = [];
let userLocation = null;

// Initialize map when Google Maps API is loaded
function initMap() {
    console.log('🗺️ Google Maps API loaded, initializing map...');
    
    // Set up map event listeners
    setupMapEventListeners();
    
    // Try to get user location
    getUserLocation();
}

// Set up map event listeners
function setupMapEventListeners() {
    const showMapBtn = document.getElementById('showMapBtn');
    const closeMapBtn = document.getElementById('closeMapBtn');
    const mapContainer = document.getElementById('mapContainer');
    
    if (showMapBtn) {
        showMapBtn.addEventListener('click', showMap);
    }
    
    if (closeMapBtn) {
        closeMapBtn.addEventListener('click', hideMap);
    }
    
    if (mapContainer) {
        mapContainer.addEventListener('click', (e) => {
            if (e.target === mapContainer) {
                hideMap();
            }
        });
    }
}

// Show map
function showMap() {
    console.log('🗺️ Showing map...');
    
    const mapContainer = document.getElementById('mapContainer');
    const mapElement = document.getElementById('map');
    
    if (mapContainer && mapElement) {
        mapContainer.style.display = 'flex';
        
        // Initialize map if not already done
        if (!map) {
            initializeMap(mapElement);
        }
        
        // Update map with current data
        updateMapWithCafes();
    }
}

// Hide map
function hideMap() {
    console.log('🗺️ Hiding map...');
    
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) {
        mapContainer.style.display = 'none';
    }
}

// Initialize Google Map
function initializeMap(mapElement) {
    console.log('🗺️ Initializing Google Map...');
    
    // Default center (São Paulo, Brazil)
    const defaultCenter = { lat: -23.5505, lng: -46.6333 };
    
    // Create map
    map = new google.maps.Map(mapElement, {
        zoom: 12,
        center: userLocation || defaultCenter,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            {
                featureType: 'poi.business',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    console.log('✅ Map initialized successfully');
}

// Get user location
function getUserLocation() {
    console.log('📍 Getting user location...');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                console.log('✅ User location obtained:', userLocation);
                
                // Add user marker if map is initialized
                if (map) {
                    addUserMarker();
                    centerMapOnUser();
                }
            },
            (error) => {
                console.warn('⚠️ Could not get user location:', error.message);
                // Use default location
                userLocation = { lat: -23.5505, lng: -46.6333 };
            }
        );
    } else {
        console.warn('⚠️ Geolocation not supported');
        userLocation = { lat: -23.5505, lng: -46.6333 };
    }
}

// Add user marker to map
function addUserMarker() {
    if (!map || !userLocation) return;
    
    // Remove existing user marker
    if (userMarker) {
        userMarker.setMap(null);
    }
    
    // Create new user marker
    userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
        icon: {
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiM0QTkwRTIiLz4KPHBhdGggZD0iTTEyIDEzQzEzLjY2IDEzIDE1IDExLjY2IDE1IDEwQzE1IDguMzQgMTMuNjYgNyAxMiA3QzEwLjM0IDcgOSA4LjM0IDkgMTBDOSAxMS42NiAxMC4zNCAxMyAxMiAxM1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
            scaledSize: new google.maps.Size(24, 24)
        }
    });
    
    console.log('✅ User marker added to map');
}

// Center map on user location
function centerMapOnUser() {
    if (map && userLocation) {
        map.setCenter(userLocation);
        console.log('✅ Map centered on user location');
    }
}

// Update map with cafes
function updateMapWithCafes() {
    if (!map || !cafesData || cafesData.length === 0) return;
    
    console.log('🗺️ Updating map with cafes...');
    
    // Clear existing cafe markers
    cafeMarkers.forEach(marker => marker.setMap(null));
    cafeMarkers = [];
    
    // Add cafe markers
    cafesData.forEach(cafe => {
        if (cafe.lat && cafe.lng) {
            const marker = new google.maps.Marker({
                position: { lat: parseFloat(cafe.lat), lng: parseFloat(cafe.lng) },
                map: map,
                title: cafe.name,
                icon: {
                    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiNGRjY2MDAiLz4KPHBhdGggZD0iTTEyIDEzQzEzLjY2IDEzIDE1IDExLjY2IDE1IDEwQzE1IDguMzQgMTMuNjYgNyAxMiA3QzEwLjM0IDcgOSA4LjM0IDkgMTBDOSAxMS42NiAxMC4zNCAxMyAxMiAxM1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
                    scaledSize: new google.maps.Size(24, 24)
                }
            });
            
            // Add click listener to marker
            marker.addListener('click', () => {
                showCafeInfo(cafe, marker);
            });
            
            cafeMarkers.push(marker);
        }
    });
    
    console.log(`✅ Added ${cafeMarkers.length} cafe markers to map`);
}

// Show cafe info on map
function showCafeInfo(cafe, marker) {
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; max-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #333;">${cafe.name}</h3>
                <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">${cafe.description || ''}</p>
                <p style="margin: 0 0 5px 0; color: #888; font-size: 12px;">${cafe.hours || ''}</p>
                <p style="margin: 0; color: #4A90E2; font-size: 12px; font-weight: 600;">${cafe.city}</p>
            </div>
        `
    });
    
    infoWindow.open(map, marker);
}

// Update map when cafes data changes
function updateMapData() {
    if (map) {
        updateMapWithCafes();
    }
}
