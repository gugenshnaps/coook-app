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
        
        // Initialize photo upload functionality
        initializePhotoUpload();
        
        // Initialize edit form functionality
        initializeEditForm();
        
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
            const cityData = doc.data();
            cities.push({
                firebaseId: doc.id,  // Firebase document ID for deletion
                id: cityData.id,     // Readable ID (if exists)
                ...cityData
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
                const cityData = doc.data();
                cities.push({
                    firebaseId: doc.id,  // Firebase document ID for deletion
                    id: cityData.id,     // Readable ID (if exists)
                    ...cityData
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
        citiesList.innerHTML = '<div class="no-items">Нет зарегистрированных городов</div>';
        return;
    }
    
    citiesList.innerHTML = cities.map(city => {
        // Show readable ID if available, otherwise show "Firebase ID"
        const displayId = city.id || `Firebase: ${city.firebaseId || 'auto'}`;
        
        return `
            <div class="city-item">
                <div class="city-info">
                    <h3>${city.name}</h3>
                    <p>ID: ${displayId}</p>
                </div>
                <button onclick="deleteCity('${city.firebaseId || city.id}')" class="delete-btn">🗑️</button>
            </div>
        `;
    }).join('');
}

// Display cafes in the UI
function displayCafes() {
    const cafesList = document.getElementById('cafesList');
    
    if (cafes.length === 0) {
        cafesList.innerHTML = '<div class="no-items">Нет зарегистрированных кафе</div>';
        return;
    }
    
    cafesList.innerHTML = cafes.map(cafe => `
        <div class="cafe-item">
            <div class="cafe-info">
                <h3>${cafe.name}</h3>
                <p><strong>Login TMA:</strong> <code>${cafe.login || 'Não definido'}</code></p>
                <p><strong>Cidade:</strong> ${cafe.city}</p>
                <p><strong>Descrição:</strong> ${cafe.description || 'Sem descrição'}</p>
                <p><strong>Horário:</strong> ${cafe.hours || 'Não informado'}</p>
            </div>
            <div class="cafe-actions">
                <button onclick="editCafe('${cafe.id}')" class="edit-btn">✏️</button>
                <button onclick="viewCafePassword('${cafe.id}')" class="password-btn">🔑</button>
                <button onclick="deleteCafe('${cafe.id}')" class="delete-btn">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Populate city selector
function populateCitySelector() {
    const citySelect = document.getElementById('cafeCity');
    
    citySelect.innerHTML = '<option value="">Выберите город</option>' +
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
        
        // Create city object with readable ID
        const readableId = cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const cityData = {
            name: cityName,
            id: readableId
        };
        
        console.log('🔧 Adding city with data:', cityData);
        
        // Add to Firebase (Firebase создаст автоматический ID как primaryKey)
        const citiesRef = window.firebase.collection(window.firebase.db, 'cities');
        const docRef = await window.firebase.addDoc(citiesRef, cityData);
        
        console.log('✅ City added to Firebase with document ID:', docRef.id);
        console.log('✅ City data that was sent:', cityData);
        
        // Clear input
        cityNameInput.value = '';
        
        showSuccess('Cidade adicionada com sucesso!');
        console.log('City added successfully');
    } catch (error) {
        console.error('Error adding city:', error);
        showError('Erro ao adicionar cidade: ' + error.message);
    }
}

// Generate unique login for cafe
async function generateUniqueLogin(cafeName) {
    try {
        // Normalize cafe name for login (remove spaces, accents, special chars)
        let baseLogin = cafeName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]/g, '') // Remove special chars and spaces
            .substring(0, 20); // Limit length
        
        console.log('🔧 Generating login for cafe:', cafeName, '→ base:', baseLogin);
        
        // Get all existing cafes to check for duplicates
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafesSnapshot = await window.firebase.getDocs(cafesRef);
        
        const existingLogins = [];
        cafesSnapshot.forEach(doc => {
            const cafe = doc.data();
            if (cafe.login) {
                existingLogins.push(cafe.login);
            }
        });
        
        console.log('📋 Existing logins:', existingLogins);
        
        // Find next available number starting from 1
        let loginNumber = 1;
        let uniqueLogin = baseLogin + loginNumber;
        
        // Keep incrementing until we find a unique login
        while (existingLogins.includes(uniqueLogin)) {
            loginNumber++;
            uniqueLogin = baseLogin + loginNumber;
            console.log('🔄 Trying login number:', loginNumber, '→', uniqueLogin);
        }
        
        console.log('✅ Generated unique login:', uniqueLogin, 'for cafe:', cafeName);
        console.log('📊 Login stats:', {
            cafeName: cafeName,
            baseLogin: baseLogin,
            finalLogin: uniqueLogin,
            attemptNumber: loginNumber,
            existingCount: existingLogins.length
        });
        
        return uniqueLogin;
        
    } catch (error) {
        console.error('❌ Error generating unique login:', error);
        // Enhanced fallback with timestamp
        const timestamp = Date.now().toString().slice(-4);
        const fallbackLogin = cafeName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15) + timestamp;
        console.log('🆘 Using fallback login:', fallbackLogin);
        return fallbackLogin;
    }
}

// Add new cafe
async function addCafe() {
    const cafeName = document.getElementById('cafeName').value.trim();
    const cafeCity = document.getElementById('cafeCity').value.trim();
    const cafeAddress = document.getElementById('cafeAddress').value.trim();
    const cafeDescription = document.getElementById('cafeDescription').value.trim();
    const cafeCategories = document.getElementById('cafeCategories').value.trim();
    const cafeTelegram = document.getElementById('cafeTelegram').value.trim();
    
    // Get working hours for each day
    const workingHours = {
        monday: {
            open: document.getElementById('mondayOpen').value,
            close: document.getElementById('mondayClose').value
        },
        tuesday: {
            open: document.getElementById('tuesdayOpen').value,
            close: document.getElementById('tuesdayClose').value
        },
        wednesday: {
            open: document.getElementById('wednesdayOpen').value,
            close: document.getElementById('wednesdayClose').value
        },
        thursday: {
            open: document.getElementById('thursdayOpen').value,
            close: document.getElementById('thursdayClose').value
        },
        friday: {
            open: document.getElementById('fridayOpen').value,
            close: document.getElementById('fridayClose').value
        },
        saturday: {
            open: document.getElementById('saturdayOpen').value,
            close: document.getElementById('saturdayClose').value
        },
        sunday: {
            open: document.getElementById('sundayOpen').value,
            close: document.getElementById('sundayClose').value
        }
    };
    
    // Validate required fields
    if (!cafeName || !cafeCity || !cafeAddress) {
        alert('Пожалуйста, заполните все обязательные поля!');
        return;
    }
    
    // Validate working hours (at least one day should have hours)
    const hasWorkingHours = Object.values(workingHours).some(day => day.open && day.close);
    if (!hasWorkingHours) {
        alert('Пожалуйста, заполните хотя бы один день работы!');
        return;
    }
    
    try {
        // Get photo data (multiple photos)
        const photoUrls = await getMultiplePhotoBase64();
        
        // Generate password for cafe
        const cafePassword = generateSecurePassword();
        
        // Generate unique login for cafe
        const cafeLogin = await generateUniqueLogin(cafeName);
        
        const newCafe = {
            name: cafeName,
            city: cafeCity,
            address: cafeAddress,
            description: cafeDescription,
            categories: cafeCategories, // Categories of the establishment
            telegram: cafeTelegram, // Telegram contact
            login: cafeLogin, // Unique login for TMA access
            workingHours: workingHours,
            photoUrls: photoUrls, // Array of photos
            photoUrl: photoUrls.length > 0 ? photoUrls[0] : null, // First photo for backward compatibility
            createdAt: new Date()
        };
        
        // Add to Firebase
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafeDoc = await window.firebase.addDoc(cafesRef, newCafe);
        
        // Create password record for cafe
        const cafePasswordData = {
            cafeId: cafeDoc.id,
            cafeName: cafeName,
            passwordHash: await hashPassword(cafePassword),
            createdAt: new Date(),
            isActive: true
        };
        
        const passwordsRef = window.firebase.collection(window.firebase.db, 'cafe_passwords');
        await window.firebase.addDoc(passwordsRef, cafePasswordData);
        

        
        console.log('✅ Cafe added successfully:', newCafe);
        console.log('✅ Password created:', cafePassword);
        
        // Show success message with login credentials
        showCafeCredentials(cafeName, cafeLogin, cafePassword);
        
        // Clear form
        clearCafeForm();
        
        // Refresh cafes list
        loadCafes();
        
    } catch (error) {
        console.error('❌ Error adding cafe:', error);
        alert('Ошибка добавления кафе: ' + error.message);
    }
}

// Generate secure password for cafe
function generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Hash password using bcrypt-like approach (simplified for demo)
async function hashPassword(password) {
    // In production, use proper bcrypt or similar
    // For now, we'll use a simple hash
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_coook_app');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Show cafe credentials after creation
function showCafeCredentials(cafeName, login, password) {
    const modal = document.createElement('div');
    modal.className = 'credentials-modal';
    modal.innerHTML = `
        <div class="credentials-content">
            <h2>✅ Café "${cafeName}" criado com sucesso!</h2>
            
            <div class="credentials-info">
                <h3>🔐 DADOS PARA ENTRAR NO TMA:</h3>
                
                <div class="credential-row">
                    <strong>Login:</strong> <span class="credential-value">${login}</span>
                    <button onclick="copyToClipboard('${login}')" class="copy-btn">📋</button>
                </div>
                
                <div class="credential-row">
                    <strong>Senha:</strong> <span class="credential-value">${password}</span>
                    <button onclick="copyToClipboard('${password}')" class="copy-btn">📋</button>
                </div>
            </div>
            
            <div class="credentials-info">
                <h4>📝 Примеры логинов:</h4>
                <p><strong>Starbucks</strong> → <code>starbucks1</code></p>
                <p><strong>Café Central</strong> → <code>cafecentral1</code></p>
                <p><strong>McDonald's</strong> → <code>mcdonalds1</code></p>
            </div>
            
            <div class="credentials-warning">
                ⚠️ <strong>ATENÇÃO:</strong> A senha é mostrada apenas uma vez!
                <br>📋 Copie e entregue ao proprietário do café.
            </div>
            
            <button onclick="closeCredentialsModal()" class="close-btn">Fechar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary success message
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅';
        btn.style.background = '#28a745';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1000);
    });
}

