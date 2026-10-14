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

// Referencias Firebase
const refSensores = ref(database, 'sensores');
const refPaciente = ref(database, 'paciente_actual');
const refDolor = ref(database, 'registros_dolor');

// ESTADO GLOBAL DE LA INTERFAZ
let nivelDolorSeleccionado = 7;
let tipoDolorSeleccionado = 'Ahora'; // 'Ahora' o 'Anterior'
let zonasMarcadas = [
    { zona: 'Hombro derecho', nivel: 3, tipo: 'Anterior' },
    { zona: 'Espalda alta izquierdo', nivel: 5, tipo: 'Ahora' },
    { zona: 'Lumbar', nivel: 7, tipo: 'Ahora' },
    { zona: 'Isquiotibiales derecho', nivel: 4, tipo: 'Anterior' }
];

let ultimoEcg = 7905.1;
let ultimoEmg = 4277.8;

// 1. ESCUCHAR SENSORES ESP32
onValue(refSensores, (snapshot) => {
    const datos = snapshot.val();
    if (datos) {
        if (datos.ecg !== undefined) {
            ultimoEcg = datos.ecg;
            document.getElementById('ecg-val').textContent = datos.ecg;
        }
        if (datos.emg !== undefined) {
            ultimoEmg = datos.emg;
            document.getElementById('emg-val').textContent = datos.emg;
        }
    }
});

// 2. SELECCIÓN DE ESCALA DE DOLOR (1-10)
const botonesEscala = document.querySelectorAll('.btn-nivel');
botonesEscala.forEach(btn => {
    btn.addEventListener('click', (e) => {
        botonesEscala.forEach(b => b.classList.remove('seleccionado'));
        e.target.classList.add('seleccionado');
        nivelDolorSeleccionado = parseInt(e.target.getAttribute('data-val'));
    });
});

// 3. TOGGLE TIPO DE DOLOR (AHORA / ANTES)
const btnAhora = document.getElementById('btn-tipo-ahora');
const btnAntes = document.getElementById('btn-tipo-antes');

btnAhora.addEventListener('click', () => {
    btnAhora.classList.add('activo');
    btnAntes.classList.remove('activo');
    tipoDolorSeleccionado = 'Ahora';
});

btnAntes.addEventListener('click', () => {
    btnAntes.classList.add('activo');
    btnAhora.classList.remove('activo');
    tipoDolorSeleccionado = 'Anterior';
});

// 4. MANIQUÍ INTERACTIVO (CLICK EN ZONAS)
const elementosZona = document.querySelectorAll('.zona-musculo');
elementosZona.forEach(el => {
    el.addEventListener('click', (e) => {
        const nombreZona = e.target.getAttribute('data-zona');
        
        // Asignar color dinámico según nivel de dolor
        const colores = {
            1: '#2a9d8f', 2: '#2a9d8f', 3: '#e9c46a', 4: '#e9c46a',
            5: '#f4a261', 6: '#f4a261', 7: '#e76f51', 8: '#e76f51',
            9: '#b71c1c', 10: '#b71c1c'
        };

        e.target.style.fill = colores[nivelDolorSeleccionado];

        // Evitar duplicados simples
        const existeIndex = zonasMarcadas.findIndex(z => z.zona === nombreZona);
        if (existeIndex >= 0) {
            zonasMarcadas[existeIndex] = { zona: nombreZona, nivel: nivelDolorSeleccionado, tipo: tipoDolorSeleccionado };
        } else {
            zonasMarcadas.push({ zona: nombreZona, nivel: nivelDolorSeleccionado, tipo: tipoDolorSeleccionado });
        }

        renderizarZonasMarcadas();
    });
});

