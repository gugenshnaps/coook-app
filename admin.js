// Global variables
let cafesData = [];
let citiesData = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    
    // Auto-refresh data every 3 seconds
    setInterval(refreshData, 3000);
});

// Load data from localStorage
function loadData() {
    loadCafesData();
    loadCitiesData();
    updateCityDropdowns();
    displayCities();
    displayCafes();
}

// Load cafes data
function loadCafesData() {
    const stored = localStorage.getItem('cafesData');
    if (stored) {
        cafesData = JSON.parse(stored);
    } else {
        cafesData = [];
    }
}

// Load cities data
function loadCitiesData() {
    const stored = localStorage.getItem('citiesData');
    if (stored) {
        citiesData = JSON.parse(stored);
    } else {
        // Default cities
        citiesData = [
            { id: "sao-paulo", name: "São Paulo" },
            { id: "rio-de-janeiro", name: "Rio de Janeiro" },
            { id: "brasilia", name: "Brasília" }
        ];
        localStorage.setItem('citiesData', JSON.stringify(citiesData));
    }
}

// Update all city dropdowns
function updateCityDropdowns() {
    updateCityDropdown('cafeCity');
    updateCityDropdown('cafeCitySelect');
}

// Update specific city dropdown
function updateCityDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Keep current selection
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Selecione uma cidade</option>';
    
    citiesData.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.name;
        select.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentValue && citiesData.find(c => c.id === currentValue)) {
        select.value = currentValue;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add cafe form
    const addCafeForm = document.getElementById('addCafeForm');
    if (addCafeForm) {
        addCafeForm.addEventListener('submit', handleAddCafe);
    }
}

// Handle add cafe form submission
function handleAddCafe(e) {
    e.preventDefault();
    
    const cafe = {
        name: document.getElementById('cafeName').value.trim(),
        city: document.getElementById('cafeCitySelect').value,
        description: document.getElementById('cafeDescription').value.trim(),
        hours: document.getElementById('cafeHours').value.trim(),
        image: document.getElementById('cafeImage').value.trim()
    };
    
    // Validation
    if (!cafe.name || !cafe.city || !cafe.description || !cafe.hours || !cafe.image) {
        showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    // Get city name
    const cityObj = citiesData.find(c => c.id === cafe.city);
    if (cityObj) {
        cafe.cityName = cityObj.name;
    }
    
    // Add cafe
    addCafe(cafe);
    
    // Reset form
    e.target.reset();
    
    showMessage('Café adicionado com sucesso!', 'success');
}

// Add new cafe
function addCafe(cafe) {
    cafe.id = Date.now();
    cafe.gallery = [cafe.image]; // Use main image as first gallery image
    
    cafesData.push(cafe);
    localStorage.setItem('cafesData', JSON.stringify(cafesData));
    
    displayCafes();
}

// Add new city
function addNewCity() {
    const cityNameInput = document.getElementById('newCityName');
    const cityName = cityNameInput.value.trim();
    
    if (!cityName) {
        showMessage('Por favor, digite o nome da cidade.', 'error');
        return;
    }
    
    // Check if city already exists
    if (citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase())) {
        showMessage('Esta cidade já existe.', 'error');
        return;
    }
    
    const city = {
        id: cityName.toLowerCase().replace(/\s+/g, '-'),
        name: cityName
    };
    
    citiesData.push(city);
    localStorage.setItem('citiesData', JSON.stringify(citiesData));
    
    updateCityDropdowns();
    displayCities();
    
    // Reset input
    cityNameInput.value = '';
    
    showMessage(`Cidade "${cityName}" adicionada com sucesso!`, 'success');
}

// Display cities
function displayCities() {
    const citiesList = document.getElementById('citiesList');
    if (!citiesList) return;
    
    if (citiesData.length === 0) {
        citiesList.innerHTML = '<div class="empty-state"><p>Nenhuma cidade cadastrada</p></div>';
        return;
    }
    
    citiesList.innerHTML = citiesData.map(city => `
        <div class="item-card">
            <div class="item-header">
                <span class="item-name">${city.name}</span>
                <div class="item-actions">
                    <button onclick="deleteCity('${city.id}')" class="btn btn-danger btn-small">🗑️</button>
                </div>
            </div>
            <div class="item-city">
                <strong>ID:</strong> ${city.id}
            </div>
        </div>
    `).join('');
}

