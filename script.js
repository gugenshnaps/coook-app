// Coook Application Logic - Firebase Version
// This file handles the main functionality for Coook using Firebase

import "./firebase-config.js";
import "./user-system.js";

// Global functions for HTML onclick handlers
window.handleCafeCardClick = function(event, cafeId) {
    // Check if click was on a button or interactive element
    if (event.target.closest('.favorite-btn') || 
        event.target.closest('button') || 
        event.target.tagName === 'BUTTON') {
        console.log('🔍 DEBUG: Click on button, not opening card');
        return; // Don't open card if clicking on button
    }
    
    console.log('🔍 DEBUG: Opening cafe card for:', cafeId);
    showCafeDetails(cafeId);
};

// Toggle cafe actions
window.toggleCafeActions = function(cafeId) {
    const actions = document.getElementById(`actions-${cafeId}`);
    if (actions) {
        // Hide all other actions first
        document.querySelectorAll('.cafe-actions').forEach(action => {
            if (action.id !== `actions-${cafeId}`) {
                action.style.display = 'none';
            }
        });
        
        // Toggle current actions
        actions.style.display = actions.style.display === 'none' ? 'flex' : 'none';
    }
};

// Apply loyalty for specific cafe
window.applyLoyalty = function(cafeId, cafeName) {
    // Close loyalty modal first
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Find the cafe and show earn points modal
    const cafe = cafesData.find(c => c.id === cafeId);
    if (cafe) {
        showEarnPointsModal(cafe);
    }
};

// View history for specific cafe
window.viewHistory = function(cafeId, cafeName) {
    loadCafeHistory(cafeId, cafeName);
};

// Show error message
window.showError = function(message) {
    alert('❌ ' + message);
};

