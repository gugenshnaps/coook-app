// ===== SIMPLE USER SYSTEM FOR COOK APP =====

// Current user data
let currentUser = null;

// Initialize user system
async function initializeUserSystem() {
    console.log('👤 Initializing simple user system...');
    
    // Get Telegram user data from URL
    const telegramUser = getTelegramUserData();
    
    if (telegramUser && telegramUser.id) {
        console.log('✅ Telegram user found:', telegramUser.id);
        
        // Create or get user from Firebase
        currentUser = await createOrGetUser(telegramUser);
        
        if (currentUser) {
            console.log('✅ User system initialized for:', currentUser.firstName);
            // Load user's favorites
            await loadUserFavorites();
        }
    } else {
        console.log('⚠️ No Telegram user data available');
    }
}

// Get Telegram user data from URL hash
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
    if (!currentUser) return;
    
    try {
        console.log('❤️ Loading favorites for user:', currentUser.firstName);
        
        const favoritesRef = window.firebase.collection(window.firebase.db, 'favorites');
        const userFavoritesQuery = window.firebase.query(
            favoritesRef,
            window.firebase.where('userId', '==', currentUser.telegramId)
        );
        
        const favoritesSnapshot = await window.firebase.getDocs(userFavoritesQuery);
        
        if (!favoritesSnapshot.empty) {
            const userFavorites = favoritesSnapshot.docs[0].data();
            currentUser.favorites = userFavorites.cafes || [];
            console.log('❤️ User favorites loaded:', currentUser.favorites.length);
        } else {
            // Create empty favorites document
            await window.firebase.addDoc(favoritesRef, {
                userId: currentUser.telegramId,
                cafes: []
            });
            currentUser.favorites = [];
            console.log('❤️ Empty favorites document created');
        }
    } catch (error) {
        console.error('❌ Error loading favorites:', error);
        currentUser.favorites = [];
    }
}

// Add cafe to favorites
async function addToFavorites(cafe) {
    if (!currentUser) {
        console.log('⚠️ No user logged in');
        return;
    }
    
    try {
        console.log('❤️ Adding cafe to favorites:', cafe.name);
        
        // Check if cafe is already in favorites
        if (currentUser.favorites.some(fav => fav.cafeId === cafe.id)) {
            console.log('⚠️ Cafe already in favorites');
            return;
        }
        
        // Add to Firebase
        const favoritesRef = window.firebase.collection(window.firebase.db, 'favorites');
        const userFavoritesQuery = window.firebase.query(
            favoritesRef,
            window.firebase.where('userId', '==', currentUser.telegramId)
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
                userId: currentUser.telegramId,
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
        currentUser.favorites.push({
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
    if (!currentUser) return;
    
    try {
        console.log('❌ Removing cafe from favorites:', cafeId);
        
        // Remove from Firebase
        const favoritesRef = window.firebase.collection(window.firebase.db, 'favorites');
        const userFavoritesQuery = window.firebase.query(
            favoritesRef,
            window.firebase.where('userId', '==', currentUser.telegramId)
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
        currentUser.favorites = currentUser.favorites.filter(fav => fav.cafeId !== cafeId);
        
        console.log('✅ Cafe removed from favorites');
    } catch (error) {
        console.error('❌ Error removing from favorites:', error);
    }
}

// Check if cafe is in favorites
function isCafeInFavorites(cafeId) {
    if (!currentUser || !currentUser.favorites) return false;
    return currentUser.favorites.some(fav => fav.cafeId === cafeId);
}

// Get current user
function getCurrentUser() {
    return currentUser;
}
