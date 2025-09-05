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
                                ${(() => {
                                    console.log('🔍 Cafe photo data:', {
                                        name: cafe.name,
                                        photoUrls: cafe.photoUrls,
                                        photoUrl: cafe.photoUrl,
                                        hasPhotoUrls: cafe.photoUrls && cafe.photoUrls.length > 0,
                                        hasPhotoUrl: !!cafe.photoUrl
                                    });
                                    
                                    if (cafe.photoUrls && cafe.photoUrls.length > 0) {
                                        return `<img src="${cafe.photoUrls[0]}" alt="${cafe.name}" class="cafe-thumbnail">`;
                                    } else if (cafe.photoUrl) {
                                        return `<img src="${cafe.photoUrl}" alt="${cafe.name}" class="cafe-thumbnail">`;
                                    } else {
                                        return `<div class="cafe-placeholder">☕</div>`;
                                    }
                                })()}
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
                    ${cafe.photoUrls && cafe.photoUrls.length > 0 ? 
                        createPhotoCarousel(cafe.photoUrls, cafe.name) :
                        cafe.photoUrl ? 
                            `<img src="${cafe.photoUrl}" alt="${cafe.name}" class="cafe-detail-photo">` : 
                            `<div class="coffee-icon">☕</div>`
                    }
                    <!-- Heart moved to top-left corner of image -->
                    <button class="favorite-btn-modal ${isCafeInFavorites(cafe.id) ? 'favorited' : ''}" 
                            onclick="toggleFavorite('${cafe.id}', '${cafe.name}', '${cafe.city}', '${cafe.description || ''}')">
                        ${isCafeInFavorites(cafe.id) ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
            
            <div class="cafe-detail-info">
                <h2 class="cafe-detail-name">${cafe.name}</h2>
                ${cafe.address ? `<p class="cafe-detail-address" onclick="copyAddress('${cafe.address}')">📍 ${cafe.address}</p>` : ''}
                <p class="cafe-detail-description">${cafe.description || 'Sem descrição'}</p>
                
                <!-- Working hours for all days -->
                <div class="cafe-detail-working-hours">
                    <h3>🕒 Horário de Funcionamento</h3>
                    ${formatWorkingHours(cafe.workingHours)}
                </div>
                
                <!-- Loyalty buttons -->
                <div class="loyalty-buttons">
                    <button class="loyalty-earn-btn" onclick="showEarnPoints('${cafe.id}', '${cafe.name}')">
                        ⬆️ Acumular Pontos
                    </button>
                    <button class="loyalty-spend-btn" onclick="showSpendPoints('${cafe.id}', '${cafe.name}')">
                        ⬇️ Gastar Pontos
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Initialize carousel if multiple photos
        if (cafe.photoUrls && cafe.photoUrls.length > 1) {
            setTimeout(() => {
                initializeCarouselTouch();
            }, 100);
        }
        
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
    
    // Check QR Code library loading
    setTimeout(() => {
        console.log('🔍 QR Code library check:');
        console.log('   - window.QRCode:', !!window.QRCode);
        console.log('   - QRCode.toCanvas:', !!(window.QRCode && window.QRCode.toCanvas));
        if (window.QRCode) {
            console.log('✅ QR Code library loaded successfully');
        } else {
            console.error('❌ QR Code library failed to load');
        }
    }, 1000);
    
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
    
    // Force center cafe photos after modal opens
    setTimeout(() => {
        const cafePhotos = document.querySelectorAll('.cafe-detail-photo');
        cafePhotos.forEach(photo => {
            photo.style.objectPosition = 'center center';
            photo.style.transform = 'translate(-50%, -50%)';
            photo.style.position = 'absolute';
            photo.style.top = '50%';
            photo.style.left = '50%';
        });
    }, 100);
});

// Close modal with escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ===== PHOTO CAROUSEL FUNCTIONALITY =====