// Close credentials modal
function closeCredentialsModal() {
    const modal = document.querySelector('.credentials-modal');
    if (modal) {
        modal.remove();
    }
}

// Delete city
async function deleteCity(cityId) {
    if (!confirm('Вы уверены, что хотите удалить этот город?')) {
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
    if (!confirm('Вы уверены, что хотите удалить это кафе?')) {
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

// Edit cafe - Load cafe data into edit form
async function editCafe(cafeId) {
    try {
        console.log('✏️ Editing cafe:', cafeId);
        
        // Find cafe data
        const cafe = cafes.find(c => c.id === cafeId);
        if (!cafe) {
            showError('Café não encontrado!');
            return;
        }
        
        // Load cafe data into edit form
        loadCafeDataIntoEditForm(cafe);
        
        // Show edit modal
        document.getElementById('editCafeModal').style.display = 'block';
        
        console.log('✅ Edit form loaded for cafe:', cafe.name);
        
    } catch (error) {
        console.error('❌ Error loading edit form:', error);
        showError('Erro ao carregar formulário de edição: ' + error.message);
    }
}

// Load cafe data into edit form
function loadCafeDataIntoEditForm(cafe) {
    // Basic info
    document.getElementById('editCafeName').value = cafe.name || '';
    document.getElementById('editCafeCity').value = cafe.city || '';
    document.getElementById('editCafeAddress').value = cafe.address || '';
    document.getElementById('editCafeDescription').value = cafe.description || '';
    
    // Working hours
    if (cafe.workingHours) {
        document.getElementById('editMondayOpen').value = cafe.workingHours.monday?.open || '';
        document.getElementById('editMondayClose').value = cafe.workingHours.monday?.close || '';
        document.getElementById('editTuesdayOpen').value = cafe.workingHours.tuesday?.open || '';
        document.getElementById('editTuesdayClose').value = cafe.workingHours.tuesday?.close || '';
        document.getElementById('editWednesdayOpen').value = cafe.workingHours.wednesday?.open || '';
        document.getElementById('editWednesdayClose').value = cafe.workingHours.wednesday?.close || '';
        document.getElementById('editThursdayOpen').value = cafe.workingHours.thursday?.open || '';
        document.getElementById('editThursdayClose').value = cafe.workingHours.thursday?.close || '';
        document.getElementById('editFridayOpen').value = cafe.workingHours.friday?.open || '';
        document.getElementById('editFridayClose').value = cafe.workingHours.friday?.close || '';
        document.getElementById('editSaturdayOpen').value = cafe.workingHours.saturday?.open || '';
        document.getElementById('editSaturdayClose').value = cafe.workingHours.saturday?.close || '';
        document.getElementById('editSundayOpen').value = cafe.workingHours.sunday?.open || '';
        document.getElementById('editSundayClose').value = cafe.workingHours.sunday?.close || '';
    }
    
    // Photo
    if (cafe.photoUrl) {
        document.getElementById('editPhotoUrl').checked = true;
        document.getElementById('editCafePhotoUrl').value = cafe.photoUrl;
        document.getElementById('editUrlInputSection').style.display = 'block';
        document.getElementById('editFileUploadSection').style.display = 'none';
        showEditPhotoPreview(cafe.photoUrl);
    } else {
        document.getElementById('editPhotoFile').checked = true;
        document.getElementById('editFileUploadSection').style.display = 'block';
        document.getElementById('editUrlInputSection').style.display = 'none';
    }
    
    // Store cafe ID for update
    document.getElementById('editCafeForm').dataset.cafeId = cafe.id;
    
    console.log('✅ Cafe data loaded into edit form');
}

// Show photo preview in edit form
function showEditPhotoPreview(photoUrl) {
    const preview = document.getElementById('editUrlPreview');
    preview.innerHTML = `
        <img src="${photoUrl}" alt="Foto do café" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
    `;
}

// Show success message
function showSuccess(message) {
    // Simple success message (can be enhanced with toast notifications)
    alert('✅ ' + message);
}

// Close edit cafe modal
function closeEditCafeModal() {
    document.getElementById('editCafeModal').style.display = 'none';
    
    // Clear form
    clearEditCafeForm();
    
    console.log('❌ Edit cafe modal closed');
}

// Clear edit cafe form
function clearEditCafeForm() {
    document.getElementById('editCafeForm').reset();
    document.getElementById('editPhotoPreview').innerHTML = '';
    document.getElementById('editUrlPreview').innerHTML = '';
    document.getElementById('editFileUploadSection').style.display = 'block';
    document.getElementById('editUrlInputSection').style.display = 'none';
    document.getElementById('editPhotoFile').checked = true;
    
    // Remove cafe ID
    delete document.getElementById('editCafeForm').dataset.cafeId;
    
    console.log('✅ Edit cafe form cleared');
}

// Show error message
function showError(message) {
    // Simple error message (can be enhanced with toast notifications)
    alert('❌ ' + message);
}

// Clear cafe form
function clearCafeForm() {
    // Clear basic fields
    const basicFields = ['cafeName', 'cafeCity', 'cafeAddress', 'cafeDescription', 'cafeCategories', 'cafeTelegram'];
    basicFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
    
    // Clear working hours
    const timeFields = [
        'mondayOpen', 'mondayClose', 'tuesdayOpen', 'tuesdayClose',
        'wednesdayOpen', 'wednesdayClose', 'thursdayOpen', 'thursdayClose',
        'fridayOpen', 'fridayClose', 'saturdayOpen', 'saturdayClose',
        'sundayOpen', 'sundayClose'
    ];
    timeFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
    
    // Clear photo inputs
    const photoInput = document.getElementById('cafePhotos');
    if (photoInput) photoInput.value = '';
    
    const photoUrlInput = document.getElementById('cafePhotoUrls');
    if (photoUrlInput) photoUrlInput.value = '';
    
    // Clear photo previews
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) photoPreview.innerHTML = '';
    
    const urlPreview = document.getElementById('urlPreview');
    if (urlPreview) urlPreview.innerHTML = '';
    
    // Reset to file mode
    const photoFileRadio = document.getElementById('photoFile');
    if (photoFileRadio) photoFileRadio.checked = true;
    
    const fileSection = document.getElementById('fileUploadSection');
    const urlSection = document.getElementById('urlInputSection');
    if (fileSection) fileSection.style.display = 'block';
    if (urlSection) urlSection.style.display = 'none';
    
    console.log('✅ Form cleared successfully');
}

// ===== PHOTO UPLOAD FUNCTIONALITY =====

// Initialize photo upload functionality
function initializePhotoUpload() {
    const photoInput = document.getElementById('cafePhotos');
    const photoPreview = document.getElementById('photoPreview');
    const photoUrlInput = document.getElementById('cafePhotoUrls');
    const urlPreview = document.getElementById('urlPreview');
    
    // Radio button change handlers
    const photoFileRadio = document.getElementById('photoFile');
    const photoUrlRadio = document.getElementById('photoUrl');
    
    if (photoFileRadio && photoUrlRadio) {
        photoFileRadio.addEventListener('change', () => switchPhotoMode('file'));
        photoUrlRadio.addEventListener('change', () => switchPhotoMode('url'));
    }
    
    // File upload handler
    if (photoInput && photoPreview) {
        photoInput.addEventListener('change', handleMultiplePhotoUpload);
    }
    
    // URL input handler
    if (photoUrlInput && urlPreview) {
        photoUrlInput.addEventListener('input', handleMultipleUrlInput);
    }
    
    console.log('📸 Multiple photo upload initialized');
}

// Switch between file upload and URL input
function switchPhotoMode(mode) {
    const fileSection = document.getElementById('fileUploadSection');
    const urlSection = document.getElementById('urlInputSection');
    
    if (mode === 'file') {
        fileSection.style.display = 'block';
        urlSection.style.display = 'none';
        // Clear URL input
        document.getElementById('cafePhotoUrls').value = '';
        document.getElementById('urlPreview').innerHTML = '';
    } else {
        fileSection.style.display = 'none';
        urlSection.style.display = 'block';
        // Clear file input
        document.getElementById('cafePhotos').value = '';
        document.getElementById('photoPreview').innerHTML = '';
    }
    
    console.log('📸 Switched to photo mode:', mode);
}

// Handle multiple photo upload and preview with compression
function handleMultiplePhotoUpload(event) {
    const files = Array.from(event.target.files);
    const photoPreview = document.getElementById('photoPreview');
    
    if (files.length === 0) {
        photoPreview.innerHTML = '';
        return;
    }
    
    console.log(`📸 Processing ${files.length} photos...`);
    
    // Clear previous previews
    photoPreview.innerHTML = '';
    
    // Process each file
    files.forEach((file, index) => {
        if (file && file.type.startsWith('image/')) {
            processPhotoFile(file, photoPreview, index);
        }
    });
}

// Handle multiple URL input
function handleMultipleUrlInput(event) {
    const urls = event.target.value.split('\n').filter(url => url.trim());
    const urlPreview = document.getElementById('urlPreview');
    
    if (urls.length === 0) {
        urlPreview.innerHTML = '';
        return;
    }
    
    console.log(`🔗 Processing ${urls.length} URLs...`);
    
    // Clear previous previews
    urlPreview.innerHTML = '';
    
    // Process each URL
    urls.forEach((url, index) => {
        if (url.trim()) {
            processPhotoUrl(url.trim(), urlPreview, index);
        }
    });
}

// Process individual photo file
function processPhotoFile(file, container, index) {
    // Always compress for multiple photos to avoid Firebase size limit
    console.log(`📸 Compressing photo ${index + 1}...`);
    compressImage(file, 200 * 1024, (compressedDataUrl) => { // Reduced target size
        displayPhotoPreview(compressedDataUrl, container, index, file.name);
    });
}

// Process individual photo URL
function processPhotoUrl(url, container, index) {
    displayPhotoPreview(url, container, index, `URL ${index + 1}`);
}

// Display photo preview
function displayPhotoPreview(src, container, index, name) {
    const photoDiv = document.createElement('div');
    photoDiv.className = 'photo-preview-item';
    photoDiv.innerHTML = `
        <img src="${src}" alt="${name}" class="photo-preview-img">
        <div class="photo-preview-info">
            <span class="photo-preview-name">${name}</span>
            <button type="button" onclick="removePhotoPreview(this)" class="remove-photo-btn">×</button>
        </div>
    `;
    container.appendChild(photoDiv);
}

// Remove photo preview
function removePhotoPreview(button) {
    button.closest('.photo-preview-item').remove();
}

// Handle single photo upload (legacy)
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    const photoPreview = document.getElementById('photoPreview');
    
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите только файлы изображений!');
            return;
        }
        
        // Validate file size (max 500KB)
        if (file.size > 500 * 1024) {
            alert('Изображение должно быть менее 500KB! Будет автоматически сжато.');
        }
        
        // Compress and preview image
        compressImage(file, 500 * 1024, photoPreview);
        
        console.log('📸 Photo upload started:', file.name, 'Size:', file.size);
    }
}

