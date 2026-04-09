// Mostrar nombre del usuario autenticado PRIMERO, antes que cualquier otra cosa
// Intentar multiples posibles claves para compatibilidad
document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('userName') 
                    || localStorage.getItem('name') 
                    || localStorage.getItem('nombre')
                    || localStorage.getItem('usuario_nombre');
    const displayName = userName && userName.trim() !== '' ? userName.trim() : 'Usuario';
    document.getElementById('userGreeting').textContent = `Hola, ${displayName} 👋`;

    // Animación de números (Counters)
    const counters = document.querySelectorAll('.value[data-target]');
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      const speed = 200;
      const updateCount = () => {
        const count = +counter.innerText;
        const inc = target / speed;
        if (count < target) {
          counter.innerText = Math.ceil(count + inc);
          setTimeout(updateCount, 1);
        } else {
          counter.innerText = target.toLocaleString() + ' L';
        }
      };
      setTimeout(updateCount, 300);
    });

    // Chart.js con animación suave
    const ctx = document.getElementById('dashboardChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
        datasets: [{
          label: 'Consumo (Litros)',
          data: [350, 420, 380, 500, 450, 600, 480],
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

    // Protección de ruta: Verificar token al cargar la página
    (function verificarAutenticacion() {
      const token = localStorage.getItem('token');
      if (!token) {
        // No hay token, redirigir inmediatamente al login
        window.location.href = 'login.html';
      }
    })();

    // Función para renderizar alertas en la tabla
    function renderizarAlertas(alertas) {
      const tableBody = document.getElementById('alertsTableBody');
      const noAlertsMessage = document.getElementById('noAlertsMessage');
      
      tableBody.innerHTML = '';

      if (!alertas || alertas.length === 0) {
        noAlertsMessage.style.display = 'block';
        return;
      }

      noAlertsMessage.style.display = 'none';
      
      alertas.forEach(alerta => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        
        const fechaCell = document.createElement('td');
        fechaCell.style.padding = '12px 15px';
        fechaCell.style.color = '#cbd5e1';
        fechaCell.textContent = alerta.fecha;
        
        const tipoCell = document.createElement('td');
        tipoCell.style.padding = '12px 15px';
        
        // Color según tipo de alerta
        const tipoBadge = document.createElement('span');
        tipoBadge.style.padding = '4px 10px';
        tipoBadge.style.borderRadius = '6px';
        tipoBadge.style.fontSize = '0.85rem';
        tipoBadge.style.fontWeight = '500';
        
        if (alerta.tipo === 'Advertencia') {
          tipoBadge.style.backgroundColor = 'rgba(251, 191, 36, 0.2)';
          tipoBadge.style.color = '#fbbf24';
        } else if (alerta.tipo === 'Error') {
          tipoBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
          tipoBadge.style.color = '#ef4444';
        } else if (alerta.tipo === 'Información') {
          tipoBadge.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
          tipoBadge.style.color = '#3b82f6';
        } else {
          tipoBadge.style.backgroundColor = 'rgba(148, 163, 184, 0.2)';
          tipoBadge.style.color = '#94a3b8';
        }
        
        tipoBadge.textContent = alerta.tipo;
        tipoCell.appendChild(tipoBadge);
        
        const descripcionCell = document.createElement('td');
        descripcionCell.style.padding = '12px 15px';
        descripcionCell.style.color = '#cbd5e1';
        descripcionCell.textContent = alerta.descripcion;
        
        row.appendChild(fechaCell);
        row.appendChild(tipoCell);
        row.appendChild(descripcionCell);
        
        tableBody.appendChild(row);
      });
    }

    // Obtener datos desde API
    async function cargarDatosDashboard() {
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch('http://localhost:3000/api/datos', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          // Token inválido o expirado
          localStorage.removeItem('token');
          localStorage.removeItem('userName');
          localStorage.removeItem('userEmail');
          window.location.href = 'login.html';
          return;
        }
        
        const data = await response.json();
        
        // Extraer alertas de la respuesta o usar datos simulados temporalmente
        let alertas = data.alertas;
        
        // SIMULACIÓN TEMPORAL: Si no hay alertas en la respuesta, mostrar datos de ejemplo
        if (!alertas || alertas.length === 0) {
          alertas = [
            {
              fecha: '09/04/2026 14:32',
              tipo: 'Advertencia',
              descripcion: 'Consumo de agua elevado detectado en la última hora'
            },
            {
              fecha: '08/04/2026 08:15',
              tipo: 'Error',
              descripcion: 'Fallo en la comunicación con el sensor principal'
            },
            {
              fecha: '07/04/2026 19:48',
              tipo: 'Información',
              descripcion: 'Mantenimiento programado realizado exitosamente'
            }
          ];
        }
        
        renderizarAlertas(alertas);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        // En caso de error, mostrar alertas simuladas igualmente
        renderizarAlertas([
          {
            fecha: '09/04/2026 14:32',
            tipo: 'Advertencia',
            descripcion: 'Consumo de agua elevado detectado en la última hora'
          },
          {
            fecha: '08/04/2026 08:15',
            tipo: 'Error',
            descripcion: 'Fallo en la comunicación con el sensor principal'
          }
        ]);
      }
    }

    // Funcionalidad cerrar sesión
    document.querySelector('.btn-cerrarS').addEventListener('click', function() {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      window.location.href = 'login.html';
    });

    // Cargar datos al iniciar la página
    cargarDatosDashboard();
});