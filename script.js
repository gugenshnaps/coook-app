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
        
        // Update city select to show selected city
        const citySelect = document.getElementById('citySelect');
        if (citySelect) {
            citySelect.value = savedCity;
        }
        
        // Show "Show all" button if city is selected
        const showAllBtn = document.getElementById('showAllCafes');
        if (showAllBtn) {
            showAllBtn.style.display = 'block';
        }
    } else {
        currentCity = null;
        console.log('🔧 No saved city found, currentCity set to null');
        
        // Update city select to show default option
        const citySelect = document.getElementById('citySelect');
        if (citySelect) {
            citySelect.value = '';
        }
        
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
    
    if (city) {
        localStorage.setItem('coook_selected_city', city);
    } else {
        localStorage.removeItem('coook_selected_city');
    }
    
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
                        <div class="cafe-card" onclick="handleCafeCardClick(event, '${cafe.id}')">
                            <div class="cafe-photo">
                                ${cafe.photoUrl ? 
                                    `<img src="${cafe.photoUrl}" alt="${cafe.name}" class="cafe-thumbnail">` : 
                                    `<div class="cafe-placeholder">☕</div>`
                                }
                            </div>
                            <div class="cafe-info">
                                <div class="cafe-header">
                                    <h3 class="cafe-name">${cafe.name}</h3>
                                    <button class="favorite-btn ${isCafeInFavorites(cafe.id) ? 'favorited' : ''}" 
                                            data-cafe-id="${cafe.id}" 
                                            data-cafe-name="${cafe.name}" 
                                            data-cafe-city="${cafe.city}" 
                                            data-cafe-description="${cafe.description || ''}">
                                        ${isCafeInFavorites(cafe.id) ? '❤️' : '🤍'}
                                    </button>
                                </div>
                                ${cafe.address ? `<p class="cafe-address">📍 ${cafe.address}</p>` : ''}
                                <p class="cafe-description">${cafe.description || 'Sem descrição'}</p>
                                <button class="btn-details" onclick="event.stopPropagation(); showCafeDetails('${cafe.id}')">
                                    VER DETALHES
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Add event listeners to favorite buttons
        addFavoriteButtonListeners();
        
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
                    <div class="cafe-card" onclick="handleCafeCardClick(event, '${cafe.id}')">
                        <div class="cafe-photo">
                            ${cafe.photoUrl ? 
                                `<img src="${cafe.photoUrl}" alt="${cafe.name}" class="cafe-thumbnail">` : 
                                `<div class="cafe-placeholder">☕</div>`
                            }
                        </div>
                                                    <div class="cafe-info">
                                <div class="cafe-header">
                                    <h3 class="cafe-name">${cafe.name}</h3>
                                    <button class="favorite-btn ${isCafeInFavorites(cafe.id) ? 'favorited' : ''}" 
                                            data-cafe-id="${cafe.id}" 
                                            data-cafe-name="${cafe.name}" 
                                            data-cafe-city="${cafe.city}" 
                                            data-cafe-description="${cafe.description || ''}">
                                        ${isCafeInFavorites(cafe.id) ? '❤️' : '🤍'}
                                    </button>
                                </div>
                                ${cafe.address ? `<p class="cafe-address">📍 ${cafe.address}</p>` : ''}
                                <p class="cafe-description">${cafe.description || 'Sem descrição'}</p>
                                <button class="btn-details" onclick="event.stopPropagation(); showCafeDetails('${cafe.id}')">
                                    VER DETALHES
                                </button>
                            </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    console.log('🔧 Cafes displayed for city:', currentCity, 'Count:', cityCafes.length);
    
    // Add event listeners to favorite buttons
    addFavoriteButtonListeners();
}