// Compress image to target size
function compressImage(file, targetSize, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Calculate new dimensions (maintain aspect ratio) - more aggressive compression
        let { width, height } = img;
        const maxDimension = 400; // Reduced from 800 to 400
        
        if (width > height) {
            if (width > maxDimension) {
                height = (height * maxDimension) / width;
                width = maxDimension;
            }
        } else {
            if (height > maxDimension) {
                width = (width * maxDimension) / height;
                height = maxDimension;
            }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels - more aggressive compression
        let quality = 0.6; // Reduced from 0.8 to 0.6
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until we meet target size
        while (dataUrl.length > targetSize * 1.2 && quality > 0.05) { // More aggressive
            quality -= 0.05;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        // Call callback with compressed data
        if (callback) {
            callback(dataUrl);
        }
        
        console.log('📸 Image compressed:', {
            original: file.size,
            compressed: dataUrl.length,
            quality: quality,
            dimensions: `${width}x${height}`
        });
    };
    
    img.src = URL.createObjectURL(file);
}

// Validate URL format and accessibility
function validateImageUrl(url) {
    return new Promise((resolve) => {
        // Basic URL format validation
        try {
            new URL(url);
        } catch {
            resolve({ valid: false, error: 'Formato de URL inválido' });
            return;
        }
        
        // Check if image loads
        const img = new Image();
        img.onload = function() {
            resolve({ valid: true, url: url });
        };
        img.onerror = function() {
            resolve({ valid: false, error: 'Imagem não pode ser carregada' });
        };
        img.src = url;
        
        // Timeout after 10 seconds
        setTimeout(() => {
            resolve({ valid: false, error: 'Timeout ao carregar imagem' });
        }, 10000);
    });
}

// Handle URL input and preview
function handleUrlInput(event) {
    const url = event.target.value.trim();
    const urlPreview = document.getElementById('urlPreview');
    
    if (url) {
        urlPreview.innerHTML = `
            <img src="${url}" alt="Preview da foto">
            <button type="button" class="remove-photo" onclick="removePhoto()">❌ Remover</button>
        `;
        urlPreview.classList.add('has-image');
    } else {
        urlPreview.innerHTML = '';
        urlPreview.classList.remove('has-image');
    }
    
    console.log('📸 URL preview updated:', url);
}

// Remove photo
function removePhoto() {
    const photoInput = document.getElementById('cafePhoto');
    const photoPreview = document.getElementById('photoPreview');
    const photoUrlInput = document.getElementById('cafePhotoUrl');
    const urlPreview = document.getElementById('urlPreview');
    
    photoInput.value = '';
    photoPreview.innerHTML = '';
    photoPreview.classList.remove('has-image');
    
    photoUrlInput.value = '';
    urlPreview.innerHTML = '';
    urlPreview.classList.remove('has-image');
    
    console.log('📸 Photo removed');
}

// Get compressed photo data from preview
function getPhotoBase64() {
    const photoPreview = document.getElementById('photoPreview');
    const img = photoPreview.querySelector('img');
    
    if (!img) return null;
    
    // Return the compressed data URL from preview
    return img.src;
}

// Get multiple photos as base64 array
function getMultiplePhotoBase64() {
    const photoPreview = document.getElementById('photoPreview');
    const urlPreview = document.getElementById('urlPreview');
    
    // Check if we're in file mode or URL mode
    const photoFileRadio = document.getElementById('photoFile');
    const isFileMode = photoFileRadio && photoFileRadio.checked;
    
    if (isFileMode) {
        // Get from file preview
        const photoItems = photoPreview.querySelectorAll('.photo-preview-item');
        const photoUrls = [];
        
        photoItems.forEach(item => {
            const img = item.querySelector('.photo-preview-img');
            if (img && img.src) {
                photoUrls.push(img.src);
            }
        });
        
        return photoUrls;
    } else {
        // Get from URL preview
        const photoItems = urlPreview.querySelectorAll('.photo-preview-item');
        const photoUrls = [];
        
        photoItems.forEach(item => {
            const img = item.querySelector('.photo-preview-img');
            if (img && img.src) {
                photoUrls.push(img.src);
            }
        });
        
        return photoUrls;
    }
}

// Compress image to base64 for edit form
async function compressImageToBase64(file) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Calculate new dimensions (maintain aspect ratio)
            let { width, height } = img;
            const maxDimension = 800;
            
            if (width > height) {
                if (width > maxDimension) {
                    height = (height * maxDimension) / width;
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = (width * maxDimension) / height;
                    height = maxDimension;
                }
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Try different quality levels
            let quality = 0.8;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // Reduce quality until we meet target size (500KB)
            const targetSize = 500 * 1024;
            while (dataUrl.length > targetSize * 1.5 && quality > 0.1) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            
            resolve(dataUrl);
        };
        
        img.onerror = function() {
            resolve(null);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Initialize edit form functionality
function initializeEditForm() {
    const editForm = document.getElementById('editCafeForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditCafeSubmit);
    }
    
    // Photo type radio buttons
    const editPhotoFile = document.getElementById('editPhotoFile');
    const editPhotoUrl = document.getElementById('editPhotoUrl');
    
    if (editPhotoFile && editPhotoUrl) {
        editPhotoFile.addEventListener('change', () => switchEditPhotoMode('file'));
        editPhotoUrl.addEventListener('change', () => switchEditPhotoMode('url'));
    }
    
    // File upload handler for edit form
    const editCafePhoto = document.getElementById('editCafePhoto');
    if (editCafePhoto) {
        editCafePhoto.addEventListener('change', handleEditPhotoUpload);
    }
    
    // URL input handler for edit form
    const editCafePhotoUrl = document.getElementById('editCafePhotoUrl');
    if (editCafePhotoUrl) {
        editCafePhotoUrl.addEventListener('input', handleEditUrlInput);
    }
    
    console.log('✅ Edit form functionality initialized');
}

// Handle edit cafe form submission
async function handleEditCafeSubmit(event) {
    event.preventDefault();
    
    try {
        const cafeId = event.target.dataset.cafeId;
        if (!cafeId) {
            showError('ID do café não encontrado!');
            return;
        }
        
        console.log('💾 Updating cafe:', cafeId);
        
        // Collect form data
        const updatedCafe = await collectEditFormData();
        
        // Update cafe in Firebase
        await updateCafeInFirebase(cafeId, updatedCafe);
        
        // Show success and close modal
        showSuccess('Café atualizado com sucesso!');
        closeEditCafeModal();
        
        // Refresh cafes list
        loadCafes();
        
    } catch (error) {
        console.error('❌ Error updating cafe:', error);
        showError('Erro ao atualizar café: ' + error.message);
    }
}

// Collect data from edit form
async function collectEditFormData() {
    const updatedCafe = {
        name: document.getElementById('editCafeName').value.trim(),
        city: document.getElementById('editCafeCity').value.trim(),
        address: document.getElementById('editCafeAddress').value.trim(),
        description: document.getElementById('editCafeDescription').value.trim(),
        workingHours: {
            monday: {
                open: document.getElementById('editMondayOpen').value,
                close: document.getElementById('editMondayClose').value
            },
            tuesday: {
                open: document.getElementById('editTuesdayOpen').value,
                close: document.getElementById('editTuesdayClose').value
            },
            wednesday: {
                open: document.getElementById('editWednesdayOpen').value,
                close: document.getElementById('editWednesdayClose').value
            },
            thursday: {
                open: document.getElementById('editThursdayOpen').value,
                close: document.getElementById('editThursdayClose').value
            },
            friday: {
                open: document.getElementById('editFridayOpen').value,
                close: document.getElementById('editFridayClose').value
            },
            saturday: {
                open: document.getElementById('editSaturdayOpen').value,
                close: document.getElementById('editSaturdayClose').value
            },
            sunday: {
                open: document.getElementById('editSundayOpen').value,
                close: document.getElementById('editSundayClose').value
            }
        }
    };
    
    // Handle photo
    if (document.getElementById('editPhotoUrl').checked) {
        updatedCafe.photoUrl = document.getElementById('editCafePhotoUrl').value.trim();
    } else if (document.getElementById('editCafePhoto').files.length > 0) {
        // Handle file upload (similar to addCafe)
        const file = document.getElementById('editCafePhoto').files[0];
        if (file) {
            // Compress and get base64 data
            const photoUrl = await compressImageToBase64(file);
            if (photoUrl) {
                updatedCafe.photoUrl = photoUrl;
            }
        }
    }
    
    return updatedCafe;
}

// Update cafe in Firebase
async function updateCafeInFirebase(cafeId, updatedCafe) {
    try {
        const cafeRef = window.firebase.doc(window.firebase.db, 'cafes', cafeId);
        await window.firebase.updateDoc(cafeRef, updatedCafe);
        
        console.log('✅ Cafe updated in Firebase:', cafeId);
        
    } catch (error) {
        console.error('❌ Error updating cafe in Firebase:', error);
        throw error;
    }
}

// Switch edit photo mode
function switchEditPhotoMode(mode) {
    const fileSection = document.getElementById('editFileUploadSection');
    const urlSection = document.getElementById('editUrlInputSection');
    
    if (mode === 'file') {
        fileSection.style.display = 'block';
        urlSection.style.display = 'none';
        document.getElementById('editCafePhotoUrl').value = '';
        document.getElementById('editUrlPreview').innerHTML = '';
    } else {
        fileSection.style.display = 'none';
        urlSection.style.display = 'block';
        document.getElementById('editCafePhoto').value = '';
        document.getElementById('editPhotoPreview').innerHTML = '';
    }
    
    console.log('📸 Switched edit photo mode to:', mode);
}

// Handle edit photo upload
async function handleEditPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const photoUrl = await compressImageToBase64(file);
        if (photoUrl) {
            showEditPhotoPreview(photoUrl);
        }
    } catch (error) {
        console.error('❌ Error processing edit photo:', error);
        showError('Erro ao processar foto: ' + error.message);
    }
}