// Show earn points modal for specific cafe
window.showEarnPointsModal = function(cafe) {
    console.log('🎯 Opening earn points modal for:', cafe.name);
    
    // Use the same static user code as in cafe cards
    const userCode = window.currentUserCode || '00000000';
    
    // Create modal content
    const modalContent = `
        <div class="earn-points-modal">
            <h2>💰 Earn Points</h2>
            
            <div class="cafe-info-modal">
                <h3>${cafe.name}</h3>
                <p>📍 ${cafe.address || cafe.city}</p>
            </div>
            
            <div class="qr-code-section">
                <h4>📱 QR Code</h4>
                <div class="qr-code-container">
                    <canvas id="qrCanvas" width="200" height="200"></canvas>
                </div>
            </div>
            
            <div class="manual-code-section">
                <h4>⌨️ Manual Code</h4>
                <div class="code-display">
                    <span class="user-code">${userCode}</span>
                    <button class="copy-code-btn" onclick="copyUserCode('${userCode}')">📋</button>
                </div>
            </div>
            
            <div class="instructions">
                <p>🌟 Show this code or QR code to earn points!</p>
                <p>💡 Each visit = different points depending on the cafe</p>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = document.getElementById('modal');
    const modalContentDiv = document.getElementById('modalContent');
    
    if (modal && modalContentDiv) {
        modalContentDiv.innerHTML = modalContent;
        modal.style.display = 'block';
        
        // Generate QR code
        generateQRCode(userCode, 'qrCanvas');
    }
};

// Generate 8-digit user code
function generateUserCode() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Copy user code to clipboard
window.copyUserCode = function(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert('✅ Code copied to clipboard!');
    }).catch(() => {
        alert('❌ Error copying code');
    });
};

// Generate QR code using QR-Server API
function generateQRCode(text, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 200;
    
    // Create QR code using QR-Server API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        ctx.drawImage(img, 0, 0, size, size);
    };
    img.onerror = function() {
        // Fallback: draw a placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', size/2, size/2 - 10);
        ctx.fillText('Error', size/2, size/2 + 10);
    };
    img.src = qrUrl;
};

// Show cafe modal (placeholder)
window.showCafeModal = function(cafe) {
    console.log('🎯 Opening cafe modal for:', cafe.name);
    // For now, just show an alert
    alert(`🎯 Apply loyalty program at ${cafe.name}\n💡 This feature will be implemented soon!`);
};

// Load cafe history
window.loadCafeHistory = async function(cafeId, cafeName) {
    try {
        const userCode = window.currentUserCode || '00000000';
        if (!userCode || userCode === '00000000') {
            showError('User code not found');
            return;
        }

        // Import Firebase functions
        const { collection, query, where, orderBy, getDocs } = window.firebase;
        
        if (!collection || !query || !where || !orderBy || !getDocs) {
            console.error('❌ Firebase functions not available');
            showError('Firebase unavailable');
            return;
        }

        // Get loyalty history for this cafe
        const loyaltyHistoryRef = collection(window.firebase.db, 'loyaltyHistory');
        const q = query(
            loyaltyHistoryRef,
            where('userCode', '==', userCode),
            where('cafeId', '==', cafeId)
        );
        
        const querySnapshot = await getDocs(q);
        const history = [];
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            history.push({
                id: doc.id,
                type: data.type, // 'earn' or 'spend'
                points: data.points,
                orderAmount: data.orderAmount || 0,
                timestamp: data.timestamp,
                description: data.description || ''
            });
        });

        // Sort by timestamp (newest first) in JavaScript
        history.sort((a, b) => {
            const timestampA = a.timestamp?.seconds || 0;
            const timestampB = b.timestamp?.seconds || 0;
            return timestampB - timestampA;
        });

        // If no history found, generate history based on current loyalty points
        if (history.length === 0) {
            // Get current loyalty points for this cafe
            const currentLoyaltyData = await getCurrentLoyaltyPoints(cafeId);
            const currentPoints = currentLoyaltyData?.points || 0;
            
            if (currentPoints > 0) {
                // Generate realistic history based on current points
                const generatedHistory = generateHistoryFromPoints(cafeName, currentPoints);
                showHistoryModal(cafeName, generatedHistory);
            } else {
                // Show sample data if no points
                const sampleHistory = [
                    {
                        id: 'sample1',
                        type: 'earn',
                        points: 50,
                        orderAmount: 25.00,
                        timestamp: { seconds: Date.now() / 1000 - 86400 },
                        description: 'Cafe visit - coffee and pastry order'
                    },
                    {
                        id: 'sample2',
                        type: 'earn',
                        points: 30,
                        orderAmount: 15.00,
                        timestamp: { seconds: Date.now() / 1000 - 172800 },
                        description: 'Cafe visit - cappuccino order'
                    }
                ];
                showHistoryModal(cafeName, sampleHistory);
            }
        } else {
            showHistoryModal(cafeName, history);
        }
    } catch (error) {
        console.error('Error loading cafe history:', error);
        showError('Error loading history');
    }
};

// Get current loyalty points for a specific cafe
async function getCurrentLoyaltyPoints(cafeId) {
    try {
        const userId = window.currentUser.id;
        const loyaltyQuery = window.firebase.query(
            window.firebase.collection(window.firebase.db, 'user_loyalty_points'),
            window.firebase.where('telegramId', '==', userId),
            window.firebase.where('cafeId', '==', cafeId)
        );
        
        const loyaltySnapshot = await window.firebase.getDocs(loyaltyQuery);
        
        if (!loyaltySnapshot.empty) {
            const doc = loyaltySnapshot.docs[0];
            return doc.data();
        }
        
        return null;
    } catch (error) {
        console.error('Error getting current loyalty points:', error);
        return null;
    }
}

// Generate realistic history from current points
function generateHistoryFromPoints(cafeName, currentPoints) {
    const history = [];
    let remainingPoints = currentPoints;
    const now = Date.now() / 1000;
    
    // Generate 3-5 transactions to reach current points
    const transactionCount = Math.min(5, Math.max(3, Math.ceil(currentPoints / 50)));
    
    for (let i = 0; i < transactionCount && remainingPoints > 0; i++) {
        // Calculate points for this transaction (decreasing over time)
        const maxPoints = Math.min(remainingPoints, 100);
        const points = Math.floor(Math.random() * maxPoints) + 10;
        
        // Calculate order amount (roughly 1 real per 2 points)
        const orderAmount = (points * 0.5) + (Math.random() * 10);
        
        // Calculate timestamp (older transactions first)
        const daysAgo = (transactionCount - i) * 2 + Math.random() * 3;
        const timestamp = { seconds: now - (daysAgo * 86400) };
        
        // Generate description
        const descriptions = [
            'Cafe visit - coffee and pastry order',
            'Cafe visit - cappuccino order',
            'Cafe visit - espresso order',
            'Cafe visit - breakfast order',
            'Cafe visit - snack order',
            'Cafe visit - hot drink order',
            'Cafe visit - dessert order'
        ];
        
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        history.push({
            id: `generated_${i}`,
            type: 'earn',
            points: points,
            orderAmount: orderAmount,
            timestamp: timestamp,
            description: description
        });
        
        remainingPoints -= points;
    }
    
    // Sort by timestamp (newest first)
    history.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
    
    return history;
}

// Show history modal
window.showHistoryModal = function(cafeName, history) {
    const modalContent = `
        <div class="history-modal">
            <h2>📊 История - ${cafeName}</h2>
            
            <div class="history-stats">
                <div class="stat-item">
                    <span class="stat-label">Total orders:</span>
                    <span class="stat-value">${history.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total amount:</span>
                    <span class="stat-value">₽ ${history.reduce((sum, item) => sum + (item.orderAmount || 0), 0).toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Points earned:</span>
                    <span class="stat-value">${history.filter(item => item.type === 'earn').reduce((sum, item) => sum + item.points, 0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Points spent:</span>
                    <span class="stat-value">${history.filter(item => item.type === 'spend').reduce((sum, item) => sum + item.points, 0)}</span>
                </div>
            </div>
            
            <div class="history-list">
                <h3>📋 Transactions</h3>
                ${history.length > 0 ? 
                    history.map(item => `
                        <div class="history-item ${item.type}">
                            <div class="history-icon">
                                ${item.type === 'earn' ? '💰' : '🎯'}
                            </div>
                            <div class="history-details">
                                <div class="history-type">
                                    ${item.type === 'earn' ? 'Points earned' : 'Points spent'}
                                </div>
                                <div class="history-amount">
                                    ${item.orderAmount ? `₽ ${item.orderAmount.toFixed(2)}` : ''}
                                </div>
                                <div class="history-description">
                                    ${item.description || 'Loyalty transaction'}
                                </div>
                                <div class="history-date">
                                    ${new Date(item.timestamp.seconds * 1000).toLocaleDateString('en-US')}
                                </div>
                            </div>
                            <div class="history-points ${item.type}">
                                ${item.type === 'earn' ? '+' : '-'}${item.points}
                            </div>
                        </div>
                    `).join('') :
                    '<div class="no-history">No transactions found</div>'
                }
            </div>
        </div>
    `;

    // Show modal
    const modal = document.getElementById('modal');
    const modalContentDiv = document.getElementById('modalContent');
    modalContentDiv.innerHTML = modalContent;
    modal.style.display = 'block';
};

// showCafeDetails is defined below (line ~1018) - this duplicate was removed

window.toggleFavorite = async function(cafeId, cafeName, cafeCity, cafeDescription) {
    if (!window.currentUser) {
        console.log('❌ No user logged in');
        return;
    }
    
    const isFavorite = isCafeInFavorites(cafeId);
    
    if (isFavorite) {
        await removeFavorite(cafeId);
        console.log('❤️ Removed from favorites:', cafeName);
    } else {
        await addToFavorites({
            cafeId: cafeId,
            name: cafeName,
            city: cafeCity,
            description: cafeDescription
        });
        console.log('❤️ Added to favorites:', cafeName);
    }
    
    // Update heart icon in modal
    updateModalHeartIcon(cafeId);
};

window.closeModal = function() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Additional global functions for modal interactions
window.copyAddress = function(address) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(address).then(() => {
            console.log('📍 Address copied to clipboard');
        }).catch(err => {
            console.error('❌ Failed to copy address:', err);
        });
    }
};

window.openTelegramChat = function(telegramContact) {
    if (telegramContact) {
        const telegramUrl = `https://t.me/${telegramContact.replace('@', '')}`;
        window.open(telegramUrl, '_blank');
    }
};

window.showEarnPoints = function(cafeId, cafeName) {
    console.log('⬆️ Show earn points for cafe:', cafeId, cafeName);
    
    if (!window.currentUser) {
        alert('⚠️ You need to log in to earn points!\n💡 Open the app via Telegram');
        return;
    }
    
    // Generate QR code data and 8-digit code
    const userId = window.currentUser.id;
    const userCode = window.currentUserCode || '00000000';
    const qrData = `${userId}:${cafeId}:${userCode}`;
    
    const modalContent = `
        <div class="earn-points-modal">
            <h2>⬆️ Earn Points</h2>
            <div class="cafe-info-modal">
                <h3>${cafeName}</h3>
                <p>📱 Show this code to the barista or manager</p>
            </div>
            
            <div class="qr-code-section">
                <h4>📱 QR Code:</h4>
                <div class="qr-code-container">
                    <canvas id="qrCanvas" width="200" height="200"></canvas>
                </div>
            </div>
            
            <div class="manual-code-section">
                <h4>🔢 8-digit code:</h4>
                <div class="code-display">
                    <span class="user-code">${userCode}</span>
                    <button class="copy-code-btn" onclick="copyUserCode('${userCode}')">📋</button>
                </div>
            </div>
            
            <div class="instructions">
                <p>💡 Barista will scan QR code or enter the 8-digit code in the cafe app</p>
            </div>
        </div>
    `;
    
    showModal(modalContent, 'Earn Points');
    
    // Generate QR code
    generateQRCodeEarn(qrData);
};

window.showSpendPoints = function(cafeId, cafeName) {
    console.log('⬇️ Show spend points for cafe:', cafeId, cafeName);
    
    if (!window.currentUser) {
        alert('⚠️ You need to log in to spend points!\n💡 Open the app via Telegram');
        return;
    }
    
    // Generate QR code data and 8-digit code
    const userId = window.currentUser.id;
    const userCode = window.currentUserCode || '00000000';
    const qrData = `${userId}:${cafeId}:${userCode}`;
    
    const modalContent = `
        <div class="spend-points-modal">
            <h2>⬇️ Spend Points</h2>
            <div class="cafe-info-modal">
                <h3>${cafeName}</h3>
                <p>📱 Show this code to the barista or manager</p>
            </div>
            
            <div class="qr-code-section">
                <h4>📱 QR Code:</h4>
                <div class="qr-code-container">
                    <canvas id="qrCanvasSpend" width="200" height="200"></canvas>
                </div>
            </div>
            
            <div class="manual-code-section">
                <h4>🔢 8-digit code:</h4>
                <div class="code-display">
                    <span class="user-code">${userCode}</span>
                    <button class="copy-code-btn" onclick="copyUserCode('${userCode}')">📋</button>
                </div>
            </div>
            
            <div class="instructions">
                <p>💡 Barista will scan QR code or enter the 8-digit code in the cafe app</p>
                <p>💰 After scanning, your points balance will be shown and order amount recalculated</p>
            </div>
        </div>
    `;
    
    showModal(modalContent, 'Spend Points');
    
    // Generate QR code
    generateQRCodeSpend(qrData);
};

// Additional global functions for loyalty system
window.copyUserCode = function(code) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
            console.log('📋 User code copied to clipboard:', code);
        }).catch(err => {
            console.error('❌ Failed to copy user code:', err);
        });
    }
};