// Add event listeners to favorite buttons
function addFavoriteButtonListeners() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const cafeId = this.getAttribute('data-cafe-id');
            const cafeName = this.getAttribute('data-cafe-name');
            const cafeCity = this.getAttribute('data-cafe-city');
            const cafeDescription = this.getAttribute('data-cafe-description');
            
            console.log('🔍 DEBUG: Favorite button clicked:', { cafeId, cafeName, cafeCity, cafeDescription });
            
            toggleFavorite(cafeId, cafeName, cafeCity, cafeDescription);
        });
    });
    
    console.log('🔧 Event listeners added to', favoriteButtons.length, 'favorite buttons');
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
            <div class="cafe-detail-header">
                <div class="cafe-detail-image">
                    ${cafe.photoUrl ? 
                        `<img src="${cafe.photoUrl}" alt="${cafe.name}" class="cafe-detail-photo">` : 
                        `<div class="coffee-icon">☕</div>`
                    }
                </div>
                <div class="cafe-detail-title">
                    <h2 class="cafe-detail-name">${cafe.name}</h2>
                    <div class="cafe-detail-actions">
                        <button class="favorite-btn ${isCafeInFavorites(cafe.id) ? 'favorited' : ''}" 
                                onclick="toggleFavorite('${cafe.id}', '${cafe.name}', '${cafe.city}', '${cafe.description || ''}')">
                            ${isCafeInFavorites(cafe.id) ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="cafe-detail-info">
                <p class="cafe-detail-city">${cafe.city}</p>
                ${cafe.address ? `<p class="cafe-detail-address">📍 ${cafe.address}</p>` : ''}
                <p class="cafe-detail-description">${cafe.description || 'Sem descrição'}</p>
                
                <!-- Working hours for all days -->
                <div class="cafe-detail-working-hours">
                    <h3>🕒 Horário de Funcionamento</h3>
                    ${formatWorkingHours(cafe.workingHours)}
                </div>
                
                <!-- Loyalty button -->
                <button class="loyalty-apply-btn" onclick="applyLoyalty('${cafe.id}', '${cafe.name}')">
                    🎯 Aplicar Lealdade
                </button>
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

// Handle cafe card click - smart click detection
function handleCafeCardClick(event, cafeId) {
    // Check if click was on a button or interactive element
    if (event.target.closest('.favorite-btn') || 
        event.target.closest('button') || 
        event.target.tagName === 'BUTTON') {
        console.log('🔍 DEBUG: Click on button, not opening card');
        return; // Don't open card if clicking on button
    }
    
    console.log('🔍 DEBUG: Opening cafe card for:', cafeId);
    showCafeDetails(cafeId);
}

// Initialize app
async function initializeApp() {
    console.log('🔧 Initializing Coook app...');
    
    try {
        // Initialize Telegram WebApp if available
        initializeTelegramWebApp();
        
        // Initialize user system
        await initializeUserSystem();
        
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
        
        // Initialize menu functionality
        initializeMenu();
        
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
            } else {
                // Clear city selection and show all cafes
                saveSelectedCity(null);
                displayCafes();
                console.log('🔧 City selection cleared, showing all cafes');
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

// ===== MENU FUNCTIONALITY =====

// Initialize menu functionality
function initializeMenu() {
    console.log('🍽️ Initializing menu functionality...');
    
    // Loyalty button
    const loyaltyBtn = document.querySelector('.loyalty-btn');
    if (loyaltyBtn) {
        loyaltyBtn.addEventListener('click', showLoyalty);
    }
    
    // Favorites button
    const favoritesBtn = document.querySelector('.favorites-btn');
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', showFavorites);
    }
    
    console.log('✅ Menu functionality initialized');
}

// Show loyalty information
function showLoyalty() {
    console.log('🎯 Loyalty button clicked');
    
    // Create modal content
    const modalContent = `
        <div class="loyalty-modal">
            <h2>🎯 Minha Lealdade</h2>
            <div class="loyalty-stats">
                <div class="stat-item">
                    <span class="stat-number">0</span>
                    <span class="stat-label">Cafés Visitados</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">0</span>
                    <span class="stat-label">Pontos Acumulados</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">Bronze</span>
                    <span class="stat-label">Nível Atual</span>
                </div>
            </div>
            <div class="loyalty-info">
                <p>🌟 Visite cafés para acumular pontos e subir de nível!</p>
                <p>🎁 Desbloqueie benefícios exclusivos conforme sua lealdade cresce.</p>
            </div>
        </div>
    `;
    
    showModal(modalContent, 'Minha Lealdade');
}

// Show favorites
function showFavorites() {
    console.log('❤️ Favorites button clicked');
    
    // Check if user is logged in
    if (!window.currentUser) {
        const modalContent = `
            <div class="favorites-modal">
                <h2>❤️ Favoritos</h2>
                <div class="empty-favorites">
                    <p>⚠️ Você precisa estar logado para ver favoritos</p>
                    <p>💡 Abra o app através do Telegram</p>
                </div>
            </div>
        `;
        showModal(modalContent, 'Favoritos');
        return;
    }
    
    // Get favorites from user system
    const favorites = window.currentUser.favorites || [];
    
    if (favorites.length === 0) {
        const modalContent = `
            <div class="favorites-modal">
                <h2>❤️ Favoritos</h2>
                <div class="empty-favorites">
                    <p>📝 Você ainda não tem cafés favoritos</p>
                    <p>💡 Clique no coração nos cafés para adicioná-los aos favoritos!</p>
                </div>
            </div>
        `;
        showModal(modalContent, 'Favoritos');
    } else {
        // Show favorites list
        const favoritesList = favorites.map(fav => `
            <div class="favorite-item">
                <h3>${fav.cafeName}</h3>
                <p>${fav.cafeCity}</p>
                <p>${fav.cafeDescription || ''}</p>
                <button class="remove-favorite" onclick="removeFavorite('${fav.cafeId}')">
                    ❌ Remover dos favoritos
                </button>
            </div>
        `).join('');
        
        const modalContent = `
            <div class="favorites-modal">
                <h2>❤️ Favoritos (${favorites.length})</h2>
                <div class="favorites-list">
                    ${favoritesList}
                </div>
            </div>
        `;
        showModal(modalContent, 'Favoritos');
    }
}

// Show modal with custom content
function showModal(content, title) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    
    if (modal && modalContent) {
        modalContent.innerHTML = content;
        modal.style.display = 'flex';
        console.log('🔧 Modal shown:', title);
    }
}

// Toggle favorite status for cafe
async function toggleFavorite(cafeId, cafeName, cafeCity, cafeDescription) {
    console.log('🔍 DEBUG: toggleFavorite called with:', { cafeId, cafeName, cafeCity, cafeDescription });
    console.log('🔍 DEBUG: window.currentUser:', window.currentUser);
    
    if (!window.currentUser) {
        console.log('⚠️ No user logged in');
        return;
    }
    
    const cafe = {
        id: cafeId,
        name: cafeName,
        city: cafeCity,
        description: cafeDescription
    };
    
    console.log('🔍 DEBUG: Checking if cafe is in favorites...');
    const isFavorite = isCafeInFavorites(cafeId);
    console.log('🔍 DEBUG: Is cafe in favorites?', isFavorite);
    
    if (isFavorite) {
        // Remove from favorites
        console.log('🔍 DEBUG: Removing from favorites...');
        await removeFavorite(cafeId);
        console.log('❌ Cafe removed from favorites');
    } else {
        // Add to favorites
        console.log('🔍 DEBUG: Adding to favorites...');
        await addToFavorites(cafe);
        console.log('❤️ Cafe added to favorites');
    }
    
    // Refresh the display to show updated favorite status
    console.log('🔍 DEBUG: Refreshing display...');
    displayCafes();
}

// Check if cafe is in favorites
function isCafeInFavorites(cafeId) {
    console.log('🔍 DEBUG: isCafeInFavorites called with cafeId:', cafeId);
    console.log('🔍 DEBUG: window.currentUser:', window.currentUser);
    console.log('🔍 DEBUG: window.currentUser.favorites:', window.currentUser?.favorites);
    
    if (!window.currentUser || !window.currentUser.favorites) {
        console.log('🔍 DEBUG: No user or no favorites, returning false');
        return false;
    }
    
    const result = window.currentUser.favorites.some(fav => fav.cafeId === cafeId);
    console.log('🔍 DEBUG: Result:', result);
    return result;
}

// Add cafe to favorites - now managed by user-system.js
// async function addToFavorites(cafe) { ... } // REMOVED - conflicts with user-system.js

// Remove cafe from favorites - now managed by user-system.js
// async function removeFavorite(cafeId) { ... } // REMOVED - conflicts with user-system.js

// Loyalty system - removed for now to focus on basic functionality
// async function addLoyaltyPoints(cafe, points = 50) { ... } // REMOVED
// function calculateLevel(points) { ... } // REMOVED

// User management system - now handled by user-system.js

// All user management functions moved to user-system.js

// initializeUserSystem function moved to user-system.js

// Get Telegram user data from URL
function getTelegramUserData() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tgWebAppData = hashParams.get('tgWebAppData');
    
    if (tgWebAppData) {
        try {
            const decodedData = decodeURIComponent(tgWebAppData);
            const userMatch = decodedData.match(/user=([^&]+)/);
            
            if (userMatch) {
                const userString = decodeURIComponent(userMatch[1]);
                const userData = JSON.parse(userString);
                return userData;
            }
        } catch (error) {
            console.error('❌ Error parsing Telegram user data:', error);
        }
    }
    
    return null;
}

