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
            displayCafes();
            
            // Set up real-time listener for cafes
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
    
    if (!currentCity) {
        cafesList.innerHTML = `
            <div class="no-cafes">
                <p>Selecione uma cidade para ver os cafés</p>
                <div class="loading"></div>
            </div>
        `;
        return;
    }
    
    const cityCafes = cafesData.filter(cafe => cafe.city === currentCity);
    
    if (cityCafes.length === 0) {
        cafesList.innerHTML = `
            <div class="no-cafes">
                <p>Nenhum café encontrado em ${currentCity}</p>
            </div>
        `;
    } else {
        cafesList.innerHTML = cityCafes.map(cafe => `
            <div class="cafe-card" onclick="showCafeDetails('${cafe.id}')">
                <div class="cafe-info">
                    <h3>${cafe.name}</h3>
                    <p class="cafe-city">${cafe.city}</p>
                    <p class="cafe-description">${cafe.description || 'Sem descrição'}</p>
                    <p class="cafe-hours">${cafe.hours || 'Horário não informado'}</p>
                </div>
            </div>
        `).join('');
    }
    
    console.log('🔧 Cafes displayed for city:', currentCity, 'Count:', cityCafes.length);
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
        // Load saved city
        loadSavedCity();
        
        // Load cities and cafes from Firebase
        await loadCities();
        await loadCafes();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
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
    
    // Modal close
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
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
