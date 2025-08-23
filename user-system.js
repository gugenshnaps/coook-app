// ===== SIMPLE USER SYSTEM FOR COOK APP =====

// Current user data - make it global for access from script.js
window.currentUser = null;

// Initialize user system
async function initializeUserSystem() {
    console.log('👤 Initializing simple user system...');
    
    // Get Telegram user data from URL
    const telegramUser = getTelegramUserData();
    
    if (telegramUser && telegramUser.id) {
        console.log('✅ Telegram user found:', telegramUser.id);
        
        // Create or get user from Firebase
        window.currentUser = await createOrGetUser(telegramUser);
        
        if (window.currentUser) {
            console.log('✅ User system initialized for:', window.currentUser.firstName);
            // Load user's favorites
            await loadUserFavorites();
        }
    } else {
        console.log('⚠️ No Telegram user data available');
        
        // For local testing - create a test user
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🧪 Creating test user for local development...');
            window.currentUser = {
                id: 'test-user-001',
                telegramId: 'test-001',
                firstName: 'Usuário Teste',
                lastName: 'Local',
                username: 'testuser',
                photoUrl: '',
                favorites: [],
                createdAt: new Date()
            };
            console.log('✅ Test user created:', window.currentUser.firstName);
        }
    }
}

// Get Telegram user data from URL hash
function getTelegramUserData() {
    console.log('🔍 DEBUG: window.location.hash:', window.location.hash);
    console.log('🔍 DEBUG: window.location.search:', window.location.search);
    console.log('🔍 DEBUG: window.location.href:', window.location.href);
    
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tgWebAppData = hashParams.get('tgWebAppData');
    
    console.log('🔍 DEBUG: tgWebAppData from hash:', tgWebAppData);

    // Also check window.location.search, as Telegram sometimes uses it
    let tgWebAppDataFromSearch = null;
    const searchParams = new URLSearchParams(window.location.search);
    tgWebAppDataFromSearch = searchParams.get('tgWebAppData');
    console.log('🔍 DEBUG: tgWebAppData from search:', tgWebAppDataFromSearch);

    const finalTgWebAppData = tgWebAppData || tgWebAppDataFromSearch;

    if (finalTgWebAppData) {
        console.log('🔍 DEBUG: Found tgWebAppData:', finalTgWebAppData);
        try {
            // Attempt to decode multiple times in case of double encoding
            let decodedData = decodeURIComponent(finalTgWebAppData);
            console.log('🔍 DEBUG: Decoded once:', decodedData);

            // Check if it needs further decoding (e.g., if it still contains %22 for quotes)
            if (decodedData.includes('%')) {
                decodedData = decodeURIComponent(decodedData);
                console.log('🔍 DEBUG: Decoded twice:', decodedData);
            }

            const userMatch = decodedData.match(/user=([^&]+)/);
            
            if (userMatch) {
                const userString = decodeURIComponent(userMatch[1]);
                console.log('🔍 DEBUG: User string:', userString);
                const userData = JSON.parse(userString);
                console.log('🔍 DEBUG: Parsed user data:', userData);
                return userData;
            } else {
                console.log('🔍 DEBUG: No user= parameter found in decoded data.');
            }
        } catch (error) {
            console.error('❌ Error parsing Telegram user data:', error);
        }
    } else {
        console.log('🔍 DEBUG: No tgWebAppData found in hash or search.');
    }
    
    return null;
}

// Create or get user from Firebase
async function createOrGetUser(telegramUser) {
    try {
        const usersRef = window.firebase.collection(window.firebase.db, 'users');
        
        // Check if user exists
        const userQuery = window.firebase.query(
            usersRef,
            window.firebase.where('telegramId', '==', telegramUser.id.toString())
        );
        
        const userSnapshot = await window.firebase.getDocs(userQuery);
        
        if (!userSnapshot.empty) {
            // User exists, return user data
            const userDoc = userSnapshot.docs[0];
            const userData = { id: userDoc.id, ...userDoc.data() };
            console.log('✅ Existing user found:', userData.firstName);
            return userData;
        } else {
            // Create new user
            const newUser = {
                telegramId: telegramUser.id.toString(),
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name || '',
                username: telegramUser.username || '',
                photoUrl: telegramUser.photo_url || '',
                createdAt: new Date()
            };
            
            const userDoc = await window.firebase.addDoc(usersRef, newUser);
            newUser.id = userDoc.id;
            
            console.log('✅ New user created:', newUser.firstName);
            return newUser;
        }
    } catch (error) {
        console.error('❌ Error creating/getting user:', error);
        return null;
    }
}