// Format working hours for display
function formatWorkingHours(workingHours) {
    if (!workingHours) {
        return '<p class="cafe-hours">Horário não informado</p>';
    }
    
    const days = {
        monday: 'Seg',
        tuesday: 'Ter',
        wednesday: 'Qua',
        thursday: 'Qui',
        friday: 'Sex',
        saturday: 'Sáb',
        sunday: 'Dom'
    };
    
    let hoursHtml = '<div class="working-hours-list">';
    
    Object.entries(workingHours).forEach(([day, hours]) => {
        if (hours.open && hours.close) {
            hoursHtml += `
                <div class="working-hour-item">
                    <span class="day-name">${days[day]}:</span>
                    <span class="time-range">${hours.open} - ${hours.close}</span>
                </div>
            `;
        }
    });
    
    hoursHtml += '</div>';
    return hoursHtml;
}

// Apply loyalty for cafe
function applyLoyalty(cafeId, cafeName) {
    console.log('🎯 Applying loyalty for cafe:', cafeId, cafeName);
    
    if (!window.currentUser) {
        alert('⚠️ Você precisa estar logado para aplicar lealdade!\n💡 Abra o app através do Telegram');
        return;
    }
    
    // Show loyalty modal
    const modalContent = `
        <div class="loyalty-apply-modal">
            <h2>🎯 Aplicar Lealdade</h2>
            <div class="cafe-loyalty-info">
                <h3>${cafeName}</h3>
                <p>🏆 Seu nível: ${window.currentUser.loyalty?.level || 'Bronze'}</p>
                <p>⭐ Seus pontos: ${window.currentUser.loyalty?.totalPoints || 0}</p>
            </div>
            <div class="loyalty-actions">
                <button class="btn-checkin" onclick="checkInToCafe('${cafeId}', '${cafeName}')">
                    ✅ Fazer Check-in
                </button>
                <button class="btn-view-benefits" onclick="viewLoyaltyBenefits('${cafeId}')">
                    🎁 Ver Benefícios
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent, 'Aplicar Lealdade');
}

// Check in to cafe (placeholder for now)
function checkInToCafe(cafeId, cafeName) {
    console.log('✅ Check-in to cafe:', cafeId, cafeName);
    alert(`🎉 Check-in realizado com sucesso em ${cafeName}!\n⭐ +50 pontos de lealdade`);
    
    // TODO: Implement actual check-in logic
    // - Add points to user
    // - Update Firebase
    // - Show updated loyalty status
}

// View loyalty benefits (placeholder for now)
function viewLoyaltyBenefits(cafeId) {
    console.log('🎁 Viewing loyalty benefits for cafe:', cafeId);
    
    const modalContent = `
        <div class="loyalty-benefits-modal">
            <h2>🎁 Benefícios de Lealdade</h2>
            <div class="benefits-list">
                <div class="benefit-item">
                    <span class="benefit-level">🥉 Bronze (0-499 pts)</span>
                    <span class="benefit-desc">Acesso básico</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-level">🥈 Silver (500-999 pts)</span>
                    <span class="benefit-desc">Desconto 5%</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-level">🥇 Gold (1000-1999 pts)</span>
                    <span class="benefit-desc">Desconto 10% + café grátis</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-level">💎 Platinum (2000+ pts)</span>
                    <span class="benefit-desc">VIP + desconto 15%</span>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalContent, 'Benefícios de Lealdade');
}