// Handle edit URL input
function handleEditUrlInput(event) {
    const url = event.target.value.trim();
    if (url) {
        showEditPhotoPreview(url);
    } else {
        document.getElementById('editUrlPreview').innerHTML = '';
    }
}

// View cafe password
async function viewCafePassword(cafeId) {
    try {
        console.log('🔑 Viewing password for cafe:', cafeId);
        
        // Find cafe data
        const cafe = cafes.find(c => c.id === cafeId);
        if (!cafe) {
            showError('Café não encontrado!');
            return;
        }
        
        // Load password data from Firebase
        const passwordData = await loadCafePassword(cafeId);
        if (!passwordData) {
            showError('Senha não encontrada para este café!');
            return;
        }
        
        // Display cafe info and password
        document.getElementById('passwordCafeName').textContent = cafe.name;
        document.getElementById('passwordCafeCity').textContent = cafe.city;
        document.getElementById('passwordCafeLogin').textContent = passwordData.login;
        document.getElementById('passwordCafePassword').textContent = passwordData.password;
        
        // Show password modal
        document.getElementById('viewPasswordModal').style.display = 'block';
        
        console.log('✅ Password modal loaded for cafe:', cafe.name);
        
    } catch (error) {
        console.error('❌ Error loading password:', error);
        showError('Erro ao carregar senha: ' + error.message);
    }
}

