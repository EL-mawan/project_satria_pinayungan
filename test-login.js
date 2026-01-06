async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'master@satriapinayungan.org',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Login successful:', data);
    } else {
      console.error('Login failed:', response.status, data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