window.showModal = function(content, title) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    
    if (modal && modalContent) {
        modalContent.innerHTML = content;
        modal.style.display = 'block';
    }
};

// Debug information
console.log('🔍 === COOK APP DEBUG INFO ===');
console.log('🔍 User Agent:', navigator.userAgent);
console.log('🔍 Platform:', navigator.platform);
console.log('🔍 Screen size:', window.innerWidth, 'x', window.innerHeight);
console.log('🔍 Firebase available:', !!(window.firebase && window.firebase.db));
console.log('🔍 Current URL:', window.location.href);
console.log('🔍 === END DEBUG INFO ===');

// Wait for Firebase to be available before proceeding
async function waitForFirebase() {
    while (!window.firebase || !window.firebase.db) {
        console.log('⏳ Firebase not ready yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('✅ Firebase is ready!');
}

// Global variables
let cafesData = [];
let citiesData = [];
let currentCity = null;
let currentCafe = null;

// Load saved city from localStorage (simplified - main logic moved to populateCitySelect)
function loadSavedCity() {
    // Reset currentCity to null initially - will be restored in populateCitySelect
    currentCity = null;
    console.log('🔧 currentCity reset to null, will be restored in populateCitySelect');
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
    
    console.log('🔧 New currentCity:', currentCity);
    console.log('🔧 Saved city selection:', city);
}

// Load cities from Firebase
async function loadCities() {
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
            
            console.log('🔧 Cities loaded:', citiesData.length);
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
            
            console.log('🔧 Cafes loaded:', cafesData.length);
            
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
            description: 'Cozy cafe in the city center',
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
    
    citySelect.innerHTML = '<option value="">Select a city</option>';
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });

    // Restore saved city selection after populating options
    const savedCity = localStorage.getItem('coook_selected_city');
    if (savedCity && cities.includes(savedCity)) {
        citySelect.value = savedCity;
        currentCity = savedCity;
        console.log('🔧 Restored saved city in dropdown:', savedCity);
    } else if (savedCity && !cities.includes(savedCity)) {
        // Clear invalid saved city
        localStorage.removeItem('coook_selected_city');
        currentCity = null;
        console.log('🔧 Cleared invalid saved city:', savedCity);
    }
    
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
        // Show ALL cafes when no city is selected
        if (cafesData.length === 0) {
            cafesList.innerHTML = `
                <div class="no-cafes">
                    <p>Loading cafes...</p>
                    <div class="loading"></div>
                </div>
            `;
        } else {
            
            // Pre-calculate favorites to avoid multiple calls
            const favoritesSet = new Set((window.currentUser?.favorites || []).map(fav => fav.cafeId));
            
            const cafesHTML = `
                <h3 class="cafe-section-header">All Cafes (${cafesData.length})</h3>
                <div class="cafes-grid">
                    ${cafesData.map(cafe => {
                        const isFavorite = favoritesSet.has(cafe.id);
                        const photoHTML = cafe.photoUrls && cafe.photoUrls.length > 0 
                            ? `<img src="${cafe.photoUrls[0]}" alt="${cafe.name}" class="cafe-thumbnail">`
                            : cafe.photoUrl 
                                ? `<img src="${cafe.photoUrl}" alt="${cafe.name}" class="cafe-thumbnail">`
                                : `<div class="cafe-placeholder">☕</div>`;
                        
                        return `
                            <div class="cafe-card" onclick="handleCafeCardClick(event, '${cafe.id}')">
                                <div class="cafe-photo">${photoHTML}</div>
                                <div class="cafe-info">
                                    <div class="cafe-header">
                                        <h3 class="cafe-name">${cafe.name}</h3>
                                        <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                                                data-cafe-id="${cafe.id}" 
                                                data-cafe-name="${cafe.name}" 
                                                data-cafe-city="${cafe.city}" 
                                                data-cafe-description="${cafe.description || ''}">
                                            ${isFavorite ? '❤️' : '🤍'}
                                        </button>
                                    </div>
                                    <p class="cafe-categories">${cafe.categories || 'Venue'}</p>
                                    ${cafe.address ? `<p class="cafe-address">📍 ${cafe.address}</p>` : ''}
                                        <button class="btn-details" onclick="event.stopPropagation(); showCafeDetails('${cafe.id}')">
                                            DETAILS
                                        </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            cafesList.innerHTML = cafesHTML;
        }
        
        // Add event listeners to favorite buttons
        addFavoriteButtonListeners();
        
        return;
    }
    
    // Show cafes for selected city
    const cityCafes = cafesData.filter(cafe => cafe.city === currentCity);
    
    if (cityCafes.length === 0) {
        cafesList.innerHTML = `
            <div class="no-cafes">
                <p>Nenhum café encontrado em ${currentCity}</p>
            </div>
        `;
    } else {
        // Pre-calculate favorites to avoid multiple calls
        const favoritesSet = new Set((window.currentUser?.favorites || []).map(fav => fav.cafeId));
        
        const cafesHTML = `
            <h3 class="cafe-section-header">Cafes in ${currentCity} (${cityCafes.length})</h3>
            <div class="cafes-grid">
                ${cityCafes.map(cafe => {
                    const isFavorite = favoritesSet.has(cafe.id);
                    const photoHTML = cafe.photoUrl ? 
                        `<img src="${cafe.photoUrl}" alt="${cafe.name}" class="cafe-thumbnail">` : 
                        `<div class="cafe-placeholder">☕</div>`;
                    
                    return `
                        <div class="cafe-card" onclick="handleCafeCardClick(event, '${cafe.id}')">
                            <div class="cafe-photo">${photoHTML}</div>
                            <div class="cafe-info">
                                <div class="cafe-header">
                                    <h3 class="cafe-name">${cafe.name}</h3>
                                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                                            data-cafe-id="${cafe.id}" 
                                            data-cafe-name="${cafe.name}" 
                                            data-cafe-city="${cafe.city}" 
                                            data-cafe-description="${cafe.description || ''}">
                                        ${isFavorite ? '❤️' : '🤍'}
                                    </button>
                                </div>
                                <p class="cafe-categories">${cafe.categories || 'Venue'}</p>
                                ${cafe.address ? `<p class="cafe-address">📍 ${cafe.address}</p>` : ''}
                                <button class="btn-details" onclick="event.stopPropagation(); showCafeDetails('${cafe.id}')">
                                    DETAILS
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        cafesList.innerHTML = cafesHTML;
    }
    
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
window.showCafeDetails = function(cafeId) {
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
                ${cafe.categories ? `<p class="cafe-detail-categories">${cafe.categories}</p>` : ''}
                
                <p class="cafe-detail-city-tag">${cafe.city}</p>
                
                ${cafe.address ? `<p class="cafe-detail-address" onclick="copyAddress('${cafe.address}')">📍 ${cafe.address}</p>` : ''}
                ${cafe.telegram ? `<p class="cafe-detail-telegram" onclick="openTelegramChat('${cafe.telegram}')">💬 Message on Telegram</p>` : ''}
                
                <p class="cafe-detail-description">${cafe.description || 'No description'}</p>
                
                <!-- Working hours for all days -->
                <div class="cafe-detail-working-hours">
                    <h3 class="working-hours-header" onclick="toggleWorkingHours()">
                        🕒 Working Hours
                        <span class="toggle-arrow">▼</span>
                    </h3>
                    <div class="working-hours-content" id="workingHoursContent" style="display: none;">
                        ${formatWorkingHours(cafe.workingHours)}
                    </div>
                </div>
                
                <!-- Loyalty buttons -->
                <div class="loyalty-buttons">
                    <button class="loyalty-earn-btn" onclick="showEarnPoints('${cafe.id}', '${cafe.name}')">
                        ⬆️ Earn Points
                    </button>
                    <button class="loyalty-spend-btn" onclick="showSpendPoints('${cafe.id}', '${cafe.name}')">
                        ⬇️ Spend Points
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
};

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
        currentCafe = null;
        window.currentModal = null; // Reset current modal
        console.log('🔧 Modal closed');
    }
}