// Load cafe password from Firebase
async function loadCafePassword(cafeId) {
    try {
        const passwordsRef = window.firebase.collection(window.firebase.db, 'cafe_passwords');
        const passwordQuery = window.firebase.query(passwordsRef, window.firebase.where('cafeId', '==', cafeId));
        const passwordSnapshot = await window.firebase.getDocs(passwordQuery);
        
        if (passwordSnapshot.empty) {
            console.log('❌ No password found for cafe:', cafeId);
            return null;
        }
        
        const passwordDoc = passwordSnapshot.docs[0];
        const passwordData = passwordDoc.data();
        
        // Return login and password
        return {
            login: passwordData.cafeName || 'N/A',
            password: passwordData.password || 'N/A'
        };
        
    } catch (error) {
        console.error('❌ Error loading password from Firebase:', error);
        throw error;
    }
}

// Close view password modal
function closeViewPasswordModal() {
    document.getElementById('viewPasswordModal').style.display = 'none';
    console.log('❌ Password modal closed');
}

// Copy password to clipboard
async function copyPasswordToClipboard() {
    try {
        const password = document.getElementById('passwordCafePassword').textContent;
        
        if (password && password !== 'N/A') {
            await navigator.clipboard.writeText(password);
            showSuccess('Senha copiada para a área de transferência!');
            console.log('✅ Password copied to clipboard');
        } else {
            showError('Nenhuma senha para copiar!');
        }
        
    } catch (error) {
        console.error('❌ Error copying password:', error);
        showError('Erro ao copiar senha: ' + error.message);
    }
}

