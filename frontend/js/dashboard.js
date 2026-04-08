// Mostrar nombre del usuario autenticado PRIMERO, antes que cualquier otra cosa
// Intentar multiples posibles claves para compatibilidad
const userName = localStorage.getItem('userName') 
                || localStorage.getItem('name') 
                || localStorage.getItem('nombre')
                || localStorage.getItem('usuario_nombre');
const displayName = userName && userName.trim() !== '' ? userName.trim() : 'Usuario';
document.getElementById('userGreeting').textContent = `Hola, ${displayName} 👋`;

// Función de animación de números (Counters)
function animateCounter(element, target) {
    const speed = 200;
    element.innerText = '0';
    
    const updateCount = () => {
        const count = +element.innerText;
        const inc = target / speed;
        if (count < target) {
            element.innerText = Math.ceil(count + inc);
            setTimeout(updateCount, 1);
        } else {
            element.innerText = target.toLocaleString() + ' L';
        }
    };
    setTimeout(updateCount, 300);
}

// Cargar datos del dashboard desde la API
async function cargarDatosDashboard() {
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
        // No hay token, redirigir al login
        window.location.href = 'login.html';
        return;
    }

    try {
        const respuesta = await fetch('https://landingpage-dashboard-app-production.up.railway.app/api/datos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!respuesta.ok) {
            // Token inválido o error de autenticación
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            window.location.href = 'login.html';
            return;
        }

        const datos = await respuesta.json();
        
        // Actualizar tarjetas con datos recibidos
        // Litros totales
        const litrosTotales = datos.litros_totales || 0;
        const cardLitrosTotales = document.querySelectorAll('.stat-card .value')[0];
        animateCounter(cardLitrosTotales, litrosTotales);

        // Litros filtrados hoy
        const litrosHoy = datos.litros_hoy || 0;
        const cardLitrosHoy = document.querySelectorAll('.stat-card .value')[1];
        animateCounter(cardLitrosHoy, litrosHoy);

        // Calidad del agua
        const calidadAgua = datos.calidad_agua || 0;
        const cardCalidad = document.querySelectorAll('.stat-card .value')[2];
        cardCalidad.innerText = `${calidadAgua}%`;

        // Estado del filtro
        const estadoFiltro = datos.estado_filtro || 'Desconocido';
        // Si no existe la tarjeta del filtro la creamos dinámicamente
        const cardsGrid = document.querySelector('.cards-grid');
        if (cardsGrid.querySelectorAll('.stat-card').length < 4) {
            const tarjetaFiltro = document.createElement('div');
            tarjetaFiltro.className = 'stat-card';
            tarjetaFiltro.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4>Estado del Filtro</h4>
                        <div class="value" style="color: ${estadoFiltro === 'bueno' ? '#10b981' : estadoFiltro === 'regular' ? '#f59e0b' : '#ef4444'};">${estadoFiltro.charAt(0).toUpperCase() + estadoFiltro.slice(1)}</div>
                    </div>
                    <div style="font-size: 2em; opacity: 0.8;">🔧</div>
                </div>
            `;
            cardsGrid.appendChild(tarjetaFiltro);
        }

        // Mostrar alertas si existen
        if (datos.alertas && datos.alertas.length > 0) {
            console.log('Alertas recibidas:', datos.alertas);
            // Aquí se podrían mostrar las alertas en la interfaz gráfica
        }

    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        // Manejar error de conexión
        alert('Error de conexión. Por favor intenta nuevamente.');
    }
}

// Variable global para la instancia del gráfico
let dashboardChart;

// Inicializar gráfico
function inicializarGrafico(datosConsumo = [350, 420, 380, 500, 450, 600, 480]) {
    const ctx = document.getElementById('dashboardChart').getContext('2d');
    dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
            datasets: [{
                label: 'Consumo (Litros)',
                data: datosConsumo,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.15)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#007bff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255,255,255,0.05)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255,255,255,0.05)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Cargar datos históricos de consumo
async function cargarDatosHistoricos() {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    try {
        const respuesta = await fetch('https://landingpage-dashboard-app-production.up.railway.app/api/historico', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (respuesta.ok && dashboardChart) {
            const datosHistoricos = await respuesta.json();
            
            // Extraer solo los valores de litros para el gráfico
            const valoresLitros = datosHistoricos.map(dia => dia.litros);
            
            // Actualizar datos del gráfico con los últimos 7 días
            dashboardChart.data.datasets[0].data = valoresLitros;
            dashboardChart.update();
        }

    } catch (error) {
        console.error('Error al cargar datos históricos:', error);
    }
}

// Funcionalidad cerrar sesión
document.querySelector('.btn-cerrarS').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
});

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar gráfico primero
    inicializarGrafico();
    
    // Cargar datos desde la API
    cargarDatosDashboard();
    
    // Cargar datos históricos para actualizar el gráfico
    cargarDatosHistoricos();
});