function renderizarZonasMarcadas() {
    const lista = document.getElementById('lista-zonas-activas');
    lista.innerHTML = '';

    let maxDolor = 0;
    zonasMarcadas.forEach(z => {
        if (z.nivel > maxDolor) maxDolor = z.nivel;
        const li = document.createElement('li');
        li.className = 'item-zona-marcada';
        li.innerHTML = `
            <span>${z.zona} <span class="badge-tipo-chico">${z.tipo}</span></span>
            <strong>${z.nivel}/10</strong>
        `;
        lista.appendChild(li);
    });

    document.getElementById('zonas-resumen-badge').textContent = `${zonasMarcadas.length} zonas marcadas · máx. ${maxDolor}/10`;
}

document.getElementById('btn-limpiar-maniqui').addEventListener('click', () => {
    zonasMarcadas = [];
    elementosZona.forEach(el => el.style.fill = '#e2e8f0');
    renderizarZonasMarcadas();
});

// 5. GUARDAR EN HISTORIAL (FIREBASE)
document.getElementById('btn-guardar-historial').addEventListener('click', () => {
    if (zonasMarcadas.length === 0) {
        alert("Por favor toque el maniquí para seleccionar al menos una zona de dolor.");
        return;
    }

    const maxDolorRegistro = Math.max(...zonasMarcadas.map(z => z.nivel));
    const nombresZonas = zonasMarcadas.map(z => z.zona).join(', ');

    const horaActual = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    const nuevoRegistro = {
        hora: horaActual,
        zonas: nombresZonas,
        tipo: tipoDolorSeleccionado,
        nivelDolor: maxDolorRegistro,
        ecg: ultimoEcg,
        emg: ultimoEmg,
        timestamp: Date.now()
    };

    push(refDolor, nuevoRegistro).then(() => {
        alert("Registro guardado con éxito en el historial.");
    });
});

// 6. RENDERIZAR HISTORIAL DE DOLOR DEDE FIREBASE Y DIBUJAR GRÁFICO
onValue(refDolor, (snapshot) => {
    const datos = snapshot.val();
    const tbody = document.getElementById('tbody-historial');
    tbody.innerHTML = '';

    if (datos) {
        const registros = Object.values(datos).sort((a, b) => a.timestamp - b.timestamp);
        
        let maxDolorAbsoluto = 0;
        let horaMax = '--:--';
        let puntosGrafico = [];

        registros.forEach(reg => {
            if (reg.nivelDolor > maxDolorAbsoluto) {
                maxDolorAbsoluto = reg.nivelDolor;
                horaMax = reg.hora;
            }

            puntosGrafico.push({ hora: reg.hora, dolor: reg.nivelDolor });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${reg.hora}</td>
                <td>${reg.zonas}</td>
                <td><span class="badge-tipo-chico">${reg.tipo}</span></td>
                <td><span class="badge-dolor-tabla niv-${reg.nivelDolor}">${reg.nivelDolor}/10</span></td>
                <td>${reg.ecg}</td>
                <td>${reg.emg}</td>
                <td><a href="#" style="color: var(--primary-blue); font-weight: bold;">Ver</a></td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar métricas generales
        document.getElementById('dolor-max-val').textContent = maxDolorAbsoluto;
        document.getElementById('cant-registros').textContent = registros.length;
        document.getElementById('txt-dolor-max').textContent = `${maxDolorAbsoluto}/10`;
        document.getElementById('txt-hora-max').textContent = `(${horaMax})`;

        // Dibujar gráfico en Canvas
        dibujarGraficoEvolucion(puntosGrafico);
    }
});

// FUNCIÓN PARA DIBUJAR GRÁFICO CANVAS SIMPLE
function dibujarGraficoEvolucion(puntos) {
    const canvas = document.getElementById('grafico-evolucion');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (puntos.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 2;

    const stepX = canvas.width / (puntos.length - 1);
    
    puntos.forEach((p, index) => {
        const x = index * stepX;
        const y = canvas.height - (p.dolor / 10 * (canvas.height - 20)) - 10;

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Dibujar puntos
    puntos.forEach((p, index) => {
        const x = index * stepX;
        const y = canvas.height - (p.dolor / 10 * (canvas.height - 20)) - 10;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#b71c1c';
        ctx.fill();
    });
}

// Inicializar vista al cargar
renderizarZonasMarcadas();