// Fix duplicate logins in existing cafes
async function fixDuplicateLogins() {
    try {
        console.log('🔧 Starting fix for duplicate logins...');
        
        // Get all cafes
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafesSnapshot = await window.firebase.getDocs(cafesRef);
        
        // Group cafes by login to find duplicates
        const loginGroups = {};
        const cafesToUpdate = [];
        
        cafesSnapshot.forEach(doc => {
            const cafe = { id: doc.id, ref: doc.ref, ...doc.data() };
            
            if (cafe.login) {
                if (!loginGroups[cafe.login]) {
                    loginGroups[cafe.login] = [];
                }
                loginGroups[cafe.login].push(cafe);
            }
        });
        
        // Find duplicates and mark for update (keep first one, regenerate others)
        let fixedCount = 0;
        for (const [login, cafes] of Object.entries(loginGroups)) {
            if (cafes.length > 1) {
                console.log(`🚨 Found ${cafes.length} cafes with duplicate login "${login}":`, cafes.map(c => c.name));
                
                // Keep the first one, regenerate logins for the rest
                for (let i = 1; i < cafes.length; i++) {
                    const cafe = cafes[i];
                    const newLogin = await generateUniqueLogin(cafe.name);
                    
                    await window.firebase.updateDoc(cafe.ref, {
                        login: newLogin
                    });
                    
                    console.log(`✅ Fixed: "${cafe.name}" → old: "${login}" → new: "${newLogin}"`);
                    fixedCount++;
                }
            }
        }
        
        console.log('🎉 Duplicate fix completed!');
        console.log('📊 Results:', {
            duplicateGroups: Object.values(loginGroups).filter(g => g.length > 1).length,
            cafesFixed: fixedCount
        });
        
        alert(`✅ Исправление дубликатов завершено!\n\n📊 Результаты:\n• ${fixedCount} кафе исправлено\n• Дубликаты успешно устранены`);
        
        // Refresh cafes list
        await loadCafes();
        displayCafes();
        
    } catch (error) {
        console.error('❌ Fix duplicates error:', error);
        alert('❌ Ошибка исправления: ' + error.message);
    }
}