// Load user favorites
async function loadUserFavorites() {
    if (!window.currentUser) return;
    
    try {
        console.log('❤️ Loading favorites for user:', window.currentUser.firstName);
        
        const favoritesRef = window.firebase.collection(window.firebase.db, 'favorites');
        const userFavoritesQuery = window.firebase.query(
            favoritesRef,
            window.firebase.where('userId', '==', window.currentUser.telegramId)
        );
        
        const favoritesSnapshot = await window.firebase.getDocs(userFavoritesQuery);
        
        if (!favoritesSnapshot.empty) {
            const userFavorites = favoritesSnapshot.docs[0].data();
            window.currentUser.favorites = userFavorites.cafes || [];
            console.log('❤️ User favorites loaded:', window.currentUser.favorites.length);
        } else {
            // Create empty favorites document
            await window.firebase.addDoc(favoritesRef, {
                userId: window.currentUser.telegramId,
                cafes: []
            });
            window.currentUser.favorites = [];
            console.log('❤️ Empty favorites document created');
        }
    } catch (error) {
        console.error('❌ Error loading favorites:', error);
        window.currentUser.favorites = [];
    }
}

// Add cafe to favorites
async function addToFavorites(cafe) {
    if (!window.currentUser) {
        console.log('⚠️ No user logged in');
        return;
    }
    
    try {
        console.log('❤️ Adding cafe to favorites:', cafe.name);
        
        // Check if cafe is already in favorites
        if (window.currentUser.favorites.some(fav => fav.cafeId === cafe.id)) {
            console.log('⚠️ Cafe already in favorites');
            return;
        }
        
        // Add to Firebase
        const favoritesRef = window.firebase.collection(window.firebase.db, 'favorites');
        const userFavoritesQuery = window.firebase.query(
            favoritesRef,
            window.firebase.where('userId', '==', window.currentUser.telegramId)
        );
        
        const favoritesSnapshot = await window.firebase.getDocs(userFavoritesQuery);
        
        if (!favoritesSnapshot.empty) {
            // Update existing favorites
            const favoritesDoc = favoritesSnapshot.docs[0];
            const newCafe = {
                cafeId: cafe.id,
                cafeName: cafe.name,
                cafeCity: cafe.city,
                cafeDescription: cafe.description,
                addedAt: new Date()
            };
            
            await window.firebase.updateDoc(favoritesDoc.ref, {
                cafes: window.firebase.arrayUnion(newCafe)
            });
        } else {
            // Create new favorites document
            await window.firebase.addDoc(favoritesRef, {
                userId: window.currentUser.telegramId,
                cafes: [{
                    cafeId: cafe.id,
                    cafeName: cafe.name,
                    cafeCity: cafe.city,
                    cafeDescription: cafe.description,
                    addedAt: new Date()
                }]
            });
        }
        
        // Update local user data
        window.currentUser.favorites.push({
            cafeId: cafe.id,
            cafeName: cafe.name,
            cafeCity: cafe.city,
            cafeDescription: cafe.description,
            addedAt: new Date()
        });
        
        console.log('✅ Cafe added to favorites');
    } catch (error) {
        console.error('❌ Error adding to favorites:', error);
    }
}

// Remove cafe from favorites
async function removeFavorite(cafeId) {
    if (!window.currentUser) return;
    
    try {
        console.log('❌ Removing cafe from favorites:', cafeId);
        
        // Remove from Firebase
        const favoritesRef = window.firebase.collection(window.firebase.db, 'favorites');
        const userFavoritesQuery = window.firebase.query(
            favoritesRef,
            window.firebase.where('userId', '==', window.currentUser.telegramId)
        );
        
        const favoritesSnapshot = await window.firebase.getDocs(userFavoritesQuery);
        
        if (!favoritesSnapshot.empty) {
            const favoritesDoc = favoritesSnapshot.docs[0];
            const currentFavorites = favoritesDoc.data().cafes;
            const updatedFavorites = currentFavorites.filter(fav => fav.cafeId !== cafeId);
            
            await window.firebase.updateDoc(favoritesDoc.ref, {
                cafes: updatedFavorites
            });
        }
        
        // Update local user data
        window.currentUser.favorites = window.currentUser.favorites.filter(fav => fav.cafeId !== cafeId);
        
        console.log('✅ Cafe removed from favorites');
    } catch (error) {
        console.error('❌ Error removing from favorites:', error);
    }
}

// Check if cafe is in favorites
function isCafeInFavorites(cafeId) {
    if (!window.currentUser || !window.currentUser.favorites) return false;
    return window.currentUser.favorites.some(fav => fav.cafeId === cafeId);
}

// Get current user
function getCurrentUser() {
    return window.currentUser;
}