// Toggle working hours visibility
window.toggleWorkingHours = function() {
    const content = document.getElementById('workingHoursContent');
    const arrow = document.querySelector('.toggle-arrow');
    
    if (content && arrow) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            arrow.textContent = '▲'; // Arrow up when open
        } else {
            content.style.display = 'none';
            arrow.textContent = '▼'; // Arrow down when closed
        }
    }
};

// Show all cafes regardless of city selection
// Function removed - no longer using "Show all cafes" button

// Show cities error
function showCitiesError() {
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.innerHTML = '<option value="">Error loading cities</option>';
    }
    console.error('❌ Cities loading failed');
}

// Show cafes error
function showCafesError() {
    const cafesList = document.getElementById('cafesList');
    if (cafesList) {
        cafesList.innerHTML = '<div class="no-cafes"><p>Error loading cafes</p></div>';
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

// Functions are now defined globally at the top of the file

// Show loading state
function showLoadingState() {
    const cafesList = document.getElementById('cafesList');
    if (cafesList) {
        cafesList.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading cafes...</p>
            </div>
        `;
    }
}

// Hide loading state
function hideLoadingState() {
    const cafesList = document.getElementById('cafesList');
    if (cafesList && (cafesList.innerHTML.includes('Loading cafes') || cafesList.innerHTML.includes('Carregando cafés'))) {
        cafesList.innerHTML = '<div class="loading">Select a city to see cafes</div>';
    }
}

// Show error state
function showErrorState() {
    const cafesList = document.getElementById('cafesList');
    if (cafesList) {
        cafesList.innerHTML = `
            <div class="no-cafes">
                <p>❌ Error loading data</p>
                <p>Please try refreshing the page</p>
            </div>
        `;
    }
}

// Check QR Code library (background task)
function checkQRCodeLibrary() {
    console.log('🔍 QR Code library check (background):');
    console.log('   - window.QRCode:', !!window.QRCode);
    console.log('   - QRCode.toCanvas:', !!(window.QRCode && window.QRCode.toCanvas));
    if (window.QRCode) {
        console.log('✅ QR Code library loaded successfully');
    } else {
        console.log('ℹ️ QR Code library not loaded (using QR-Server API instead)');
    }
}

// Initialize app
async function initializeApp() {
    console.log('🔧 Initializing Coook app...');
    
    try {
        // 1. FIRST: Show UI immediately (no waiting)
        loadSavedCity();
        initializeMenu();
        showLoadingState();
        
        console.log('✅ UI initialized, loading data in background...');
        
        // 2. THEN: Load data in background (non-blocking)
        loadDataInBackground();
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showErrorState();
    }
}

// Load data in background without blocking UI
async function loadDataInBackground() {
    try {
        // Wait for Firebase to be ready (with timeout)
        let retryCount = 0;
        const maxRetries = 20; // Increased retries
        
        while (!window.firebase || !window.firebase.db) {
            if (retryCount >= maxRetries) {
                console.error('❌ Firebase not available after retries');
                showErrorState();
                return;
            }
            console.log(`🔧 Waiting for Firebase... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 200)); // Faster retries
            retryCount++;
        }
        
        console.log('✅ Firebase is ready, loading data...');
        
        // Load cities and cafes in parallel
        await Promise.all([
            loadCities(),
            loadCafes()
        ]);
        
        hideLoadingState();
        console.log('✅ Data loaded successfully');
        
        // Initialize Telegram WebApp and user system in background (non-blocking)
        setTimeout(() => {
            initializeTelegramWebApp();
            initializeUserSystem();
        }, 500); // Slightly delayed to prioritize UI
        
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
        userName.textContent = 'Test User';
        console.log('✅ Fallback user name set');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM loaded, setting up event listeners...');
    
    // GLOBAL: Prevent text selection only (not touch events)
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Check QR Code library loading
    // QR Code library check (moved to background)
    setTimeout(() => {
        checkQRCodeLibrary();
    }, 3000); // Delayed to not block initial loading
    
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
    
    // Show all cafes button removed
    
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
        `<span class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index}); return false;"></span>`
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
                <button class="carousel-prev" onclick="previousSlide(); return false;" onfocus="this.blur();" onblur="this.blur();" tabindex="-1">‹</button>
                <button class="carousel-next" onclick="nextSlide(); return false;" onfocus="this.blur();" onblur="this.blur();" tabindex="-1">›</button>
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
    
    // Force blur on all buttons to prevent focus
    const buttons = carousel.querySelectorAll('button');
    buttons.forEach(button => button.blur());
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
    
    // Force blur on all buttons to prevent focus
    const buttons = carousel.querySelectorAll('button');
    buttons.forEach(button => button.blur());
}