// Create photo carousel HTML
function createPhotoCarousel(photoUrls, cafeName) {
    if (!photoUrls || photoUrls.length === 0) {
        return '<div class="coffee-icon">☕</div>';
    }
    
    if (photoUrls.length === 1) {
        return `<img src="${photoUrls[0]}" alt="${cafeName}" class="cafe-detail-photo">`;
    }
    
    const dots = photoUrls.map((_, index) => 
        `<span class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index}); return false;" onmousedown="return false;" ontouchstart="return false;"></span>`
    ).join('');
    
    return `
        <div class="photo-carousel" id="photoCarousel">
            <div class="carousel-container">
                ${photoUrls.map((url, index) => 
                    `<div class="carousel-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
                        <img src="${url}" alt="${cafeName}" class="cafe-detail-photo">
                    </div>`
                ).join('')}
            </div>
            <div class="carousel-dots">
                ${dots}
            </div>
            <div class="carousel-nav">
                <button class="carousel-prev" onclick="previousSlide(); return false;" onmousedown="return false;" ontouchstart="return false;">‹</button>
                <button class="carousel-next" onclick="nextSlide(); return false;" onmousedown="return false;" ontouchstart="return false;">›</button>
            </div>
        </div>
    `;
}

// Go to specific slide
function goToSlide(slideIndex) {
    const carousel = document.getElementById('photoCarousel');
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    
    // Remove active class from all slides and dots
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Add active class to current slide and dot
    if (slides[slideIndex]) {
        slides[slideIndex].classList.add('active');
    }
    if (dots[slideIndex]) {
        dots[slideIndex].classList.add('active');
    }
}

// Go to previous slide
function previousSlide() {
    const carousel = document.getElementById('photoCarousel');
    if (!carousel) return;
    
    const activeSlide = carousel.querySelector('.carousel-slide.active');
    const currentIndex = parseInt(activeSlide.dataset.slide);
    const totalSlides = carousel.querySelectorAll('.carousel-slide').length;
    
    const prevIndex = currentIndex === 0 ? totalSlides - 1 : currentIndex - 1;
    goToSlide(prevIndex);
}

// Go to next slide
function nextSlide() {
    const carousel = document.getElementById('photoCarousel');
    if (!carousel) return;
    
    const activeSlide = carousel.querySelector('.carousel-slide.active');
    const currentIndex = parseInt(activeSlide.dataset.slide);
    const totalSlides = carousel.querySelectorAll('.carousel-slide').length;
    
    const nextIndex = currentIndex === totalSlides - 1 ? 0 : currentIndex + 1;
    goToSlide(nextIndex);
}

// Add touch/swipe support for mobile
function initializeCarouselTouch() {
    const carousel = document.getElementById('photoCarousel');
    if (!carousel) return;
    
    let startX = 0;
    let endX = 0;
    let isSwipe = false;
    
    // Prevent default touch behaviors
    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwipe = false;
        // Prevent default to avoid selection
        e.preventDefault();
    }, { passive: false });
    
    carousel.addEventListener('touchmove', (e) => {
        // Prevent scrolling while swiping
        e.preventDefault();
    }, { passive: false });
    
    carousel.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
        // Prevent default to avoid selection
        e.preventDefault();
    }, { passive: false });
    
    // Prevent context menu on long press
    carousel.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Prevent text selection
    carousel.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });
    
    function handleSwipe() {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            isSwipe = true;
            if (diff > 0) {
                nextSlide(); // Swipe left - next slide
            } else {
                previousSlide(); // Swipe right - previous slide
            }
        }
    }
}

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

