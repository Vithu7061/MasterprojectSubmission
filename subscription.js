document.addEventListener('DOMContentLoaded', () => {
    const subscriptionButtonbase = document.querySelectorAll('.subscription-buttonbase');
    const subscriptionButtonpremium  = document.querySelectorAll('.subscription-buttonpremium');
    
    subscriptionButtonbase.forEach(button => {
        button.addEventListener('click', async () => {
            const subscriptionType = 'Base';
            const userMail = localStorage.getItem('SubMail');
            console.log(subscriptionType);
            console.log(userMail);

            try {
                
                const stripeResponse = await fetch('http://localhost:3000/api/stripe/create-custompayment-link', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!stripeResponse.ok) {
                 //   const errorData = await stripeResponse.json();
                    throw new Error(errorData.error || 'Stripe subscription creation failed');
                }

                const stripeData = await stripeResponse.json();
                console.log('Stripe subscription created:', stripeData.url);
                window.location.href = stripeData.url;
                // Aktualisieren Sie die Subscription-Daten in Ihrer Datenbank
                const response = await fetch('http://localhost:3000/api/auth/subscriptionupdate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ subscriptionType, userMail })
                });


                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Subscription update failed');
                }

                alert('Subscription updated successfully');
             //   window.location.href = 'index.html';
            } catch (error) {
                console.error('Subscription update error:', error);
                alert(error.message);
            }
        });
    });

    subscriptionButtonpremium.forEach(button => {
        button.addEventListener('click', async () => {
            const subscriptionType = 'Premium';
            const userMail = localStorage.getItem('SubMail');
            console.log(subscriptionType);
            console.log(userMail);

            try {
                // Rufen Sie die Stripe-Subscription-API auf

                const stripeResponse = await fetch('http://localhost:3000/api/stripe/create-payment-link2', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!stripeResponse.ok) {
                 //   const errorData = await stripeResponse.json();
                    throw new Error(errorData.error || 'Stripe subscription creation failed');
                }

                const stripeData = await stripeResponse.json();
                console.log('Stripe subscription created:', stripeData.url);
                window.location.href = stripeData.url;
                // Aktualisieren Sie die Subscription-Daten in Ihrer Datenbank
                const response = await fetch('http://localhost:3000/api/auth/subscriptionupdate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ subscriptionType, userMail })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Subscription update failed');
                }

                alert('Subscription updated successfully');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Subscription update error:', error);
                alert(error.message);
            }
        });
    });
}); 