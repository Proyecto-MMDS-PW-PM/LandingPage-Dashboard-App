const API_URL = 'http://localhost:3000/api';

const loginForm = document.getElementById('loginForm');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const loginMessage = document.getElementById('loginMessage');

loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();

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

    if (response.ok && result.token) {
      localStorage.setItem('token', result.token);
      window.location.href = 'dashboard.html';
      return;
    }

    const message = result.message || 'Credenciales incorrectas. Intenta de nuevo.';
    loginMessage.textContent = message;
    loginMessage.classList.add('error');
  } catch (error) {
    loginMessage.textContent = 'No se pudo conectar con el servidor. Intenta más tarde.';
    loginMessage.classList.add('error');
    console.error(error);
  }
});
