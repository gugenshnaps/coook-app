// Cafe TMA - Sistema de Lealdade JavaScript

// Global variables
let currentCafe = null;
let cafes = [];
let loyaltySettings = null;
let qrScanner = null;
let qrScannerSpend = null;
let currentCustomer = null;

// Wait for Firebase to initialize
function waitForFirebase() {
    if (window.firebase && window.firebase.db) {
        console.log('🔥 Firebase ready, initializing cafe TMA...');
        initializeCafeTMA();
    } else {
        console.log('⏳ Waiting for Firebase...');
        setTimeout(waitForFirebase, 100);
    }
}

// Initialize cafe TMA
async function initializeCafeTMA() {
    try {
        console.log('🚀 Initializing cafe TMA...');
        
        // Load cafes from Firebase
        await loadCafes();
        
        // Populate cafe selector
        populateCafeSelector();
        
        // Set up real-time listeners
        setupCafesListener();
        
        console.log('✅ Cafe TMA initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing cafe TMA:', error);
        showError('Erro ao inicializar TMA: ' + error.message);
    }
}

// Load cafes from Firebase
async function loadCafes() {
    try {
        console.log('📚 Loading cafes from Firebase...');
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafesSnapshot = await window.firebase.getDocs(cafesRef);
        
        cafes = [];
        cafesSnapshot.forEach((doc) => {
            cafes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('✅ Cafes loaded:', cafes.length);
    } catch (error) {
        console.error('❌ Error loading cafes:', error);
        throw error;
    }
}

// Set up real-time listener for cafes
function setupCafesListener() {
    try {
        console.log('👂 Setting up cafes listener...');
        const cafesRef = window.firebase.collection(window.firebase.db, 'cafes');
        const cafesQuery = window.firebase.query(cafesRef, window.firebase.orderBy('name'));
        
        window.firebase.onSnapshot(cafesQuery, (snapshot) => {
            console.log('🔄 Cafes updated in real-time');
            cafes = [];
            snapshot.forEach((doc) => {
                cafes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Update cafe selector if not logged in
            if (!currentCafe) {
                populateCafeSelector();
            }
        });
        
        console.log('✅ Cafes listener set up');
    } catch (error) {
        console.error('❌ Error setting up cafes listener:', error);
    }
}

// Populate cafe selector
function populateCafeSelector() {
    const cafeSelect = document.getElementById('cafeSelect');
    if (!cafeSelect) return;
    
    // Clear existing options
    cafeSelect.innerHTML = '<option value="">Escolha um café...</option>';
    
    // Add cafe options
    cafes.forEach(cafe => {
        const option = document.createElement('option');
        option.value = cafe.id;
        option.textContent = `${cafe.name} - ${cafe.city}`;
        cafeSelect.appendChild(option);
    });
    
    console.log('✅ Cafe selector populated with', cafes.length, 'cafes');
}

// Login cafe owner
async function loginCafe() {
    const cafeId = document.getElementById('cafeSelect').value;
    const password = document.getElementById('cafePassword').value;
    
    if (!cafeId || !password) {
        showError('Por favor, preencha todos os campos!');
        return;
    }
    
    try {
        console.log('🔐 Attempting login for cafe:', cafeId);
        
        // Verify password
        const isPasswordValid = await verifyCafePassword(cafeId, password);
        
        if (isPasswordValid) {
            // Get cafe info
            const cafe = cafes.find(c => c.id === cafeId);
            if (cafe) {
                currentCafe = cafe;
                
                // Load loyalty settings
                await loadLoyaltySettings(cafeId);
                
                // Show dashboard
                showDashboard();
                
                console.log('✅ Login successful for cafe:', cafe.name);
            }
        } else {
            showError('Senha incorreta!');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showError('Erro no login: ' + error.message);
    }
}

// Verify cafe password
async function verifyCafePassword(cafeId, password) {
    try {
        // Get password record from Firebase
        const passwordsRef = window.firebase.collection(window.firebase.db, 'cafe_passwords');
        const passwordQuery = window.firebase.query(passwordsRef, window.firebase.where('cafeId', '==', cafeId));
        const passwordSnapshot = await window.firebase.getDocs(passwordQuery);
        
        if (passwordSnapshot.empty) {
            console.log('❌ No password record found for cafe:', cafeId);
            return false;
        }
        
        const passwordDoc = passwordSnapshot.docs[0];
        const storedHash = passwordDoc.data().passwordHash;
        
        // Hash input password and compare
        const inputHash = await hashPassword(password);
        
        console.log('🔍 Password verification:', inputHash === storedHash);
        return inputHash === storedHash;
    } catch (error) {
        console.error('❌ Error verifying password:', error);
        return false;
    }
}

// Hash password (same as in admin.js)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_coook_app');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Load loyalty settings for cafe
async function loadLoyaltySettings(cafeId) {
    try {
        console.log('⚙️ Loading loyalty settings for cafe:', cafeId);
        
        // Check if loyalty settings exist
        const loyaltyRef = window.firebase.collection(window.firebase.db, 'cafe_loyalty_settings');
        const loyaltyQuery = window.firebase.query(loyaltyRef, window.firebase.where('cafeId', '==', cafeId));
        const loyaltySnapshot = await window.firebase.getDocs(loyaltyQuery);
        
        if (loyaltySnapshot.empty) {
            console.log('📝 No loyalty settings found, creating defaults...');
            await createDefaultLoyaltySettings(cafeId);
        } else {
            const loyaltyDoc = loyaltySnapshot.docs[0];
            loyaltySettings = loyaltyDoc.data();
            console.log('✅ Loyalty settings loaded:', loyaltySettings);
        }
        
        // Update UI with current settings
        updateLoyaltySettingsUI();
        
    } catch (error) {
        console.error('❌ Error loading loyalty settings:', error);
        // Create default settings on error
        await createDefaultLoyaltySettings(cafeId);
    }
}

// Create default loyalty settings
async function createDefaultLoyaltySettings(cafeId) {
    try {
        const cafe = cafes.find(c => c.id === cafeId);
        if (!cafe) return;
        
        const defaultSettings = {
            cafeId: cafeId,
            cafeName: cafe.name,
            loyaltyEnabled: true,
            basePointsPerReal: 1.0,
            minOrderAmount: 10,
            maxPointsPerOrder: 100,
            specialDaysEnabled: false,
            specialDays: {
                monday: 1.0, tuesday: 1.0, wednesday: 1.0,
                thursday: 1.0, friday: 1.0, saturday: 1.0, sunday: 1.0
            },
            timePeriodsEnabled: false,
            timePeriods: {
                morning: 1.0, afternoon: 1.0, evening: 1.0
            },
            personalConditionsEnabled: false,
            personalConditions: {
                vip: 2.0, birthday: 3.0, firstOrder: 2.0
            }
        };
        
        const loyaltyRef = window.firebase.collection(window.firebase.db, 'cafe_loyalty_settings');
        await window.firebase.addDoc(loyaltyRef, defaultSettings);
        
        loyaltySettings = defaultSettings;
        console.log('✅ Default loyalty settings created');
        
    } catch (error) {
        console.error('❌ Error creating default loyalty settings:', error);
    }
}

// Update loyalty settings UI
function updateLoyaltySettingsUI() {
    if (!loyaltySettings) return;
    
    // Basic settings
    document.getElementById('loyaltyEnabled').checked = loyaltySettings.loyaltyEnabled;
    document.getElementById('basePointsPerReal').value = loyaltySettings.basePointsPerReal;
    document.getElementById('minOrderAmount').value = loyaltySettings.minOrderAmount;
    document.getElementById('maxPointsPerOrder').value = loyaltySettings.maxPointsPerOrder;
    
    // Special days
    document.getElementById('specialDaysEnabled').checked = loyaltySettings.specialDaysEnabled;
    document.getElementById('mondayMultiplier').value = loyaltySettings.specialDays.monday;
    document.getElementById('tuesdayMultiplier').value = loyaltySettings.specialDays.tuesday;
    document.getElementById('wednesdayMultiplier').value = loyaltySettings.specialDays.wednesday;
    document.getElementById('thursdayMultiplier').value = loyaltySettings.specialDays.thursday;
    document.getElementById('fridayMultiplier').value = loyaltySettings.specialDays.friday;
    document.getElementById('saturdayMultiplier').value = loyaltySettings.specialDays.saturday;
    document.getElementById('sundayMultiplier').value = loyaltySettings.specialDays.sunday;
    
    // Time periods
    document.getElementById('timePeriodsEnabled').checked = loyaltySettings.timePeriodsEnabled;
    document.getElementById('morningMultiplier').value = loyaltySettings.timePeriods.morning;
    document.getElementById('afternoonMultiplier').value = loyaltySettings.timePeriods.afternoon;
    document.getElementById('eveningMultiplier').value = loyaltySettings.timePeriods.evening;
    
    // Personal conditions
    document.getElementById('personalConditionsEnabled').checked = loyaltySettings.personalConditionsEnabled;
    document.getElementById('vipMultiplier').value = loyaltySettings.personalConditions.vip;
    document.getElementById('birthdayMultiplier').value = loyaltySettings.personalConditions.birthday;
    document.getElementById('firstOrderMultiplier').value = loyaltySettings.personalConditions.firstOrder;
    
    console.log('✅ Loyalty settings UI updated');
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');
    
    // Update cafe info
    document.getElementById('cafeName').textContent = currentCafe.name;
    document.getElementById('cafeLocation').textContent = `${currentCafe.city} - ${currentCafe.address}`;
    
    // Load daily statistics
    loadDailyStats();
    
    console.log('✅ Dashboard shown for cafe:', currentCafe.name);
}

// Load daily statistics
async function loadDailyStats() {
    try {
        // For now, we'll use placeholder data
        // In the future, this will load real statistics from Firebase
        document.getElementById('dailyVisitors').textContent = '12';
        document.getElementById('dailyTransactions').textContent = '8';
        document.getElementById('dailyPoints').textContent = '156';
        
        console.log('📊 Daily stats loaded (placeholder)');
    } catch (error) {
        console.error('❌ Error loading daily stats:', error);
    }
}

// Show earn points modal
function showEarnPoints() {
    document.getElementById('earnPointsModal').style.display = 'block';
    console.log('💰 Earn points modal shown');
}

// Show spend points modal
function showSpendPoints() {
    document.getElementById('spendPointsModal').style.display = 'block';
    console.log('🎯 Spend points modal shown');
}

// Show loyalty settings modal
function showLoyaltySettings() {
    document.getElementById('loyaltySettingsModal').style.display = 'block';
    console.log('⚙️ Loyalty settings modal shown');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Reset customer data and UI
    if (modalId === 'earnPointsModal') {
        document.getElementById('customerInfoEarn').style.display = 'none';
        document.getElementById('confirmEarnBtn').disabled = true;
        document.getElementById('manualCodeInput').value = '';
        if (qrScanner) stopQRScanner();
    } else if (modalId === 'spendPointsModal') {
        document.getElementById('customerInfo').style.display = 'none';
        document.getElementById('confirmSpendBtn').disabled = true;
        document.getElementById('manualCodeInputSpend').value = '';
        if (qrScannerSpend) stopQRScannerSpend();
    }
    
    currentCustomer = null;
    console.log('❌ Modal closed:', modalId);
}

// QR Scanner Functions
async function startQRScanner() {
    try {
        console.log('📱 Starting QR scanner for earn points...');
        
        const video = document.getElementById('qrVideo');
        const container = document.getElementById('qrScannerContainer');
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        video.srcObject = stream;
        container.style.display = 'block';
        
        // Start scanning
        qrScanner = setInterval(() => {
            scanQRCode(video, 'earn');
        }, 100);
        
        console.log('✅ QR scanner started');
        
    } catch (error) {
        console.error('❌ Error starting QR scanner:', error);
        showError('Erro ao acessar câmera: ' + error.message);
    }
}

async function startQRScannerSpend() {
    try {
        console.log('📱 Starting QR scanner for spend points...');
        
        const video = document.getElementById('qrVideoSpend');
        const container = document.getElementById('qrScannerContainerSpend');
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        video.srcObject = stream;
        container.style.display = 'block';
        
        // Start scanning
        qrScannerSpend = setInterval(() => {
            scanQRCode(video, 'spend');
        }, 100);
        
        console.log('✅ QR scanner started for spending');
        
    } catch (error) {
        console.error('❌ Error starting QR scanner:', error);
        showError('Erro ao acessar câmera: ' + error.message);
    }
}

function stopQRScanner() {
    if (qrScanner) {
        clearInterval(qrScanner);
        qrScanner = null;
    }
    
    const video = document.getElementById('qrVideo');
    const container = document.getElementById('qrScannerContainer');
    
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    
    container.style.display = 'none';
    console.log('❌ QR scanner stopped');
}

function stopQRScannerSpend() {
    if (qrScannerSpend) {
        clearInterval(qrScannerSpend);
        qrScannerSpend = null;
    }
    
    const video = document.getElementById('qrVideoSpend');
    const container = document.getElementById('qrScannerContainerSpend');
    
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    
    container.style.display = 'none';
    console.log('❌ QR scanner stopped for spending');
}

async function scanQRCode(video, mode) {
    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            console.log('📱 QR Code detected:', code.data);
            
            // Stop scanner
            if (mode === 'earn') {
                stopQRScanner();
            } else {
                stopQRScannerSpend();
            }
            
            // Process QR data
            await processQRData(code.data, mode);
        }
        
    } catch (error) {
        console.error('❌ Error scanning QR code:', error);
    }
}

async function processQRData(qrData, mode) {
    try {
        // Parse QR data: user_id:cafe_id:timestamp
        const parts = qrData.split(':');
        
        if (parts.length !== 3) {
            showError('QR Code inválido!');
            return;
        }
        
        const userId = parts[0];
        const cafeId = parts[1];
        const timestamp = parts[2];
        
        // Verify cafe ID matches current cafe
        if (cafeId !== currentCafe.id) {
            showError('QR Code não é para este café!');
            return;
        }
        
        // Load customer data
        await loadCustomerData(userId, mode);
        
    } catch (error) {
        console.error('❌ Error processing QR data:', error);
        showError('Erro ao processar QR Code: ' + error.message);
    }
}

// Manual Code Input Functions
async function applyManualCode() {
    const codeInput = document.getElementById('manualCodeInput');
    const code = codeInput.value.trim();
    
    if (!code || code.length !== 8) {
        showError('Por favor, insira um código de 8 dígitos!');
        return;
    }
    
    if (!/^\d{8}$/.test(code)) {
        showError('O código deve conter apenas números!');
        return;
    }
    
    try {
        console.log('⌨️ Processing manual code:', code);
        
        // Convert 8-digit code to user ID (simple mapping for demo)
        // In real app, this would be a proper lookup table
        const userId = await convertCodeToUserId(code);
        
        if (userId) {
            await loadCustomerData(userId, 'earn');
        } else {
            showError('Código inválido! Cliente não encontrado.');
        }
        
    } catch (error) {
        console.error('❌ Error processing manual code:', error);
        showError('Erro ao processar código: ' + error.message);
    }
}

async function applyManualCodeSpend() {
    const codeInput = document.getElementById('manualCodeInputSpend');
    const code = codeInput.value.trim();
    
    if (!code || code.length !== 8) {
        showError('Por favor, insira um código de 8 dígitos!');
        return;
    }
    
    if (!/^\d{8}$/.test(code)) {
        showError('O código deve conter apenas números!');
        return;
    }
    
    try {
        console.log('⌨️ Processing manual code for spending:', code);
        
        // Convert 8-digit code to user ID
        const userId = await convertCodeToUserId(code);
        
        if (userId) {
            await loadCustomerData(userId, 'spend');
        } else {
            showError('Código inválido! Cliente não encontrado.');
        }
        
    } catch (error) {
        console.error('❌ Error processing manual code:', error);
        showError('Erro ao processar código: ' + error.message);
    }
}

// Convert 8-digit code to user ID (demo implementation)
async function convertCodeToUserId(code) {
    try {
        // For demo purposes, we'll use a simple algorithm
        // In real app, this would query a database
        
        // Convert code to number and use modulo to get user ID
        const codeNum = parseInt(code);
        const userId = (codeNum % 1000) + 1; // Generate user ID 1-1000
        
        console.log('🔄 Converting code', code, 'to user ID:', userId);
        return userId.toString();
        
    } catch (error) {
        console.error('❌ Error converting code to user ID:', error);
        return null;
    }
}

// Load customer data for both QR and manual input
async function loadCustomerData(userId, mode) {
    try {
        console.log('👤 Loading customer data for user:', userId, 'mode:', mode);
        
        // For demo purposes, we'll create mock customer data
        // In real app, this would query Firebase for user data
        
        const customerData = {
            id: userId,
            name: `Cliente ${userId}`,
            points: Math.floor(Math.random() * 100) + 10, // Random points 10-110
            status: 'Ativo'
        };
        
        currentCustomer = customerData;
        
        // Display customer info based on mode
        if (mode === 'earn') {
            displayCustomerInfoEarn(customerData);
        } else {
            displayCustomerInfoSpend(customerData);
        }
        
        // Enable confirm buttons
        if (mode === 'earn') {
            document.getElementById('confirmEarnBtn').disabled = false;
        } else {
            document.getElementById('confirmSpendBtn').disabled = false;
        }
        
        console.log('✅ Customer data loaded:', customerData);
        
    } catch (error) {
        console.error('❌ Error loading customer data:', error);
        showError('Erro ao carregar dados do cliente: ' + error.message);
    }
}

// Display customer info for earn points
function displayCustomerInfoEarn(customer) {
    const customerInfo = document.getElementById('customerInfoEarn');
    const customerName = document.getElementById('customerNameEarn');
    const customerPoints = document.getElementById('customerPointsEarn');
    const customerStatus = document.getElementById('customerStatusEarn');
    
    customerName.textContent = customer.name;
    customerPoints.textContent = customer.points;
    customerStatus.textContent = customer.status;
    
    customerInfo.style.display = 'block';
}

// Display customer info for spend points
function displayCustomerInfoSpend(customer) {
    const customerInfo = document.getElementById('customerInfo');
    const customerName = document.getElementById('customerName');
    const customerPoints = document.getElementById('customerPoints');
    const discountValue = document.getElementById('discountValue');
    
    customerName.textContent = customer.name;
    customerPoints.textContent = customer.points;
    discountValue.textContent = `R$ ${(customer.points * 0.10).toFixed(2)}`;
    
    customerInfo.style.display = 'block';
}

// Calculate points to earn
function calculatePointsToEarn() {
    const orderAmount = parseFloat(document.getElementById('orderAmount').value) || 0;
    if (!loyaltySettings || !loyaltySettings.loyaltyEnabled) {
        document.getElementById('pointsToEarn').textContent = '0';
        return;
    }
    
    let points = orderAmount * loyaltySettings.basePointsPerReal;
    
    // Apply special day multiplier
    if (loyaltySettings.specialDaysEnabled) {
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayMultiplier = loyaltySettings.specialDays[dayNames[today]] || 1.0;
        points *= dayMultiplier;
    }
    
    // Apply time period multiplier
    if (loyaltySettings.timePeriodsEnabled) {
        const hour = new Date().getHours();
        let timeMultiplier = 1.0;
        
        if (hour >= 9 && hour < 12) {
            timeMultiplier = loyaltySettings.timePeriods.morning;
        } else if (hour >= 12 && hour < 18) {
            timeMultiplier = loyaltySettings.timePeriods.afternoon;
        } else if (hour >= 18 && hour < 22) {
            timeMultiplier = loyaltySettings.timePeriods.evening;
        }
        
        points *= timeMultiplier;
    }
    
    // Apply limits
    if (orderAmount < loyaltySettings.minOrderAmount) {
        points = 0;
    }
    
    if (points > loyaltySettings.maxPointsPerOrder) {
        points = loyaltySettings.maxPointsPerOrder;
    }
    
    document.getElementById('pointsToEarn').textContent = Math.floor(points);
}

// Confirm earn points
async function confirmEarnPoints() {
    if (!currentCustomer) {
        showError('Por favor, escaneie o QR code ou insira o código do cliente primeiro!');
        return;
    }
    
    const orderAmount = parseFloat(document.getElementById('orderAmount').value);
    const pointsToEarn = parseInt(document.getElementById('pointsToEarn').textContent);
    
    if (!orderAmount || orderAmount <= 0) {
        showError('Por favor, insira um valor válido para o pedido!');
        return;
    }
    
    if (pointsToEarn <= 0) {
        showError('Pedido muito pequeno para ganhar pontos!');
        return;
    }
    
    try {
        // Here you would create a loyalty transaction record
        // For now, we'll just show success
        showSuccess(`✅ ${pointsToEarn} pontos confirmados para ${currentCustomer.name} (pedido de R$ ${orderAmount.toFixed(2)})!`);
        
        // Close modal
        closeModal('earnPointsModal');
        
        // Clear form and reset
        document.getElementById('orderAmount').value = '';
        document.getElementById('pointsToEarn').textContent = '0';
        document.getElementById('customerInfoEarn').style.display = 'none';
        document.getElementById('confirmEarnBtn').disabled = true;
        currentCustomer = null;
        
        // Refresh daily stats
        loadDailyStats();
        
        console.log('✅ Points earned:', pointsToEarn, 'for customer:', currentCustomer.name, 'order:', orderAmount);
        
    } catch (error) {
        console.error('❌ Error confirming points:', error);
        showError('Erro ao confirmar pontos: ' + error.message);
    }
}

// Calculate final amount with discount
function calculateFinalAmount() {
    const orderAmount = parseFloat(document.getElementById('spendOrderAmount').value) || 0;
    const customerPoints = parseInt(document.getElementById('customerPoints').textContent) || 0;
    
    if (orderAmount <= 0) {
        document.getElementById('finalAmount').textContent = 'R$ 0,00';
        return;
    }
    
    // Convert points to discount (1 point = R$ 0.10)
    const discountAmount = Math.min(customerPoints * 0.10, orderAmount * 0.5); // Max 50% discount
    const finalAmount = Math.max(orderAmount - discountAmount, 0);
    
    document.getElementById('finalAmount').textContent = `R$ ${finalAmount.toFixed(2)}`;
}

// Confirm spend points
async function confirmSpendPoints() {
    if (!currentCustomer) {
        showError('Por favor, escaneie o QR code ou insira o código do cliente primeiro!');
        return;
    }
    
    const orderAmount = parseFloat(document.getElementById('spendOrderAmount').value);
    const finalAmount = parseFloat(document.getElementById('finalAmount').textContent.replace('R$ ', '').replace(',', '.'));
    
    if (!orderAmount || orderAmount <= 0) {
        showError('Por favor, insira um valor válido para o pedido!');
        return;
    }
    
    try {
        // Here you would create a loyalty transaction record
        // For now, we'll just show success
        const discountAmount = orderAmount - finalAmount;
        showSuccess(`✅ Desconto aplicado para ${currentCustomer.name}! Valor final: R$ ${finalAmount.toFixed(2)} (desconto: R$ ${discountAmount.toFixed(2)})`);
        
        // Close modal
        closeModal('spendPointsModal');
        
        // Clear form and reset
        document.getElementById('spendOrderAmount').value = '';
        document.getElementById('finalAmount').textContent = 'R$ 0,00';
        document.getElementById('customerInfo').style.display = 'none';
        document.getElementById('confirmSpendBtn').disabled = true;
        currentCustomer = null;
        
        // Refresh daily stats
        loadDailyStats();
        
        console.log('✅ Points spent for customer:', currentCustomer.name, 'order:', orderAmount, 'final amount:', finalAmount);
        
    } catch (error) {
        console.error('❌ Error confirming discount:', error);
        showError('Erro ao aplicar desconto: ' + error.message);
    }
}

// Save loyalty settings
async function saveLoyaltySettings() {
    try {
        if (!currentCafe || !loyaltySettings) {
            showError('Erro: configurações não carregadas!');
            return;
        }
        
        // Collect current settings from UI
        const newSettings = {
            loyaltyEnabled: document.getElementById('loyaltyEnabled').checked,
            basePointsPerReal: parseFloat(document.getElementById('basePointsPerReal').value) || 1.0,
            minOrderAmount: parseInt(document.getElementById('minOrderAmount').value) || 10,
            maxPointsPerOrder: parseInt(document.getElementById('maxPointsPerOrder').value) || 100,
            specialDaysEnabled: document.getElementById('specialDaysEnabled').checked,
            specialDays: {
                monday: parseFloat(document.getElementById('mondayMultiplier').value) || 1.0,
                tuesday: parseFloat(document.getElementById('tuesdayMultiplier').value) || 1.0,
                wednesday: parseFloat(document.getElementById('wednesdayMultiplier').value) || 1.0,
                thursday: parseFloat(document.getElementById('thursdayMultiplier').value) || 1.0,
                friday: parseFloat(document.getElementById('fridayMultiplier').value) || 1.0,
                saturday: parseFloat(document.getElementById('saturdayMultiplier').value) || 1.0,
                sunday: parseFloat(document.getElementById('sundayMultiplier').value) || 1.0
            },
            timePeriodsEnabled: document.getElementById('timePeriodsEnabled').checked,
            timePeriods: {
                morning: parseFloat(document.getElementById('morningMultiplier').value) || 1.0,
                afternoon: parseFloat(document.getElementById('afternoonMultiplier').value) || 1.0,
                evening: parseFloat(document.getElementById('eveningMultiplier').value) || 1.0
            },
            personalConditionsEnabled: document.getElementById('personalConditionsEnabled').checked,
            personalConditions: {
                vip: parseFloat(document.getElementById('vipMultiplier').value) || 2.0,
                birthday: parseFloat(document.getElementById('birthdayMultiplier').value) || 3.0,
                firstOrder: parseFloat(document.getElementById('firstOrderMultiplier').value) || 2.0
            }
        };
        
        // Update Firebase
        const loyaltyRef = window.firebase.collection(window.firebase.db, 'cafe_loyalty_settings');
        const loyaltyQuery = window.firebase.query(loyaltyRef, window.firebase.where('cafeId', '==', currentCafe.id));
        const loyaltySnapshot = await window.firebase.getDocs(loyaltyQuery);
        
        if (!loyaltySnapshot.empty) {
            const loyaltyDoc = loyaltySnapshot.docs[0];
            await window.firebase.updateDoc(loyaltyDoc.ref, newSettings);
        }
        
        // Update local settings
        loyaltySettings = { ...loyaltySettings, ...newSettings };
        
        showSuccess('✅ Configurações salvas com sucesso!');
        console.log('✅ Loyalty settings saved:', newSettings);
        
    } catch (error) {
        console.error('❌ Error saving loyalty settings:', error);
        showError('Erro ao salvar configurações: ' + error.message);
    }
}

// Logout
function logout() {
    currentCafe = null;
    loyaltySettings = null;
    
    document.getElementById('dashboardScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    
    // Clear password field
    document.getElementById('cafePassword').value = '';
    
    console.log('🚪 Logout successful');
}

// Utility functions
function showSuccess(message) {
    // Simple success message (can be enhanced with a proper toast)
    alert('✅ ' + message);
}

function showError(message) {
    // Simple error message (can be enhanced with a proper toast)
    alert('❌ ' + message);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Cafe TMA DOM loaded');
    
    // Add event listeners for real-time calculations
    const orderAmountInput = document.getElementById('orderAmount');
    if (orderAmountInput) {
        orderAmountInput.addEventListener('input', calculatePointsToEarn);
    }
    
    const spendOrderAmountInput = document.getElementById('spendOrderAmount');
    if (spendOrderAmountInput) {
        spendOrderAmountInput.addEventListener('input', calculateFinalAmount);
    }
    
    // Initialize
    waitForFirebase();
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