// Display cafes
function displayCafes() {
    const cafesList = document.getElementById('cafesList');
    if (!cafesList) return;
    
    if (cafesData.length === 0) {
        cafesList.innerHTML = '<div class="empty-state"><p>Nenhum café cadastrado</p></div>';
        return;
    }
    
    cafesList.innerHTML = cafesData.map(cafe => `
        <div class="item-card">
            <div class="item-header">
                <span class="item-name">${cafe.name}</span>
                <div class="item-actions">
                    <button onclick="editCafe(${cafe.id})" class="btn btn-primary btn-small">✏️</button>
                    <button onclick="deleteCafe(${cafe.id})" class="btn btn-danger btn-small">🗑️</button>
                </div>
            </div>
            <div class="item-city">
                <strong>Cidade:</strong> ${cafe.cityName || 'N/A'}
            </div>
            <div class="item-description">${cafe.description}</div>
        </div>
    `).join('');
}

// Filter cafes
function filterCafes() {
    const cityFilter = document.getElementById('cafeCity').value;
    const searchFilter = document.getElementById('cafeSearch').value.toLowerCase();
    
    let filteredCafes = cafesData;
    
    // Filter by city
    if (cityFilter) {
        filteredCafes = filteredCafes.filter(cafe => cafe.city === cityFilter);
    }
    
    // Filter by search
    if (searchFilter) {
        filteredCafes = filteredCafes.filter(cafe => 
            cafe.name.toLowerCase().includes(searchFilter) ||
            cafe.description.toLowerCase().includes(searchFilter)
        );
    }
    
    displayFilteredCafes(filteredCafes);
}

// Display filtered cafes
function displayFilteredCafes(filteredCafes) {
    const cafesList = document.getElementById('cafesList');
    if (!cafesList) return;
    
    if (filteredCafes.length === 0) {
        cafesList.innerHTML = '<div class="empty-state"><p>Nenhum café encontrado com os filtros aplicados</p></div>';
        return;
    }
    
    cafesList.innerHTML = filteredCafes.map(cafe => `
        <div class="item-card">
            <div class="item-header">
                <span class="item-name">${cafe.name}</span>
                <div class="item-actions">
                    <button onclick="editCafe(${cafe.id})" class="btn btn-primary btn-small">✏️</button>
                    <button onclick="deleteCafe(${cafe.id})" class="btn btn-danger btn-small">🗑️</button>
                </div>
            </div>
            <div class="item-city">
                <strong>Cidade:</strong> ${cafe.cityName || 'N/A'}
            </div>
            <div class="item-description">${cafe.description}</div>
        </div>
    `).join('');
}

// Edit cafe
function editCafe(cafeId) {
    const cafe = cafesData.find(c => c.id === cafeId);
    if (!cafe) return;
    
    // For now, just show a simple edit form
    // In a real app, you'd want a proper modal or form
    const newName = prompt('Novo nome do café:', cafe.name);
    if (newName && newName.trim()) {
        cafe.name = newName.trim();
        localStorage.setItem('cafesData', JSON.stringify(cafesData));
        displayCafes();
        showMessage('Café atualizado com sucesso!', 'success');
    }
}

// Delete cafe
function deleteCafe(cafeId) {
    if (confirm('Tem certeza que deseja excluir este café?')) {
        cafesData = cafesData.filter(c => c.id !== cafeId);
        localStorage.setItem('cafesData', JSON.stringify(cafesData));
        displayCafes();
        showMessage('Café excluído com sucesso!', 'success');
    }
}

// Delete city
function deleteCity(cityId) {
    // Check if city has cafes
    const cafesInCity = cafesData.filter(c => c.city === cityId);
    if (cafesInCity.length > 0) {
        showMessage(`Não é possível excluir esta cidade. Ela possui ${cafesInCity.length} café(s) cadastrado(s).`, 'error');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta cidade?')) {
        citiesData = citiesData.filter(c => c.id !== cityId);
        localStorage.setItem('citiesData', JSON.stringify(citiesData));
        updateCityDropdowns();
        displayCities();
        showMessage('Cidade excluída com sucesso!', 'success');
    }
}

// Refresh data
function refreshData() {
    loadData();
}

// Show message
function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at top of admin container
    const adminContainer = document.querySelector('.admin-container');
    if (adminContainer) {
        adminContainer.insertBefore(messageDiv, adminContainer.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Export functions for global access
window.addNewCity = addNewCity;
window.filterCafes = filterCafes;
window.editCafe = editCafe;
window.deleteCafe = deleteCafe;
window.deleteCity = deleteCity;
window.refreshData = refreshData;
