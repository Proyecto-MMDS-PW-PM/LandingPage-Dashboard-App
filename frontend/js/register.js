document.getElementById('registerForm').addEventListener('submit', function(e) {
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

  if (valid) {
    alert('Formulario enviado (simulado)');
  }
});