// Copy address to clipboard
async function copyAddress(address) {
    try {
        await navigator.clipboard.writeText(address);
        console.log('✅ Address copied:', address);
        
        // Show subtle feedback without alert
        const addressElement = event.target;
        const originalText = addressElement.textContent;
        addressElement.textContent = '✅ Copiado!';
        addressElement.style.color = '#28A745';
        
        // Restore original text after 2 seconds
        setTimeout(() => {
            addressElement.textContent = originalText;
            addressElement.style.color = '';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error copying address:', error);
        // Show error feedback
        const addressElement = event.target;
        const originalText = addressElement.textContent;
        addressElement.textContent = '❌ Erro ao copiar';
        addressElement.style.color = '#DC3545';
        
        setTimeout(() => {
            addressElement.textContent = originalText;
            addressElement.style.color = '';
        }, 2000);
    }
}

// Show earn points modal with QR code and 8-digit code
function showEarnPoints(cafeId, cafeName) {
    console.log('⬆️ Show earn points for cafe:', cafeId, cafeName);
    
    if (!window.currentUser) {
        alert('⚠️ Você precisa estar logado para acumular pontos!\n💡 Abra o app através do Telegram');
        return;
    }
    
    // Generate QR code data and 8-digit code
    const userId = window.currentUser.id;
    const timestamp = Date.now();
    const qrData = `${userId}:${cafeId}:${timestamp}`;
    const userCode = generateUserCode(userId, cafeId, timestamp);
    
    const modalContent = `
        <div class="earn-points-modal">
            <h2>⬆️ Acumular Pontos</h2>
            <div class="cafe-info">
                <h3>${cafeName}</h3>
                <p>📱 Mostre este código para o barista ou administrador</p>
            </div>
            
            <div class="qr-code-section">
                <h4>📱 Código QR:</h4>
                <div class="qr-code-container">
                    <canvas id="qrCanvas" width="200" height="200"></canvas>
                </div>
            </div>
            
            <div class="manual-code-section">
                <h4>🔢 Código de 8 dígitos:</h4>
                <div class="code-display">
                    <span class="user-code">${userCode}</span>
                    <button class="copy-code-btn" onclick="copyUserCode('${userCode}')">📋</button>
                </div>
            </div>
            
            <div class="instructions">
                <p>💡 O barista escaneará o código QR ou inserirá o código de 8 dígitos no aplicativo do café</p>
            </div>
        </div>
    `;
    
    showModal(modalContent, 'Acumular Pontos');
    
    // Generate QR code
    generateQRCode(qrData);
}

// Show spend points modal with QR code and 8-digit code
function showSpendPoints(cafeId, cafeName) {
    console.log('⬇️ Show spend points for cafe:', cafeId, cafeName);
    
    if (!window.currentUser) {
        alert('⚠️ Você precisa estar logado para gastar pontos!\n💡 Abra o app através do Telegram');
        return;
    }
    
    // Generate QR code data and 8-digit code
    const userId = window.currentUser.id;
    const timestamp = Date.now();
    const qrData = `${userId}:${cafeId}:${timestamp}`;
    const userCode = generateUserCode(userId, cafeId, timestamp);
    
    const modalContent = `
        <div class="spend-points-modal">
            <h2>⬇️ Gastar Pontos</h2>
            <div class="cafe-info">
                <h3>${cafeName}</h3>
                <p>📱 Mostre este código para o barista ou administrador</p>
            </div>
            
            <div class="qr-code-section">
                <h4>📱 Código QR:</h4>
                <div class="qr-code-container">
                    <canvas id="qrCanvasSpend" width="200" height="200"></canvas>
                </div>
            </div>
            
            <div class="manual-code-section">
                <h4>🔢 Código de 8 dígitos:</h4>
                <div class="code-display">
                    <span class="user-code">${userCode}</span>
                    <button class="copy-code-btn" onclick="copyUserCode('${userCode}')">📋</button>
                </div>
            </div>
            
            <div class="instructions">
                <p>💡 O barista escaneará o código QR ou inserirá o código de 8 dígitos no aplicativo do café</p>
                <p>💰 Após o escaneamento, será mostrado seu saldo de pontos e recalculado o valor do pedido</p>
            </div>
        </div>
    `;
    
    showModal(modalContent, 'Gastar Pontos');
    
    // Generate QR code
    generateQRCodeSpend(qrData);
}

// Generate 8-digit user code that matches QR code data
function generateUserCode(userId, cafeId, timestamp) {
    // Create the same data as QR code
    const qrData = `${userId}:${cafeId}:${timestamp}`;
    
    // Generate hash from QR data
    let hash = 0;
    for (let i = 0; i < qrData.length; i++) {
        const char = qrData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Guarantee 8 digits with leading zeros
    const code = Math.abs(hash).toString().padStart(8, '0').slice(-8);
    return code;
}

// NOTE: For Cafe TMA - function to recover data from 8-digit code
// This would need to be implemented in cafe-tma.js
function recoverDataFromUserCode(userCode, allPossibleData) {
    // This is a simplified version - in real implementation,
    // you'd need to store the mapping or use a different approach
    console.log('🔍 Recovering data from 8-digit code:', userCode);
    console.log('⚠️ This requires implementation in Cafe TMA');
    return null;
}

// Copy user code to clipboard
async function copyUserCode(code) {
    try {
        await navigator.clipboard.writeText(code);
        alert('📋 Código copiado: ' + code);
        console.log('✅ User code copied:', code);
    } catch (error) {
        console.error('❌ Error copying user code:', error);
        alert('❌ Erro ao copiar código');
    }
}

// Generate QR code for earn points using Google Charts API
function generateQRCode(data) {
    console.log('🔍 Starting QR code generation with Google Charts API...');
    console.log('🔍 Data to encode:', data);
    
    const canvas = document.getElementById('qrCanvas');
    console.log('🔍 Canvas element found:', !!canvas);
    
    if (canvas) {
        // Clear canvas first
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Use QR-Server API for QR code generation (free and reliable)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
        
        console.log('✅ Generating QR code with QR-Server API...');
        console.log('🔗 QR URL:', qrUrl);
        
        // Create image element to load QR code
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log('✅ QR code image loaded successfully');
            // Draw the QR code image on canvas
            ctx.drawImage(img, 0, 0, 200, 200);
        };
        
        img.onerror = function() {
            console.error('❌ QR-Server API failed, trying alternative...');
            // Try alternative API
            const altQrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(data)}&size=200`;
            console.log('🔄 Trying alternative QR API:', altQrUrl);
            
            const altImg = new Image();
            altImg.crossOrigin = 'anonymous';
            
            altImg.onload = function() {
                console.log('✅ Alternative QR code loaded successfully');
                ctx.drawImage(altImg, 0, 0, 200, 200);
            };
            
            altImg.onerror = function() {
                console.error('❌ All QR APIs failed');
                // Show error message
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, 200, 200);
                ctx.fillStyle = '#FF0000';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('QR CODE', 100, 90);
                ctx.fillText('ERROR', 100, 110);
            };
            
            altImg.src = altQrUrl;
        };
        
        img.src = qrUrl;
    } else {
        console.error('❌ Canvas element not found');
    }
}

// Generate QR code for spend points using Google Charts API
function generateQRCodeSpend(data) {
    console.log('🔍 Starting QR code generation (spend) with Google Charts API...');
    console.log('🔍 Data to encode:', data);
    
    const canvas = document.getElementById('qrCanvasSpend');
    console.log('🔍 Canvas element found:', !!canvas);
    
    if (canvas) {
        // Clear canvas first
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Use QR-Server API for QR code generation (free and reliable)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
        
        console.log('✅ Generating QR code with QR-Server API...');
        console.log('🔗 QR URL:', qrUrl);
        
        // Create image element to load QR code
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log('✅ QR code image loaded successfully');
            // Draw the QR code image on canvas
            ctx.drawImage(img, 0, 0, 200, 200);
        };
        
        img.onerror = function() {
            console.error('❌ QR-Server API failed, trying alternative...');
            // Try alternative API
            const altQrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(data)}&size=200`;
            console.log('🔄 Trying alternative QR API:', altQrUrl);
            
            const altImg = new Image();
            altImg.crossOrigin = 'anonymous';
            
            altImg.onload = function() {
                console.log('✅ Alternative QR code loaded successfully');
                ctx.drawImage(altImg, 0, 0, 200, 200);
            };
            
            altImg.onerror = function() {
                console.error('❌ All QR APIs failed');
                // Show error message
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, 200, 200);
                ctx.fillStyle = '#FF0000';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('QR CODE', 100, 90);
                ctx.fillText('ERROR', 100, 110);
            };
            
            altImg.src = altQrUrl;
        };
        
        img.src = qrUrl;
    } else {
        console.error('❌ Canvas element not found');
    }
}

// REMOVED: Fallback QR functions - we need REAL QR codes for MVP!

