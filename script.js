import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Credenciales de configuración de Firebase
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

// Inicialización de la aplicación y la base de datos
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referencias a los nodos dentro de Firebase
const referenciaSensores = ref(database, 'sensores');
const referenciaPaciente = ref(database, 'paciente_actual');

// Elementos de la interfaz web
const formularioPaciente = document.getElementById('formulario-paciente');
const resumenPaciente = document.getElementById('resumen-paciente');
const btnEditar = document.getElementById('btn-editar');

// guardar formulario en firebase
formularioPaciente.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const datosPaciente = {
        nombre: document.getElementById('nombre').value,
        rut: document.getElementById('rut').value,
        edad: document.getElementById('edad').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value,
        fechaEvaluacion: new Date().toLocaleString('es-CL')
    };

    set(referenciaPaciente, datosPaciente)
        .then(() => {
            alert("Ficha del paciente guardada exitosamente.");
        })
        .catch((error) => {
            console.error("Error al guardar la ficha del paciente:", error);
            alert("Ocurrió un error al guardar los datos.");
        });
});

// boton editar
btnEditar.addEventListener('click', () => {
    formularioPaciente.classList.remove('oculto');
    resumenPaciente.classList.add('oculto');
});

// ecuchar los cambios del paciente en tiempo real 
onValue(referenciaPaciente, (snapshot) => {
    const paciente = snapshot.val();
    if (paciente) {
        document.getElementById('resumen-nombre').textContent = paciente.nombre;
        document.getElementById('resumen-rut').textContent = paciente.rut;
        document.getElementById('resumen-edad').textContent = paciente.edad;
        document.getElementById('resumen-correo').textContent = paciente.correo;
        document.getElementById('resumen-telefono').textContent = paciente.telefono;

        formularioPaciente.classList.add('oculto');
        resumenPaciente.classList.remove('oculto');
    }
});

// ecuchar en tiempo real sensores
onValue(referenciaSensores, (snapshot) => {
    const datos = snapshot.val();
    if (datos) {
        if (datos.ecg !== undefined) document.getElementById('ecg-val').textContent = datos.ecg;
        if (datos.emg !== undefined) document.getElementById('emg-val').textContent = datos.emg;
    }
});