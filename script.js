import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Credenciales de Firebase
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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referencias a los nodos de Firebase
const referenciaSensores = ref(database, 'sensores');
const referenciaPaciente = ref(database, 'paciente_actual');
const referenciaDolor = ref(database, 'registros_dolor');

const tabMonitoreo = document.getElementById('tab-monitoreo');
const tabAutoevaluacion = document.getElementById('tab-autoevaluacion');
const seccionMonitoreo = document.getElementById('seccion-monitoreo');
const seccionAutoevaluacion = document.getElementById('seccion-autoevaluacion');

// cambio de pestaña
tabMonitoreo.addEventListener('click', () => {
    tabMonitoreo.classList.add('activa');
    tabAutoevaluacion.classList.remove('activa');
    seccionMonitoreo.classList.remove('oculto');
    seccionAutoevaluacion.classList.add('oculto');
});

tabAutoevaluacion.addEventListener('click', () => {
    tabAutoevaluacion.classList.add('activa');
    tabMonitoreo.classList.remove('activa');
    seccionAutoevaluacion.classList.remove('oculto');
    seccionMonitoreo.classList.add('oculto');
});

// ELEMENTOS DE FICHA DE PACIENTE
const formularioPaciente = document.getElementById('formulario-paciente');
const resumenPaciente = document.getElementById('resumen-paciente');
const btnEditar = document.getElementById('btn-editar');

const formularioDolor = document.getElementById('formulario-dolor');
const sliderDolor = document.getElementById('nivel-dolor');
const displayDolor = document.getElementById('valor-dolor-display');
const inputFechaHora = document.getElementById('fecha-hora-dolor');
const listaDolor = document.getElementById('lista-dolor');

// inicializar fecha y hora
if (inputFechaHora) {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    inputFechaHora.value = ahora.toISOString().slice(0, 16);
}

sliderDolor.addEventListener('input', (e) => {
    displayDolor.textContent = e.target.value;
});

// ficha del paciente
formularioPaciente.addEventListener('submit', (e) => {
    e.preventDefault();
    const datosPaciente = {
        nombre: document.getElementById('nombre').value,
        rut: document.getElementById('rut').value,
        edad: document.getElementById('edad').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value,
        fechaEvaluacion: new Date().toLocaleString('es-CL')
    };

    set(referenciaPaciente, datosPaciente)
        .then(() => alert("Ficha guardada con éxito"))
        .catch(err => console.error(err));
});

btnEditar.addEventListener('click', () => {
    formularioPaciente.classList.remove('oculto');
    resumenPaciente.classList.add('oculto');
});

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

// registro del dolor paciente
formularioDolor.addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoRegistro = {
        fechaHora: document.getElementById('fecha-hora-dolor').value,
        nivelDolor: parseInt(sliderDolor.value),
        nota: document.getElementById('nota-dolor').value || "Sin observaciones adicionales",
        timestamp: Date.now()
    };

    push(referenciaDolor, nuevoRegistro)
        .then(() => {
            alert("Registro de dolor guardado con éxito.");
            document.getElementById('nota-dolor').value = '';
        })
        .catch(err => console.error(err));
});

onValue(referenciaDolor, (snapshot) => {
    const datos = snapshot.val();
    listaDolor.innerHTML = '';

    if (datos) {
        const registros = Object.values(datos).sort((a, b) => b.timestamp - a.timestamp);
        registros.forEach((reg) => {
            const li = document.createElement('li');
            let nivelClase = 'bajo';
            if (reg.nivelDolor >= 8) nivelClase = 'alto';
            else if (reg.nivelDolor >= 5) nivelClase = 'medio';

            const fechaFormateada = new Date(reg.fechaHora).toLocaleString('es-CL', {
                dateStyle: 'short',
                timeStyle: 'short'
            });

            li.className = `item-registro ${nivelClase}`;
            li.innerHTML = `
                <div>
                    <strong>${fechaFormateada}</strong> - ${reg.nota}
                </div>
                <span class="badge-dolor ${nivelClase}">Dolor: ${reg.nivelDolor}/10</span>
            `;
            listaDolor.appendChild(li);
        });
    } else {
        listaDolor.innerHTML = '<p style="color: #888; text-align: center;">No hay registros de dolor guardados.</p>';
    }
});

// escuchar en tiempo real sensores
onValue(referenciaSensores, (snapshot) => {
    const datos = snapshot.val();
    if (datos) {
        if (datos.ecg !== undefined) document.getElementById('ecg-val').textContent = datos.ecg;
        if (datos.emg !== undefined) document.getElementById('emg-val').textContent = datos.emg;
    }
});