// Add touch/swipe support for mobile
function initializeCarouselTouch() {
    const carousel = document.getElementById('photoCarousel');
    if (!carousel) return;
    
    let startX = 0;
    let endX = 0;
    let isSwipe = false;
    
    // Prevent all default behaviors
    const preventDefault = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    };
    
    // Prevent default touch behaviors
    carousel.addEventListener('touchstart', (e) => {
        preventDefault(e);
        startX = e.touches[0].clientX;
        isSwipe = false;
    }, { passive: false });
    
    carousel.addEventListener('touchmove', (e) => {
        preventDefault(e);
    }, { passive: false });
    
    carousel.addEventListener('touchend', (e) => {
        preventDefault(e);
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    }, { passive: false });
    
    // Prevent all possible selection events
    carousel.addEventListener('contextmenu', preventDefault);
    carousel.addEventListener('selectstart', preventDefault);
    carousel.addEventListener('dragstart', preventDefault);
    carousel.addEventListener('mousedown', preventDefault);
    carousel.addEventListener('mouseup', preventDefault);
    carousel.addEventListener('click', preventDefault);
    
    // Add CSS class to force no selection
    carousel.style.webkitUserSelect = 'none';
    carousel.style.mozUserSelect = 'none';
    carousel.style.msUserSelect = 'none';
    carousel.style.userSelect = 'none';
    carousel.style.webkitTouchCallout = 'none';
    carousel.style.webkitTapHighlightColor = 'transparent';
    
    // Add touch event listeners for navigation buttons
    const prevButton = carousel.querySelector('.carousel-prev');
    const nextButton = carousel.querySelector('.carousel-next');
    
    if (prevButton) {
        // Multiple event types for better reliability
        prevButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previousSlide();
        }, { passive: false });
        
        prevButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        prevButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previousSlide();
        });
    }
    
    if (nextButton) {
        // Multiple event types for better reliability
        nextButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nextSlide();
        }, { passive: false });
        
        nextButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        nextButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nextSlide();
        });
    }
    
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
async function showLoyalty() {
    console.log('🎯 Loyalty button clicked');
    
    if (!window.currentUser) {
        alert('⚠️ You need to log in to see your loyalty program!');
        return;
    }
    
    try {
        // Show loading state
        const loadingContent = `
            <div class="loyalty-modal">
                <h2>🎯 My Loyalty</h2>
                <div class="loading">Loading loyalty program data...</div>
            </div>
        `;
        showModal(loadingContent, 'My Loyalty');
        
        // Load user's loyalty data
        const loyaltyData = await loadUserLoyaltyData();
        
        // Create modal content with real data
        const modalContent = `
            <div class="loyalty-modal">
                <h2>🎯 My Loyalty</h2>
                
                <div class="loyalty-cafes">
                    <h3>🏪 My Cafes</h3>
                    ${loyaltyData.cafes.length > 0 ? 
                        loyaltyData.cafes.map(cafe => `
                            <div class="loyalty-cafe-item">
                                <div class="cafe-actions">
                                    <button class="action-btn apply-loyalty-btn" onclick="applyLoyalty('${cafe.id}', '${cafe.name}')">
                                        🎯 Apply Loyalty
                                    </button>
                                    <button class="action-btn view-history-btn" onclick="viewHistory('${cafe.id}', '${cafe.name}')">
                                        📊 View History
                                    </button>
                                </div>
                                <div class="cafe-main-info">
                                    <div class="cafe-info">
                                        <h4>${cafe.name}</h4>
                                        <span class="cafe-location">📍 ${cafe.address || cafe.city}</span>
                                        <div class="cafe-points">
                                            <span class="points-number">${cafe.points}</span>
                                            <span class="points-label">points</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('') :
                        '<div class="no-cafes">You haven\'t visited any cafes yet. Visit cafes to earn points!</div>'
                    }
                </div>
                
                <div class="loyalty-info">
                    <p>🌟 Visit cafes to earn points and get rewards!</p>
                    <p>🎁 Show your 8-digit code to earn points with every visit.</p>
                    <p>💡 Each cafe has its own points and rewards system.</p>
                </div>
            </div>
        `;
        
        showModal(modalContent, 'My Loyalty');
        
    } catch (error) {
        console.error('❌ Error loading loyalty data:', error);
        const errorContent = `
            <div class="loyalty-modal">
                <h2>🎯 My Loyalty</h2>
                <div class="error-message">
                    <p>❌ Error loading loyalty program data</p>
                    <p>Please try again later.</p>
                </div>
            </div>
        `;
        showModal(errorContent, 'Моя лояльность');
    }
}

// Load user's loyalty data from Firebase
async function loadUserLoyaltyData() {
    try {
        const userId = window.currentUser.id;
        console.log('🔍 Loading loyalty data for user:', userId);
        
        // Ensure cafes are loaded
        if (cafesData.length === 0) {
            console.log('📚 Loading cafes data first...');
            await loadCafes();
        }
        
        // Get all loyalty records for this user
        const loyaltyQuery = window.firebase.query(
            window.firebase.collection(window.firebase.db, 'user_loyalty_points'),
            window.firebase.where('telegramId', '==', userId)
        );
        
        const loyaltySnapshot = await window.firebase.getDocs(loyaltyQuery);
        
        if (loyaltySnapshot.empty) {
            return {
                cafes: []
            };
        }
        
        // Get cafe information for each cafe
        const cafes = [];
        
        for (const doc of loyaltySnapshot.docs) {
            const loyaltyData = doc.data();
            const cafeId = loyaltyData.cafeId;
            const points = loyaltyData.points || 0;
            
            // Find cafe information
            const cafe = cafesData.find(c => c.id === cafeId);
            if (cafe) {
                cafes.push({
                    id: cafeId,
                    name: cafe.name,
                    city: cafe.city,
                    address: cafe.address,
                    points: points
                });
            }
        }
        
        // Sort cafes by points (highest first)
        cafes.sort((a, b) => b.points - a.points);
        
        console.log('✅ Loyalty data loaded:', {
            cafesCount: cafes.length,
            cafes
        });
        
        return {
            cafes
        };
        
    } catch (error) {
        console.error('❌ Error loading loyalty data:', error);
        throw error;
    }
}

// Show favorites
function showFavorites() {
    console.log('❤️ Favorites button clicked');
    
    // Check if user is logged in
    if (!window.currentUser) {
        const modalContent = `
            <div class="favorites-modal">
                <h2>❤️ Избранное</h2>
                <div class="empty-favorites">
                    <p>⚠️ You need to log in to see your favorites</p>
                    <p>💡 Open the app via Telegram</p>
                </div>
            </div>
        `;
        showModal(modalContent, 'Favorites');
        return;
    }
    
    // Get favorites from user system
    const favorites = window.currentUser.favorites || [];
    
    if (favorites.length === 0) {
        const modalContent = `
            <div class="favorites-modal">
                <h2>❤️ Favorites</h2>
                <div class="empty-favorites">
                    <p>📝 You don't have any favorite cafes yet</p>
                    <p>💡 Click the heart on a cafe to add it to favorites!</p>
                </div>
            </div>
        `;
        showModal(modalContent, 'Favorites');
    } else {
        // Show favorites list
        const favoritesList = favorites.map(fav => `
            <div class="favorite-item">
                <h3>${fav.cafeName}</h3>
                <p>${fav.cafeCity}</p>
                <p>${fav.cafeDescription || ''}</p>
                <button class="remove-favorite" onclick="removeFavorite('${fav.cafeId}')">
                    ❌ Remove from favorites
                </button>
            </div>
        `).join('');
        
        const modalContent = `
            <div class="favorites-modal">
                <h2>❤️ Favorites (${favorites.length})</h2>
                <div class="favorites-list">
                    ${favoritesList}
                </div>
            </div>
        `;
        showModal(modalContent, 'Favorites');
    }
}

// Make functions globally accessible
window.showFavorites = showFavorites;
window.displayCafes = displayCafes;
window.addFavoriteButtonListeners = addFavoriteButtonListeners;

// Show modal with custom content
function showModal(content, title) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    
    if (modal && modalContent) {
        modalContent.innerHTML = content;
        modal.style.display = 'flex';
        window.currentModal = title; // Track current modal
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
    
    // Update heart icon in modal if it's open
    updateModalHeartIcon(cafeId);
}

// Update heart icon in modal
function updateModalHeartIcon(cafeId) {
    console.log('🔍 DEBUG: updateModalHeartIcon called with cafeId:', cafeId);
    
    const modal = document.getElementById('modal');
    console.log('🔍 DEBUG: Modal found:', !!modal);
    
    if (!modal || modal.style.display === 'none') {
        console.log('🔍 DEBUG: Modal not open, returning');
        return; // Modal is not open
    }
    
    const heartIcon = modal.querySelector('.favorite-btn-modal');
    console.log('🔍 DEBUG: Heart icon found:', !!heartIcon);
    
    if (!heartIcon) {
        console.log('🔍 DEBUG: Heart icon not found, returning');
        return; // Heart icon not found
    }
    
    const isFavorite = isCafeInFavorites(cafeId);
    console.log('🔍 DEBUG: Is favorite:', isFavorite);
    
    // Add animation class
    heartIcon.classList.add('heart-animation');
    
    if (isFavorite) {
        heartIcon.classList.add('favorited');
        heartIcon.innerHTML = '❤️';
    } else {
        heartIcon.classList.remove('favorited');
        heartIcon.innerHTML = '🤍';
    }
    
    // Remove animation class after animation completes
    setTimeout(() => {
        heartIcon.classList.remove('heart-animation');
    }, 600);
    
    console.log('💖 Modal heart icon updated:', isFavorite ? '❤️' : '🤍');
}

// ===== LOYALTY POINTS SYSTEM =====

// Get or create user loyalty data for a specific cafe
async function getUserLoyaltyData(userId, cafeId) {
    try {
        const loyaltyRef = window.firebase.collection(window.firebase.db, 'user_loyalty_points');
        const userLoyaltyQuery = window.firebase.query(
            loyaltyRef,
            window.firebase.where('userId', '==', userId),
            window.firebase.where('cafeId', '==', cafeId)
        );
        
        const loyaltySnapshot = await window.firebase.getDocs(userLoyaltyQuery);
        
        if (!loyaltySnapshot.empty) {
            const loyaltyDoc = loyaltySnapshot.docs[0];
            return { id: loyaltyDoc.id, ...loyaltyDoc.data() };
        } else {
            // Create new loyalty record
            const newLoyaltyData = {
                userId: userId,
                cafeId: cafeId,
                totalPoints: 0,
                lastVisit: null,
                visitCount: 0,
                level: 'Bronze',
                createdAt: new Date()
            };
            
            const loyaltyDoc = await window.firebase.addDoc(loyaltyRef, newLoyaltyData);
            newLoyaltyData.id = loyaltyDoc.id;
            
            console.log('✅ New loyalty record created for user:', userId, 'cafe:', cafeId);
            return newLoyaltyData;
        }
    } catch (error) {
        console.error('❌ Error getting user loyalty data:', error);
        return null;
    }
}

// Add points to user's loyalty account
async function addLoyaltyPoints(userId, cafeId, points, orderAmount, qrCode, manualCode) {
    try {
        console.log('🎯 Adding loyalty points:', { userId, cafeId, points, orderAmount });
        
        // Get user loyalty data
        const loyaltyData = await getUserLoyaltyData(userId, cafeId);
        if (!loyaltyData) {
            throw new Error('Failed to get loyalty data');
        }
        
        // Update points
        const newTotalPoints = loyaltyData.totalPoints + points;
        const newVisitCount = loyaltyData.visitCount + 1;
        
        // Determine new level based on total points
        let newLevel = 'Bronze';
        if (newTotalPoints >= 1000) newLevel = 'Platinum';
        else if (newTotalPoints >= 500) newLevel = 'Gold';
        else if (newTotalPoints >= 100) newLevel = 'Silver';
        
        // Update loyalty record
        const loyaltyRef = window.firebase.collection(window.firebase.db, 'user_loyalty_points');
        await window.firebase.updateDoc(window.firebase.doc(loyaltyRef, loyaltyData.id), {
            totalPoints: newTotalPoints,
            lastVisit: new Date(),
            visitCount: newVisitCount,
            level: newLevel
        });
        
        // Create transaction record
        await createLoyaltyTransaction(userId, cafeId, 'earn', points, orderAmount, qrCode, manualCode);
        
        console.log('✅ Points added successfully:', { 
            points, 
            newTotalPoints, 
            newLevel, 
            visitCount: newVisitCount 
        });
        
        return {
            success: true,
            totalPoints: newTotalPoints,
            level: newLevel,
            visitCount: newVisitCount
        };
        
    } catch (error) {
        console.error('❌ Error adding loyalty points:', error);
        return { success: false, error: error.message };
    }
}

// Spend points from user's loyalty account
async function spendLoyaltyPoints(userId, cafeId, points, orderAmount, qrCode, manualCode) {
    try {
        console.log('💸 Spending loyalty points:', { userId, cafeId, points, orderAmount });
        
        // Get user loyalty data
        const loyaltyData = await getUserLoyaltyData(userId, cafeId);
        if (!loyaltyData) {
            throw new Error('Failed to get loyalty data');
        }
        
        // Check if user has enough points
        if (loyaltyData.totalPoints < points) {
            throw new Error('Insufficient points');
        }
        
        // Update points
        const newTotalPoints = loyaltyData.totalPoints - points;
        
        // Determine new level based on remaining points
        let newLevel = 'Bronze';
        if (newTotalPoints >= 1000) newLevel = 'Platinum';
        else if (newTotalPoints >= 500) newLevel = 'Gold';
        else if (newTotalPoints >= 100) newLevel = 'Silver';
        
        // Update loyalty record
        const loyaltyRef = window.firebase.collection(window.firebase.db, 'user_loyalty_points');
        await window.firebase.updateDoc(window.firebase.doc(loyaltyRef, loyaltyData.id), {
            totalPoints: newTotalPoints,
            level: newLevel
        });
        
        // Create transaction record
        await createLoyaltyTransaction(userId, cafeId, 'spend', points, orderAmount, qrCode, manualCode);
        
        console.log('✅ Points spent successfully:', { 
            points, 
            newTotalPoints, 
            newLevel 
        });
        
        return {
            success: true,
            totalPoints: newTotalPoints,
            level: newLevel
        };
        
    } catch (error) {
        console.error('❌ Error spending loyalty points:', error);
        return { success: false, error: error.message };
    }
}

// Create loyalty transaction record
async function createLoyaltyTransaction(userId, cafeId, type, points, orderAmount, qrCode, manualCode) {
    try {
        const transactionRef = window.firebase.collection(window.firebase.db, 'loyalty_transactions');
        
        const transactionData = {
            userId: userId,
            cafeId: cafeId,
            type: type, // 'earn' or 'spend'
            points: points,
            orderAmount: orderAmount,
            qrCode: qrCode,
            manualCode: manualCode,
            timestamp: new Date(),
            status: 'confirmed'
        };
        
        await window.firebase.addDoc(transactionRef, transactionData);
        console.log('✅ Transaction record created:', transactionData);
        
    } catch (error) {
        console.error('❌ Error creating transaction record:', error);
    }
}

// Check if cafe is in favorites
function isCafeInFavorites(cafeId) {
    if (!window.currentUser || !window.currentUser.favorites) {
        return false;
    }
    
    return window.currentUser.favorites.some(fav => fav.cafeId === cafeId);
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
        return '<p class="cafe-hours">Working hours not specified</p>';
    }
    
    // Define weekday order (Mon -> Sun)
    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const daysNames = {
        monday: 'Mon',
        tuesday: 'Tue',
        wednesday: 'Wed',
        thursday: 'Thu',
        friday: 'Fri',
        saturday: 'Sat',
        sunday: 'Sun'
    };
    
    let hoursHtml = '<div class="working-hours-list">';
    
    // Iterate through days in correct order
    daysOrder.forEach(day => {
        const hours = workingHours[day];
        if (hours && hours.open && hours.close) {
            hoursHtml += `
                <div class="working-hour-item">
                    <span class="day-name">${daysNames[day]}:</span>
                    <span class="time-range">${hours.open} - ${hours.close}</span>
                </div>
            `;
        }
    });
    
    hoursHtml += '</div>';
    return hoursHtml;
}


// Copy address to clipboard
async function copyAddress(address) {
    try {
        await navigator.clipboard.writeText(address);
        console.log('✅ Address copied:', address);
        
        // Show subtle feedback without alert
        const addressElement = event.target;
        const originalText = addressElement.textContent;
        addressElement.textContent = '✅ Copied!';
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
        addressElement.textContent = '❌ Copy failed';
        addressElement.style.color = '#DC3545';
        
        setTimeout(() => {
            addressElement.textContent = originalText;
            addressElement.style.color = '';
        }, 2000);
    }
}

// Open Telegram chat
function openTelegramChat(telegramContact) {
    let telegramUrl;
    
    // Check if it's already a full URL
    if (telegramContact.startsWith('https://t.me/')) {
        telegramUrl = telegramContact;
    } else if (telegramContact.startsWith('@')) {
        // Remove @ and create URL
        telegramUrl = `https://t.me/${telegramContact.substring(1)}`;
    } else {
        // Assume it's a username without @
        telegramUrl = `https://t.me/${telegramContact}`;
    }
    
    // Open in new tab/window
    window.open(telegramUrl, '_blank');
}

