const API_URL = 'http://localhost:3000/api';

document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Reset errors
  document.getElementById('nameError').textContent = '';
  document.getElementById('emailError').textContent = '';
  document.getElementById('passwordError').textContent = '';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  let valid = true;

  // Validar nombre
  if (name === '') {
    document.getElementById('nameError').textContent = 'El nombre es obligatorio.';
    valid = false;
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email === '') {
    document.getElementById('emailError').textContent = 'El correo electrónico es obligatorio.';
    valid = false;
  } else if (!emailRegex.test(email)) {
    document.getElementById('emailError').textContent = 'Por favor, ingresa un correo electrónico válido.';
    valid = false;
  }

  // Validar contraseña
  if (password.length < 6) {
    document.getElementById('passwordError').textContent = 'La contraseña debe tener al menos 6 caracteres.';
    valid = false;
  }

  const registerMessage = document.getElementById('registerMessage');
  registerMessage.textContent = '';
  registerMessage.className = 'form-message';

  if (valid) {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        registerMessage.textContent = result.message || 'Registro exitoso.';
        registerMessage.classList.add('success');
        document.getElementById('registerForm').reset();
      } else {
        const msg = result.message || 'Error al registrar, intenta de nuevo.';

        if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('duplicado')) {
          document.getElementById('emailError').textContent = msg;
        } else {
          registerMessage.textContent = msg;
          registerMessage.classList.add('error');
        }
      }
    } catch (err) {
      registerMessage.textContent = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      registerMessage.classList.add('error');
      console.error(err);
    }
  }
});