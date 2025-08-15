// Telegram WebApp Application Logic
// This file handles the main functionality for Coook with Telegram integration

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

// Initialize the Telegram WebApp
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Coook Telegram WebApp initializing...');
    
    // Initialize Telegram WebApp API
    initTelegramWebApp();
    
    // Initialize the application
    initializeApp();
});

// Initialize Telegram WebApp API
function initTelegramWebApp() {
    // Check if we're running in Telegram
    const isTelegram = window.Telegram && window.Telegram.WebApp;
    
    if (!isTelegram) {
        // Mock Telegram WebApp API for local development
        console.log('🔧 Running in development mode - using mock Telegram WebApp API');
        createMockTelegramAPI();
    } else {
        console.log('✅ Running in Telegram - using real WebApp API');
        // Initialize real Telegram WebApp
        window.Telegram.WebApp.ready();
        
        // Set up theme change listener
        window.Telegram.WebApp.onEvent('themeChanged', function() {
            console.log('🎨 Theme changed to:', window.Telegram.WebApp.colorScheme);
            updateTheme();
        });
        
        // Set up viewport change listener
        window.Telegram.WebApp.onEvent('viewportChanged', function() {
            console.log('📱 Viewport changed');
        });
    }
}

// Create mock Telegram WebApp API for development
function createMockTelegramAPI() {
    window.Telegram = {
        WebApp: {
            ready: function() {
                console.log('✅ Telegram WebApp ready (mock)');
                // AUTOMATIC FULLSCREEN в mock режиме
                this.expand();
                setTimeout(() => {
                    if (window.onTelegramReady) {
                        window.onTelegramReady();
                    }
                }, 100);
            },
            expand: function() {
                console.log('📱 WebApp expanded to FULLSCREEN (mock)');
                this.isExpanded = true;
            },
            close: function() {
                console.log('❌ WebApp close requested (mock)');
            },
            HapticFeedback: {
                impactOccurred: function(style) {
                    console.log('📳 Haptic feedback:', style, '(mock)');
                    if (navigator.vibrate) {
                        navigator.vibrate(100);
                    }
                },
                notificationOccurred: function(type) {
                    console.log('🔔 Notification haptic:', type, '(mock)');
                    if (navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
                },
                selectionChanged: function() {
                    console.log('👆 Selection changed haptic (mock)');
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }
            },
            mainButton: {
                text: 'Main Button',
                isVisible: false,
                onClick: function(callback) {
                    console.log('🔘 Main button clicked (mock)');
                    if (callback) callback();
                },
                show: function() {
                    this.isVisible = true;
                    console.log('🔘 Main button shown (mock)');
                },
                hide: function() {
                    this.isVisible = false;
                    console.log('🔘 Main button hidden (mock)');
                },
                setText: function(text) {
                    this.text = text;
                    console.log('🔘 Main button text set to:', text, '(mock)');
                }
            },
            backButton: {
                isVisible: false,
                onClick: function(callback) {
                    console.log('🔙 Back button clicked (mock)');
                    if (callback) callback();
                },
                show: function() {
                    this.isVisible = true;
                    console.log('🔙 Back button shown (mock)');
                },
                hide: function() {
                    this.isVisible = false;
                    console.log('🔙 Back button hidden (mock)');
                }
            }
        }
    };
    
    // Initialize mock WebApp
    setTimeout(() => {
        window.Telegram.WebApp.ready();
    }, 500);
}

// Initialize the application
function initializeApp() {
    loadSavedCity(); // Load saved city first
    loadData();
    setupEventListeners();
    setupTelegramIntegration();
    initMobileGestures();
    
    // Auto-refresh data every 5 seconds
    setInterval(refreshData, 5000);
    
    // FINAL FULLSCREEN ATTEMPT - после полной инициализации
    if (window.Telegram && window.Telegram.WebApp) {
        setTimeout(() => {
            window.Telegram.WebApp.expand();
            console.log('🔧 Final expand attempt after full initialization');
        }, 1000);
    }
    
    console.log('✅ Coook Telegram WebApp initialized successfully!');
}

// Load data from localStorage
function loadData() {
    loadCafesData();
    loadCitiesData();
    updateCityDropdown();
    displayCafes();
}

// Load cafes data
function loadCafesData() {
    const stored = localStorage.getItem('cafesData');
    if (stored) {
        cafesData = JSON.parse(stored);
    } else {
        // Default cafes if none exist
        cafesData = [
            {
                id: 1,
                name: "Café Central",
                description: "Um café acolhedor no coração da cidade com os melhores grãos brasileiros.",
                city: "sao-paulo",
                cityName: "São Paulo",
                hours: "Segunda a Sexta: 7h às 20h\nSábado e Domingo: 8h às 22h",
                image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop",
                gallery: [
                    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop"
                ]
            },
            {
                id: 2,
                name: "Bella Vista",
                description: "Café com vista panorâmica e ambiente sofisticado para momentos especiais.",
                city: "rio-de-janeiro",
                cityName: "Rio de Janeiro",
                hours: "Todos os dias: 8h às 23h",
                image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
                gallery: [
                    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop"
                ]
            }
        ];
        localStorage.setItem('cafesData', JSON.stringify(cafesData));
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

// Update city dropdown
function updateCityDropdown() {
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) return;
    
    citySelect.innerHTML = '<option value="">Selecione uma cidade</option>';
    
    citiesData.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.name;
        citySelect.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            saveSelectedCity(this.value);
            displayCafes();
            updateTelegramUI();
            
            // Haptic feedback for city selection
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.HapticFeedback.selectionChanged();
            }
        });
    }
    
    // Modal close events
    const modal = document.getElementById('cafeModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

// Setup Telegram-specific integration
function setupTelegramIntegration() {
    if (!window.Telegram || !window.Telegram.WebApp) return;
    
    const tg = window.Telegram.WebApp;
    
    // Set app theme
    tg.setHeaderColor('#4A90E2');
    tg.setBackgroundColor('#ffffff');
    
    // AGGRESSIVE FULLSCREEN - несколько попыток разворачивания
    tg.expand();
    
    // Дополнительная попытка через небольшую задержку
    setTimeout(() => {
        if (tg.expand) {
            tg.expand();
            console.log('🔧 Second expand attempt');
        }
    }, 100);
    
    // Еще одна попытка после полной загрузки
    setTimeout(() => {
        if (tg.expand) {
            tg.expand();
            console.log('🔧 Third expand attempt after load');
        }
    }, 500);
    
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
    
    console.log('🔧 Telegram integration configured with AGGRESSIVE FULLSCREEN');
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
        
        console.log('🔧 User info loaded:', user.first_name);
    } else {
        // Fallback if no user data
        if (userNameElement) {
            userNameElement.textContent = 'Visitante';
        }
        console.log('🔧 No user data available, using fallback');
    }
}

