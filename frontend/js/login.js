console.log('✅ login.js cargado correctamente');

const API_URL = 'https://landingpage-dashboard-app-production.up.railway.app/api';

const loginForm = document.getElementById('loginForm');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const loginMessage = document.getElementById('loginMessage');

// Verificar que los elementos existen
console.log('Elementos del formulario:', { loginForm, emailError, passwordError, loginMessage });

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.log('🔐 Evento submit disparado'); // Para confirmar que llega aquí

    emailError.textContent = '';
    passwordError.textContent = '';
    loginMessage.textContent = '';
    loginMessage.className = 'form-message';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === '') {
      emailError.textContent = 'El correo electrónico es obligatorio.';
      valid = false;
    } else if (!emailRegex.test(email)) {
      emailError.textContent = 'Ingresa un correo electrónico válido.';
      valid = false;
    }

    if (password === '') {
      passwordError.textContent = 'La contraseña es obligatoria.';
      valid = false;
    }

    if (!valid) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log('Login response:', result);

      if (response.ok && result.token) {
        // SOLO proceder si realmente se autentico correctamente y existe el token
        localStorage.setItem('token', result.token);

        // Forzar nombre: intentar todas las propiedades que pueda devolver el backend
        const nombreUsuario = result.name || result.nombre || result.userName || result.usuario || '';
        const emailUsuario = result.email || result.correo || '';

        localStorage.setItem('userName', nombreUsuario);
        localStorage.setItem('userEmail', emailUsuario);
        localStorage.setItem('nombre', nombreUsuario);
        localStorage.setItem('name', nombreUsuario);

        window.location.href = 'dashboard.html';
        return;
      }

      // NO autenticado: mostrar error
      const message = result.message || 'Credenciales incorrectas. Intenta de nuevo.';
      loginMessage.textContent = message;
      loginMessage.classList.add('error');
    } catch (error) {
      loginMessage.textContent = 'No se pudo conectar con el servidor. Intenta más tarde.';
      loginMessage.classList.add('error');
      console.error(error);
    }
  });
