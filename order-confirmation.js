document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('userData');

    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    // Get product data from localStorage (set this when clicking "Jetzt bestellen")
    const productData = JSON.parse(localStorage.getItem('selectedProduct'));
    if (productData) {
        console.log(productData);
        document.getElementById('companybanner').src = productData.logo_url;

        document.getElementById('productName').textContent = productData.name;
        document.getElementById('companyName').textContent = productData.company_name;
        document.getElementById('productPrice').textContent = productData.price + '€';
        document.getElementById('pickupLocation').textContent = `Location: ${productData.street}, ${productData.postal_code} ${productData.city}`;
        document.getElementById('productDescription').textContent = productData.description;
        // Format dates for pickup time
        document.getElementById('pickupTime').textContent = `Available: ${new Date(productData.available_from).toLocaleString()} - ${new Date(productData.available_until).toLocaleString()}`;
        
        // Set the maximum quantity based on available quantity
        const quantitySelect = document.getElementById('quantity');
        
        // Dynamically create options for the quantity select
        for (let i = 1; i <= productData.quantity; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            quantitySelect.appendChild(option);
        }
    }
    // Handle order confirmation
    const data = JSON.parse(loggedInUser);
    document.querySelector('.confirm-button').addEventListener('click', async () => {
        const quantity = parseInt(document.getElementById('quantity').value);
        // Speichere den Kauf
        try {
            const response = await fetch('http://localhost:3000/api/products/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: data.id, // Hier musst du die Benutzer-ID abrufen
                    productId: productData.id, // Produkt-ID
                    quantity: quantity // Verwende die ausgewählte Menge
                })
            });

            if (!response.ok) {
                throw new Error('Failed to purchase product');
            }

            alert(`Order confirmed! Quantity: ${quantity}. You will receive a confirmation email shortly.`);
            const to = data.email;
            const subject = 'Sociebite Order';
            const total = productData.price*quantity;
            const text = `
            <div style="color: #333;margin-bottom: 2rem; text-align: center;">
            <h1>Order Summary</h1>
            <div class="product-details">
                        <h2 class="productname" id="productName" style="color: #37B24D;margin-bottom: 0.5rem; margin-top: 0.5rem;">${productData.name}</h2>
                        <p class="company" id="companyName" style="color: #666; margin-bottom: 0.5rem;">${productData.company_name}</p>
                        <h3 class="price2" id="productPrice" style="color: #37B24D;margin-bottom: 0.5rem; margin-top: 0.5rem;">${productData.price}€</h3>
            </div>
            <div class="pickup-info" style="    margin: 2rem 0;padding: 1.5rem;background: #f8f9fa;border-radius: 8px;">
                <h3 style="color: #333;margin-bottom: 1rem;">Pickup Information</h3>
                <p id="pickupLocation" style="color: #666; margin-bottom: 0.5rem;" >Location: ${productData.street}, ${productData.postal_code} ${productData.city}</p>
                <p id="pickupTime" style="    color: #666; margin-bottom: 0.5rem;" >Available for pickup: ${new Date(productData.available_from).toLocaleString()} - ${new Date(productData.available_until).toLocaleString()}</p>
            </div>
             <p class="description" id="productDescription">${productData.description}</p>
             <div class="quantityclass">
                <label for="quantity">Quantity: ${quantity}</label>
                <h3 class="price2" id="productPrice">${total}€</h3>
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

            const productName = productData.name;
            const priceInCents = productData.price * 100;
            const stripeResponse = await fetch('http://localhost:3000/api/stripe/create-custompayment-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productName, priceInCents, quantity })
            });

            if (!stripeResponse.ok) {
             //   const errorData = await stripeResponse.json();
                throw new Error(errorData.error || 'Stripe subscription creation failed');
            }

            const stripeData = await stripeResponse.json();
            console.log('Stripe subscription created:', stripeData.url);
            window.location.href = stripeData.url;


            localStorage.removeItem('selectedProduct');



           // window.location.href = 'index.html';
        } catch (error) {
            console.error('Error purchasing product:', error);
            alert('Failed to purchase product. Please try again.');
        }
    });
}); 