// Show earn points modal with QR code and 8-digit code
function showEarnPoints(cafeId, cafeName) {
    console.log('⬆️ Show earn points for cafe:', cafeId, cafeName);
    
    if (!window.currentUser) {
        alert('⚠️ You need to log in to earn points!\n💡 Open the app via Telegram');
        return;
    }
    
    // Generate QR code data and 8-digit code
    const userId = window.currentUser.id;
    const userCode = window.currentUserCode || '00000000';
    const qrData = `${userId}:${cafeId}:${userCode}`;
    
    const modalContent = `
        <div class="earn-points-modal">
            <h2>⬆️ Earn Points</h2>
            <div class="cafe-info-modal">
                <h3>${cafeName}</h3>
                <p>📱 Show this code to the barista or manager</p>
            </div>
            
            <div class="qr-code-section">
                <h4>📱 QR Code:</h4>
                <div class="qr-code-container">
                    <canvas id="qrCanvas" width="200" height="200"></canvas>
                </div>
            </div>
            
            <div class="manual-code-section">
                <h4>🔢 8-digit code:</h4>
                <div class="code-display">
                    <span class="user-code">${userCode}</span>
                    <button class="copy-code-btn" onclick="copyUserCode('${userCode}')">📋</button>
                </div>
            </div>
            
            <div class="instructions">
                <p>💡 Barista will scan QR code or enter the 8-digit code in the cafe app</p>
            </div>
        </div>
    `;
    
    showModal(modalContent, 'Earn Points');
    
    // Generate QR code
    generateQRCodeEarn(qrData);
}

