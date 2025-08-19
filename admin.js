// Firebase Admin Panel for Coook App
let cities = [];
let cafes = [];

// Wait for Firebase to initialize
function waitForFirebase() {
    if (window.firebase && window.firebase.db) {
        console.log('Firebase ready, initializing admin panel...');
        initializeAdminPanel();
    } else {
        console.log('Waiting for Firebase...');
        setTimeout(waitForFirebase, 100);
    }
}

// Initialize admin panel
async function initializeAdminPanel() {
    try {
        console.log('Initializing admin panel...');
        
        // Load cities and cafes from Firebase
        await loadCities();
        await loadCafes();
        
        // Set up real-time listeners
        setupCitiesListener();
        setupCafesListener();
        
        // Populate city selector
        populateCitySelector();
        
        console.log('Admin panel initialized successfully!');
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showError('Erro ao inicializar painel admin: ' + error.message);
    }
}

// Load cities from Firebase
async function loadCities() {
    try {
        console.log('Loading cities from Firebase...');
        const citiesRef = window.firebase.collection(window.firebase.db, 'cities');
        const citiesSnapshot = await window.firebase.getDocs(citiesRef);
        
        cities = [];
        citiesSnapshot.forEach((doc) => {
            cities.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Cities loaded:', cities);
        displayCities();
    } catch (error) {
        console.error('Error loading cities:', error);
        showError('Erro ao carregar cidades: ' + error.message);
    }
}

// Load cafes from Firebase
async function loadCafes() {
    try {
        console.log('Loading cafes from Firebase...');
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafesSnapshot = await window.firebase.getDocs(cafesRef);
        
        cafes = [];
        cafesSnapshot.forEach((doc) => {
            cafes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Cafes loaded:', cafes);
        displayCafes();
    } catch (error) {
        console.error('Error loading cafes:', error);
        showError('Erro ao carregar cafés: ' + error.message);
    }
}

// Set up real-time listener for cities
function setupCitiesListener() {
    try {
        console.log('Setting up cities listener...');
        const citiesRef = window.firebase.collection(window.firebase.db, 'cities');
        const citiesQuery = window.firebase.query(citiesRef, window.firebase.orderBy('name'));
        
        window.firebase.onSnapshot(citiesQuery, (snapshot) => {
            console.log('Cities updated in real-time');
            cities = [];
            snapshot.forEach((doc) => {
                cities.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            displayCities();
            populateCitySelector();
        });
    } catch (error) {
        console.error('Error setting up cities listener:', error);
    }
}

// Set up real-time listener for cafes
function setupCafesListener() {
    try {
        console.log('Setting up cafes listener...');
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafesQuery = window.firebase.query(cafesRef, window.firebase.orderBy('name'));
        
        window.firebase.onSnapshot(cafesQuery, (snapshot) => {
            console.log('Cafes updated in real-time');
            cafes = [];
            snapshot.forEach((doc) => {
                cafes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            displayCafes();
        });
    } catch (error) {
        console.error('Error setting up cafes listener:', error);
    }
}

// Display cities in the UI
function displayCities() {
    const citiesList = document.getElementById('citiesList');
    
    if (cities.length === 0) {
        citiesList.innerHTML = '<div class="no-items">Nenhuma cidade cadastrada</div>';
        return;
    }
    
    citiesList.innerHTML = cities.map(city => `
        <div class="city-item">
            <div class="city-info">
                <h3>${city.name}</h3>
                <p>ID: ${city.id}</p>
            </div>
            <button onclick="deleteCity('${city.id}')" class="delete-btn">🗑️</button>
        </div>
    `).join('');
}

// Display cafes in the UI
function displayCafes() {
    const cafesList = document.getElementById('cafesList');
    
    if (cafes.length === 0) {
        cafesList.innerHTML = '<div class="no-items">Nenhum café cadastrado</div>';
        return;
    }
    
    cafesList.innerHTML = cafes.map(cafe => `
        <div class="cafe-item">
            <div class="cafe-info">
                <h3>${cafe.name}</h3>
                <p><strong>Cidade:</strong> ${cafe.city}</p>
                <p><strong>Descrição:</strong> ${cafe.description || 'Sem descrição'}</p>
                <p><strong>Horário:</strong> ${cafe.hours || 'Não informado'}</p>
            </div>
            <div class="cafe-actions">
                <button onclick="editCafe('${cafe.id}')" class="edit-btn">✏️</button>
                <button onclick="deleteCafe('${cafe.id}')" class="delete-btn">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Populate city selector
function populateCitySelector() {
    const citySelect = document.getElementById('cafeCity');
    
    citySelect.innerHTML = '<option value="">Selecione uma cidade</option>' +
        cities.map(city => `<option value="${city.name}">${city.name}</option>`).join('');
}

// Add new city
async function addCity() {
    const cityNameInput = document.getElementById('cityName');
    const cityName = cityNameInput.value.trim();
    
    if (!cityName) {
        showError('Por favor, insira o nome da cidade');
        return;
    }
    
    try {
        console.log('Adding city:', cityName);
        
        // Check if city already exists
        if (cities.some(city => city.name.toLowerCase() === cityName.toLowerCase())) {
            showError('Cidade já existe!');
            return;
        }
        
        // Create city object
        const cityData = {
            name: cityName,
            id: cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        };
        
        // Add to Firebase
        const citiesRef = window.firebase.collection(window.firebase.db, 'cities');
        await window.firebase.addDoc(citiesRef, cityData);
        
        // Clear input
        cityNameInput.value = '';
        
        showSuccess('Cidade adicionada com sucesso!');
        console.log('City added successfully');
    } catch (error) {
        console.error('Error adding city:', error);
        showError('Erro ao adicionar cidade: ' + error.message);
    }
}

// Add new cafe
async function addCafe() {
    const cafeNameInput = document.getElementById('cafeName');
    const cafeCitySelect = document.getElementById('cafeCity');
    const cafeDescriptionInput = document.getElementById('cafeDescription');
    
    const cafeName = cafeNameInput.value.trim();
    const cafeCity = cafeCitySelect.value;
    const cafeDescription = cafeDescriptionInput.value.trim();
    
    if (!cafeName || !cafeCity) {
        showError('Por favor, preencha nome e cidade do café');
        return;
    }
    
    try {
        console.log('Adding cafe:', { name: cafeName, city: cafeCity, description: cafeDescription });
        
        // Create cafe object
        const cafeData = {
            name: cafeName,
            city: cafeCity,
            description: cafeDescription,
            hours: '8:00 - 22:00' // Default hours
        };
        
        // Add to Firebase
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        await window.firebase.addDoc(cafesRef, cafeData);
        
        // Clear inputs
        cafeNameInput.value = '';
        cafeCitySelect.value = '';
        cafeDescriptionInput.value = '';
        
        showSuccess('Café adicionado com sucesso!');
        console.log('Cafe added successfully');
    } catch (error) {
        console.error('Error adding cafe:', error);
        showError('Erro ao adicionar café: ' + error.message);
    }
}

// Delete city
async function deleteCity(cityId) {
    if (!confirm('Tem certeza que deseja excluir esta cidade?')) {
        return;
    }
    
    try {
        console.log('Deleting city:', cityId);
        
        // Delete from Firebase
        const cityRef = window.firebase.doc(window.firebase.db, 'cities', cityId);
        await window.firebase.deleteDoc(cityRef);
        
        showSuccess('Cidade excluída com sucesso!');
        console.log('City deleted successfully');
    } catch (error) {
        console.error('Error deleting city:', error);
        showError('Erro ao excluir cidade: ' + error.message);
    }
}

// Delete cafe
async function deleteCafe(cafeId) {
    if (!confirm('Tem certeza que deseja excluir este café?')) {
        return;
    }
    
    try {
        console.log('Deleting cafe:', cafeId);
        
        // Delete from Firebase
        const cafeRef = window.firebase.doc(window.firebase.db, 'cafes', cafeId);
        await window.firebase.deleteDoc(cafeRef);
        
        showSuccess('Café excluído com sucesso!');
        console.log('Cafe deleted successfully');
    } catch (error) {
        console.error('Error deleting cafe:', error);
        showError('Erro ao excluir café: ' + error.message);
    }
}

// Edit cafe (placeholder for future implementation)
function editCafe(cafeId) {
    showError('Edição de cafés será implementada em breve!');
}

// Show success message
function showSuccess(message) {
    // Simple success message (can be enhanced with toast notifications)
    alert('✅ ' + message);
}

// Show error message
function showError(message) {
    // Simple error message (can be enhanced with toast notifications)
    alert('❌ ' + message);
}

// Start initialization when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin panel DOM loaded, waiting for Firebase...');
    waitForFirebase();
});
