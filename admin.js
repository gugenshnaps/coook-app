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
    const cafeName = document.getElementById('cafeName').value.trim();
    const cafeCity = document.getElementById('cafeCity').value.trim();
    const cafeAddress = document.getElementById('cafeAddress').value.trim();
    const cafeDescription = document.getElementById('cafeDescription').value.trim();
    
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
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }
    
    // Validate working hours (at least one day should have hours)
    const hasWorkingHours = Object.values(workingHours).some(day => day.open && day.close);
    if (!hasWorkingHours) {
        alert('Por favor, preencha pelo menos um dia de funcionamento!');
        return;
    }
    
    try {
        // Get photo data
        const photoUrl = await getPhotoBase64();
        


        // Generate password for cafe
        const cafePassword = generateSecurePassword();
        
        const newCafe = {
            name: cafeName,
            city: cafeCity,
            address: cafeAddress,
            description: cafeDescription,
            workingHours: workingHours,
            photoUrl: photoUrl,
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
        showCafeCredentials(cafeName, cafePassword);
        
        // Clear form
        clearCafeForm();
        
        // Refresh cafes list
        loadCafes();
        
    } catch (error) {
        console.error('❌ Error adding cafe:', error);
        alert('Erro ao adicionar café: ' + error.message);
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
function showCafeCredentials(cafeName, password) {
    const modal = document.createElement('div');
    modal.className = 'credentials-modal';
    modal.innerHTML = `
        <div class="credentials-content">
            <h2>✅ Café "${cafeName}" criado com sucesso!</h2>
            
            <div class="credentials-info">
                <h3>🔐 DADOS PARA ENTRAR NO TMA:</h3>
                
                <div class="credential-row">
                    <strong>Login:</strong> <span class="credential-value">${cafeName}</span>
                    <button onclick="copyToClipboard('${cafeName}')" class="copy-btn">📋</button>
                </div>
                
                <div class="credential-row">
                    <strong>Senha:</strong> <span class="credential-value">${password}</span>
                    <button onclick="copyToClipboard('${password}')" class="copy-btn">📋</button>
                </div>
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
    document.getElementById('cafeName').value = '';
    document.getElementById('cafeCity').value = '';
    document.getElementById('cafeAddress').value = '';
    document.getElementById('cafeDescription').value = '';
    
    // Clear working hours
    document.getElementById('mondayOpen').value = '';
    document.getElementById('mondayClose').value = '';
    document.getElementById('tuesdayOpen').value = '';
    document.getElementById('tuesdayClose').value = '';
    document.getElementById('wednesdayOpen').value = '';
    document.getElementById('wednesdayClose').value = '';
    document.getElementById('thursdayOpen').value = '';
    document.getElementById('thursdayClose').value = '';
    document.getElementById('fridayOpen').value = '';
    document.getElementById('fridayClose').value = '';
    document.getElementById('saturdayOpen').value = '';
    document.getElementById('saturdayClose').value = '';
    document.getElementById('sundayOpen').value = '';
    document.getElementById('sundayClose').value = '';
    
    // Clear photo
    removePhoto();
    

}

// ===== PHOTO UPLOAD FUNCTIONALITY =====

// Initialize photo upload functionality
function initializePhotoUpload() {
    const photoInput = document.getElementById('cafePhoto');
    const photoPreview = document.getElementById('photoPreview');
    const photoUrlInput = document.getElementById('cafePhotoUrl');
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
        photoInput.addEventListener('change', handlePhotoUpload);
    }
    
    // URL input handler
    if (photoUrlInput && urlPreview) {
        photoUrlInput.addEventListener('input', handleUrlInput);
    }
    
    console.log('📸 Photo upload initialized');
}

// Switch between file upload and URL input
function switchPhotoMode(mode) {
    const fileSection = document.getElementById('fileUploadSection');
    const urlSection = document.getElementById('urlInputSection');
    
    if (mode === 'file') {
        fileSection.style.display = 'block';
        urlSection.style.display = 'none';
        // Clear URL input
        document.getElementById('cafePhotoUrl').value = '';
        document.getElementById('urlPreview').innerHTML = '';
    } else {
        fileSection.style.display = 'none';
        urlSection.style.display = 'block';
        // Clear file input
        document.getElementById('cafePhoto').value = '';
        document.getElementById('photoPreview').innerHTML = '';
    }
    
    console.log('📸 Switched to photo mode:', mode);
}

// Handle photo upload and preview with compression
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    const photoPreview = document.getElementById('photoPreview');
    
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas arquivos de imagem!');
            return;
        }
        
        // Validate file size (max 500KB)
        if (file.size > 500 * 1024) {
            alert('A imagem deve ter menos de 500KB! Será comprimida automaticamente.');
        }
        
        // Compress and preview image
        compressImage(file, 500 * 1024, photoPreview);
        
        console.log('📸 Photo upload started:', file.name, 'Size:', file.size);
    }
}

// Compress image to target size
function compressImage(file, targetSize, previewElement) {
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
        
        // Reduce quality until we meet target size
        while (dataUrl.length > targetSize * 1.5 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        // Show preview
        previewElement.innerHTML = `
            <img src="${dataUrl}" alt="Preview da foto">
            <button type="button" class="remove-photo" onclick="removePhoto()">❌ Remover</button>
            <div class="compression-info">
                Original: ${(file.size / 1024).toFixed(1)}KB → 
                Comprimido: ${(dataUrl.length / 1024).toFixed(1)}KB
            </div>
        `;
        previewElement.classList.add('has-image');
        
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
        const updatedCafe = collectEditFormData();
        
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
            const photoUrl = await processPhotoFile(file);
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
        const photoUrl = await processPhotoFile(file);
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

// Start initialization when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin panel DOM loaded, waiting for Firebase...');
    waitForFirebase();
});
