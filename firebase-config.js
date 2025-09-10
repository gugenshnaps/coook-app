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

console.log(' Firebase functions available:', Object.keys(window.firebase));
