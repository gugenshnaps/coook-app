// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCBv4tfDPHboApf6CXtUqLIReQA4KzjQJg",
    authDomain: "coook-app.firebaseapp.com",
    projectId: "coook-app",
    storageBucket: "coook-app.firebasestorage.app",
    messagingSenderId: "1027223490741",
    appId: "1:1027223490741:web:a56a826d5d16d517f2aefc",
    measurementId: "G-1XZV0W4QPR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Make Firebase available globally
window.firebase = {
    db,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    arrayUnion
};

// Export Firebase functions for ES6 imports
export { 
    db,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    arrayUnion
};

console.log('🔥 Firebase functions available:', Object.keys(window.firebase));

// Loyalty System Functions
export async function createUserCode(telegramId) {
    try {
        // Check if user already has a code
        const existingCodeQuery = query(
            collection(db, 'user_codes'),
            where('telegramId', '==', telegramId),
            where('isActive', '==', true)
        );
        const existingCodeSnapshot = await getDocs(existingCodeQuery);

        if (!existingCodeSnapshot.empty) {
            const existingCode = existingCodeSnapshot.docs[0].data();
            return existingCode.userCode;
        }

        // Generate new 8-digit code
        let userCode;
        let isUnique = false;

        while (!isUnique) {
            userCode = Math.floor(10000000 + Math.random() * 90000000).toString();

            // Check if code is unique
            const codeQuery = query(
                collection(db, 'user_codes'),
                where('userCode', '==', userCode),
                where('isActive', '==', true)
            );
            const codeSnapshot = await getDocs(codeQuery);
            isUnique = codeSnapshot.empty;
        }

        // Save user code
        await addDoc(collection(db, 'user_codes'), {
            telegramId: telegramId,
            userCode: userCode,
            createdAt: new Date(),
            isActive: true
        });

        return userCode;
    } catch (error) {
        console.error('Error creating user code:', error);
        throw error;
    }
}

export async function getUserCode(telegramId) {
    try {
        const codeQuery = query(
            collection(db, 'user_codes'),
            where('telegramId', '==', telegramId),
            where('isActive', '==', true)
        );
        const codeSnapshot = await getDocs(codeQuery);

        if (codeSnapshot.empty) {
            return null;
        }

        return codeSnapshot.docs[0].data().userCode;
    } catch (error) {
        console.error('Error getting user code:', error);
        throw error;
    }
}

export async function findUserByCode(userCode) {
    try {
        const codeQuery = query(
            collection(db, 'user_codes'),
            where('userCode', '==', userCode),
            where('isActive', '==', true)
        );
        const codeSnapshot = await getDocs(codeQuery);

        if (codeSnapshot.empty) {
            return null;
        }

        const codeData = codeSnapshot.docs[0].data();
        return {
            telegramId: codeData.telegramId,
            userCode: codeData.userCode
        };
    } catch (error) {
        console.error('Error finding user by code:', error);
        throw error;
    }
}

export async function createLoyaltyAccount(telegramId, cafeId) {
    try {
        const loyaltyQuery = query(
            collection(db, 'user_loyalty_points'),
            where('telegramId', '==', telegramId),
            where('cafeId', '==', cafeId)
        );
        const loyaltySnapshot = await getDocs(loyaltyQuery);

        if (loyaltySnapshot.empty) {
            await addDoc(collection(db, 'user_loyalty_points'), {
                telegramId: telegramId,
                cafeId: cafeId,
                points: 0,
                lastUpdated: new Date()
            });
        }
    } catch (error) {
        console.error('Error creating loyalty account:', error);
        throw error;
    }
}

export async function updateLoyaltyPoints(telegramId, cafeId, pointsChange) {
    try {
        const loyaltyQuery = query(
            collection(db, 'user_loyalty_points'),
            where('telegramId', '==', telegramId),
            where('cafeId', '==', cafeId)
        );
        const loyaltySnapshot = await getDocs(loyaltyQuery);

        if (loyaltySnapshot.empty) {
            throw new Error('Loyalty account not found');
        }

        const loyaltyDoc = loyaltySnapshot.docs[0];
        const currentPoints = loyaltyDoc.data().points;
        const newPoints = Math.max(0, currentPoints + pointsChange);

        await updateDoc(loyaltyDoc.ref, {
            points: newPoints,
            lastUpdated: new Date()
        });

        return newPoints;
    } catch (error) {
        console.error('Error updating loyalty points:', error);
        throw error;
    }
}

export async function getLoyaltyPoints(telegramId, cafeId) {
    try {
        const loyaltyQuery = query(
            collection(db, 'user_loyalty_points'),
            where('telegramId', '==', telegramId),
            where('cafeId', '==', cafeId)
        );
        const loyaltySnapshot = await getDocs(loyaltyQuery);

        if (loyaltySnapshot.empty) {
            return 0;
        }

        return loyaltySnapshot.docs[0].data().points;
    } catch (error) {
        console.error('Error getting loyalty points:', error);
        throw error;
    }
}