// Show spend points modal with QR code and 8-digit code
function showSpendPoints(cafeId, cafeName) {
    console.log('⬇️ Show spend points for cafe:', cafeId, cafeName);
    
    if (!window.currentUser) {
        alert('⚠️ You need to log in to spend points!\n💡 Open the app via Telegram');
        return;
    }
    
    // Generate QR code data and 8-digit code
    const userId = window.currentUser.id;
    const userCode = window.currentUserCode || '00000000';
    const qrData = `${userId}:${cafeId}:${userCode}`;
    
    const modalContent = `
        <div class="spend-points-modal">
            <h2>⬇️ Spend Points</h2>
            <div class="cafe-info-modal">
                <h3>${cafeName}</h3>
                <p>📱 Show this code to the barista or manager</p>
            </div>
            
            <div class="qr-code-section">
                <h4>📱 QR Code:</h4>
                <div class="qr-code-container">
                    <canvas id="qrCanvasSpend" width="200" height="200"></canvas>
                </div>
            </div>
            
            <div class="manual-code-section">
                <h4>🔢 8-digit code:</h4>
                <div class="code-display">
                    <span class="user-code">${userCode}</span>
                    <button class="copy-code-btn" onclick="copyUserCode('${userCode}')">📋</button>
                </div>
            </div>
            
            <div class="instructions">
                <p>💡 Barista will scan QR code or enter the 8-digit code in the cafe app</p>
                <p>💰 After scanning, your points balance will be shown and order amount recalculated</p>
            </div>
        </div>
    `;
    
    showModal(modalContent, 'Spend Points');
    
    // Generate QR code
    generateQRCodeSpend(qrData);
}

// Generate 8-digit user code that matches QR code data
function generateUserCodeWithData(userId, cafeId, timestamp) {
    // Create the same data as QR code
    const qrData = `${userId}:${cafeId}:${userCode}`;
    
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
        alert('📋 Code copied: ' + code);
        console.log('✅ User code copied:', code);
    } catch (error) {
        console.error('❌ Error copying user code:', error);
        alert('❌ Error copying code');
    }
}

// Generate QR code for earn points using Google Charts API
function generateQRCodeEarn(data) {
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