// Migrate existing cafes to add login field
async function migrateCafesToAddLogins() {
    try {
        console.log('🔧 Starting migration to add logins to existing cafes...');
        
        // Get all cafes that don't have login field
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafesSnapshot = await window.firebase.getDocs(cafesRef);
        
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const cafeDoc of cafesSnapshot.docs) {
            const cafe = cafeDoc.data();
            
            // Skip if cafe already has a login
            if (cafe.login) {
                console.log('⏭️ Skipping cafe with existing login:', cafe.name, '→', cafe.login);
                skippedCount++;
                continue;
            }
            
            // Generate unique login for this cafe
            const uniqueLogin = await generateUniqueLogin(cafe.name);
            
            // Update the cafe document
            await window.firebase.updateDoc(cafeDoc.ref, {
                login: uniqueLogin
            });
            
            console.log('✅ Migrated:', cafe.name, '→', uniqueLogin);
            migratedCount++;
        }
        
        console.log('🎉 Migration completed!');
        console.log('📊 Results:', {
            migrated: migratedCount,
            skipped: skippedCount,
            total: cafesSnapshot.docs.length
        });
        
        alert(`✅ Миграция завершена!\n\n📊 Результаты:\n• ${migratedCount} кафе мигрировано\n• ${skippedCount} кафе уже имели логин\n• ${cafesSnapshot.docs.length} всего кафе`);
        
        // Refresh cafes list to show new logins
        await loadCafes();
        displayCafes();
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        alert('❌ Ошибка миграции: ' + error.message);
    }
}

// Make migration and fix functions globally available
window.migrateCafesToAddLogins = migrateCafesToAddLogins;
window.fixDuplicateLogins = fixDuplicateLogins;

// Start initialization when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin panel DOM loaded, waiting for Firebase...');
    waitForFirebase();
});