// Update Telegram UI based on current state
function updateTelegramUI() {
    if (!window.Telegram || !window.Telegram.WebApp) return;
    
    const tg = window.Telegram.WebApp;
    
    if (currentCity) {
        // Show main button when city is selected
        tg.mainButton.show();
        tg.mainButton.setText('Ver Detalhes');
    } else {
        // Hide main button when no city is selected
        tg.mainButton.hide();
    }
    
    // Hide back button by default
    tg.backButton.hide();
}

// Display cafes based on selected city
function displayCafes() {
    const cafesList = document.getElementById('cafesList');
    const noCafes = document.getElementById('noCafes');
    
    if (!cafesList) return;
    
    // FORCE FULLSCREEN on every user interaction
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        console.log('🔧 Force expand on displayCafes');
    }
    
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
    
    // FORCE FULLSCREEN when opening modal
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        console.log('🔧 Force expand on modal open');
    }
    
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
    
    // Update Telegram UI
    updateTelegramUI();
    
    console.log('🔧 Cafe details modal opened for:', cafe.name);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('cafeModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    
    // Update Telegram UI after closing modal
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Hide back button
        tg.backButton.hide();
        
        // Reset main button
        tg.mainButton.setText('Ver Detalhes');
        tg.mainButton.onClick(function() {
            // Main button action when modal is closed
            if (currentCity) {
                tg.showAlert('Selecione um café para ver os detalhes');
            }
        });
        
        // Haptic feedback
        tg.HapticFeedback.impactOccurred('light');
    }
    
    // Native haptic feedback fallback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Refresh data
function refreshData() {
    loadData();
}

// Mobile gestures
function initMobileGestures() {
    const modal = document.getElementById('cafeModal');
    if (!modal) return;
    
    let startY = 0;
    let currentY = 0;
    
    modal.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
    });
    
    modal.addEventListener('touchmove', function(e) {
        currentY = e.touches[0].clientY;
        const diff = startY - currentY;
        
        if (diff > 50) { // Swipe up to close
            closeModal();
        }
    });
}

// Update theme based on Telegram theme
function updateTheme() {
    if (!window.Telegram || !window.Telegram.WebApp) return;
    
    const tg = window.Telegram.WebApp;
    const isDark = tg.colorScheme === 'dark';
    
    // Update CSS variables based on theme
    document.documentElement.style.setProperty('--tg-theme-bg-color', isDark ? '#1c1c1c' : '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', isDark ? '#ffffff' : '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', isDark ? '#aaaaaa' : '#999999');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', isDark ? '#2c2c2c' : '#f1f1f1');
}

// Utility function to add new cafe (for admin panel sync)
function addCafe(cafe) {
    cafe.id = Date.now();
    cafesData.push(cafe);
    localStorage.setItem('cafesData', JSON.stringify(cafesData));
    displayCafes();
}

// Utility function to update cafe (for admin panel sync)
function updateCafe(cafeId, updatedCafe) {
    const index = cafesData.findIndex(c => c.id === cafeId);
    if (index !== -1) {
        cafesData[index] = { ...cafesData[index], ...updatedCafe };
        localStorage.setItem('cafesData', JSON.stringify(cafesData));
        displayCafes();
    }
}

// Utility function to delete cafe (for admin panel sync)
function deleteCafe(cafeId) {
    cafesData = cafesData.filter(c => c.id !== cafeId);
    localStorage.setItem('cafesData', JSON.stringify(cafesData));
    displayCafes();
}

// Utility function to add new city (for admin panel sync)
function addCity(city) {
    city.id = city.name.toLowerCase().replace(/\s+/g, '-');
    citiesData.push(city);
    localStorage.setItem('citiesData', JSON.stringify(citiesData));
    updateCityDropdown();
}

// Export functions for admin panel
window.addCafe = addCafe;
window.updateCafe = updateCafe;
window.deleteCafe = deleteCafe;
window.addCity = addCity;
window.showCafeDetails = showCafeDetails;
window.closeModal = closeModal;
window.refreshData = refreshData;
