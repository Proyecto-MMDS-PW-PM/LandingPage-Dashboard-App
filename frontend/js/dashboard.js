const API_URL = 'https://landingpage-dashboard-app-production.up.railway.app/api';

document.addEventListener('DOMContentLoaded', function () {
  // --- Mostrar nombre del usuario ---
  const userName = localStorage.getItem('userName')
    || localStorage.getItem('name')
    || localStorage.getItem('nombre')
    || localStorage.getItem('usuario_nombre');
  const displayName = userName && userName.trim() !== '' ? userName.trim() : 'Usuario';
  document.getElementById('userGreeting').textContent = `Hola, ${displayName} 👋`;

  // --- Protección de ruta (verificar token) ---
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // --- Referencias a elementos del DOM ---
  const litrosTotalesElem = document.getElementById('litrosTotalesElem');
  const litrosHoyElem = document.getElementById('litrosHoyElem');
  const calidadAguaElem = document.getElementById('calidadAguaElem');
  const btnCerrar = document.querySelector('.btn-cerrarS');

  // --- Función para renderizar alertas ---
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
      const tipoBadge = document.createElement('span');
      tipoBadge.classList.add('alerta-badge');

      if (alerta.tipo === 'Advertencia') {
        tipoBadge.classList.add('alerta-advertencia');
      } else if (alerta.tipo === 'Error') {
        tipoBadge.classList.add('alerta-error');
      } else {
        tipoBadge.classList.add('alerta-informacion');
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

  // --- Función para actualizar la gráfica con datos del histórico ---
  let chartInstance = null;
  function actualizarGrafica(historico) {
    const ctx = document.getElementById('dashboardChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    // Generar los 7 dias de la semana siempre
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Si no hay datos, usar valores por defecto para toda la semana
    let datosLitros = [0, 0, 0, 0, 0, 0, 0];

    if (historico && historico.length > 0) {
      // Rellenar datos que vienen del servidor
      historico.forEach((item, index) => {
        if (index < 7) {
          datosLitros[index] = Math.max(0, item.litros || 0);
        }
      });
    }

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: diasSemana,
        datasets: [{
          label: 'Litros filtrados',
          data: datosLitros,
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
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          y: {
            min: 0,
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' }
          }
        },
        animation: { duration: 1500, easing: 'easeOutQuart' }
      }
    });
  }

  // --- Función principal para cargar datos del dashboard y gráfica ---
  async function cargarDatosDashboard() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // 1. Obtener datos actuales (dashboard)
      const resDatos = await fetch(`${API_URL}/datos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resDatos.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
      }
      const datos = await resDatos.json();
      console.log('Datos del dashboard:', datos);

      // Actualizar tarjetas (ajusta los nombres según lo que devuelva el backend)
      const litrosTotales = datos.litros_totales || datos.litrosTotales || 0;
      const litrosHoy = datos.litros_hoy || datos.litrosHoy || 0;
      const calidad = datos.calidad_agua || datos.calidadAgua || 'Sin datos';

      if (litrosTotalesElem) litrosTotalesElem.innerText = litrosTotales.toLocaleString() + ' L';
      if (litrosHoyElem) litrosHoyElem.innerText = litrosHoy.toLocaleString() + ' L';
      if (calidadAguaElem) {
        let calidadTexto = '';
        let color = '#94a3b8'; // gris por defecto

        if (typeof calidad === 'number') {
          // Es un número, mostramos como porcentaje y definimos color según valor
          calidadTexto = `${calidad}%`;
          if (calidad >= 80) {
            color = '#10b981'; // verde
          } else if (calidad >= 50) {
            color = '#f59e0b'; // naranja
          } else {
            color = '#ef4444'; // rojo
          }
        } else if (typeof calidad === 'string') {
          calidadTexto = calidad;
          if (calidad.toLowerCase().includes('óptima') || calidad.toLowerCase() === 'buena') {
            color = '#10b981';
          } else if (calidad.toLowerCase().includes('media')) {
            color = '#f59e0b';
          } else if (calidad.toLowerCase().includes('mala')) {
            color = '#ef4444';
          }
        } else {
          calidadTexto = 'Sin datos';
        }

        calidadAguaElem.innerText = calidadTexto;
        calidadAguaElem.style.color = color;
      }

      // Renderizar alertas
      const alertas = datos.alertas || [];
      renderizarAlertas(alertas);

      // 2. Obtener histórico para la gráfica
      const resHistorico = await fetch(`${API_URL}/historico`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resHistorico.ok) {
        const historico = await resHistorico.json();
        console.log('Histórico:', historico);
        actualizarGrafica(historico);
      } else {
        console.warn('No se pudo obtener histórico, usando datos por defecto');
        actualizarGrafica([]);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      renderizarAlertas([{
        fecha: new Date().toLocaleString(),
        tipo: 'Error',
        descripcion: 'No se pudo conectar con el servidor. Intente más tarde.'
      }]);
      actualizarGrafica([]);
    }
  }

  // --- Cerrar sesión ---
  if (btnCerrar) {
    btnCerrar.addEventListener('click', function () {
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }

  // --- Inicializar ---
  cargarDatosDashboard();
});