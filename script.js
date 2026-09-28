import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGFDeHTy-0mz4LSX9g0Gr4NdYODKOr-nI",
  authDomain: "datos-sensores-5df32.firebaseapp.com",
  databaseURL: "https://datos-sensores-5df32-default-rtdb.firebaseio.com",
  projectId: "datos-sensores-5df32",
  storageBucket: "datos-sensores-5df32.firebasestorage.app",
  messagingSenderId: "733044138892",
  appId: "1:733044138892:web:8cfb308ec53af98e72aca9",
  measurementId: "G-065H36DNBY"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referencia al nodo de los sensores
const sensorRef = ref(database, 'sensores');

// Escuchar lecturas en tiempo real
onValue(sensorRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        if (data.ecg !== undefined) document.getElementById('ecg-val').textContent = data.ecg;
        if (data.emg !== undefined) document.getElementById('emg-val').textContent = data.emg;
        if (data.gsr !== undefined) document.getElementById('gsr-val').textContent = data.gsr;
    }
});