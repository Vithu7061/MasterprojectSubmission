document.addEventListener('DOMContentLoaded', () => {
    const authTabs = document.querySelectorAll('.auth-tab');
    const authContents = document.querySelectorAll('.auth-content');

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Change active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding content
            const tabId = tab.dataset.tab + 'Form';
            authContents.forEach(content => {
                content.classList.add('hidden');
                if (content.id === tabId) {
                    content.classList.remove('hidden');
                }
            });
        });
    });

    // Form handlers
    document.getElementById('loginForm')?.querySelector('form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }

            const data = await response.json();
            
            // Speichere User-Daten im localStorage
            localStorage.setItem('loggedInUser', email);
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('userDataitem', data.user);

            
            // Weiterleitung zur Index-Seite
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Invalid email or password');
        }
    });

    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const accountType = document.querySelector('input[name="accountType"]:checked').value;
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
            
            if (password !== passwordConfirm) {
                alert('Passwords do not match');
                return;
            }

            const userData = {
                accountType,
                name,
                email,
                password
            };

            // Wenn Company Account, füge zusätzliche Felder hinzu
            if (accountType === 'company') {
                userData.companyDetails = {
                    companyName: document.getElementById('companyName').value,
                    street: document.getElementById('street').value,
                    postalCode: document.getElementById('postalCode').value,
                    city: document.getElementById('city').value,
                    iban: document.getElementById('iban').value,
                    bic: document.getElementById('bic').value,
                    accountHolder: document.getElementById('accountHolder').value,
                };
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Registration failed');
                }


                
                
                const to = userData.email;
                const subject = 'Sociebite Registration';
                const text = `
                <div style="color: #333;margin-bottom: 2rem; text-align: center;">
                <h1>Thank you!</h1>
                <div class="pickup-info" style="    margin: 2rem 0;padding: 1.5rem;background: #f8f9fa;border-radius: 8px;">
                    <p id="pickupLocation" style="color: #666; margin-bottom: 0.5rem;" >Hi ${userData.name},</p>
                    <p id="pickupLocation" style="color: #666; margin-bottom: 0.5rem;" >thank you for joining the Sociebite community. You can now start saving the enviroment by listing and buying Food on our Plattform!</p>
                </div>
                </div>
                `;
                
                const mailResponse = await fetch('http://localhost:3000/api/mailer/send-order-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ to , subject, text })
                });

                localStorage.setItem('SubMail', email);

                // Wenn die Registrierung erfolgreich war
                if (accountType === 'company') {
                    console.log('erfolgreich');
                    window.location.href = 'subscription.html';
                } else {
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message);
            }
        });

        // Account Type Toggle
        const accountTypeInputs = document.querySelectorAll('input[name="accountType"]');
        const companyFields = document.getElementById('companyFields');

        accountTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.value === 'company') {
                    companyFields.classList.remove('hidden');
                    // Make company fields required
                    document.getElementById('companyName').required = true;
                    document.getElementById('street').required = true;
                    document.getElementById('postalCode').required = true;
                    document.getElementById('city').required = true;
                    document.getElementById('iban').required = true;
                    document.getElementById('bic').required = true;
                    document.getElementById('accountHolder').required = true;
                } else {
                    companyFields.classList.add('hidden');
                    // Remove required from company fields
                    document.getElementById('companyName').required = false;
                    document.getElementById('street').required = false;
                    document.getElementById('postalCode').required = false;
                    document.getElementById('city').required = false;
                    document.getElementById('iban').required = false;
                    document.getElementById('bic').required = false;
                    document.getElementById('accountHolder').required = false;
                }
            });
        });

        // IBAN Formatierung
        const ibanInput = document.getElementById('iban');
        if (ibanInput) {
            ibanInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '');
                value = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = value.toUpperCase();
            });
        }
    }
}); 