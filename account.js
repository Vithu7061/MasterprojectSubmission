document.addEventListener('DOMContentLoaded', async () => {
    // Get logged in user email
    const userEmail = localStorage.getItem('loggedInUser');
    const userDatastring = localStorage.getItem('userData');

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Fetch user data from database
    try {
        const response = await fetch(`http://localhost:3000/api/auth/user-details?email=${userEmail}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user details');
        }
        const userData = await response.json();

        // Update UI with user data
        document.getElementById("savebtn").style.visibility = "hidden";
        document.getElementById("listedbtn").style.visibility = "hidden";

        document.querySelector('.user-email').textContent = userData.email;
        document.getElementById("editUserName").disabled = true; 
        document.getElementById('editUserName').value = userData.name;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('accountType').textContent = userData.account_type === 'company' ? 'Company Account' : 'Private Account';

        // If it's a company account, show company details and image upload
        if (userData.account_type === 'company') {
            document.getElementById("listedbtn").style.visibility = "visible";
            document.getElementById('companyImageSection').style.display = 'block';
            if (userData.companyDetails?.logo_url) {
                document.getElementById('companyLogo').src = userData.companyDetails.logo_url;
            }
            
            const companySection = document.createElement('div');
            companySection.innerHTML = `
                <div class="info-group">
                    <label>Company Name:</label>
                    <input type="text" id="editCompanyName" class="edit-input" value="Example Company">
                </div>
                <div class="info-group">
                    <label>Street:</label>
                    <input type="text" id="editStreet" class="edit-input" value="Example Street">
                </div>
                <div class="info-group">
                    <label>Postal code:</label>
                    <input type="text" id="editPostalCode" class="edit-input" value="Example Postal code">
                </div>
                <div class="info-group">
                    <label>City:</label>
                    <input type="text" id="editCity" class="edit-input" value="Example City">
                </div>
            `;
            document.querySelector('.data-section').appendChild(companySection);
            document.getElementById("editCompanyName").disabled = true; 
            document.getElementById("editStreet").disabled = true; 
            document.getElementById("editPostalCode").disabled = true; 
            document.getElementById("editCity").disabled = true; 

            document.getElementById('editCompanyName').value = userData.companyDetails.company_name;
            document.getElementById('editStreet').value = userData.companyDetails.street;
            document.getElementById('editPostalCode').value = userData.companyDetails.postal_code;
            document.getElementById('editCity').value = userData.companyDetails.city;

        }



        // Image Upload Handler
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) {
            imageUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                console.log('Selected file:', file);
                const formData = new FormData();
                formData.append('image', file);
                formData.append('email', userEmail);

                console.log('FormData created with:', {
                    file: file.name,
                    email: userEmail
                });

                try {
                    const response = await fetch('http://localhost:3000/api/auth/upload-company-logo', {
                        method: 'POST',
                        body: formData
                    });

                    console.log('Response status:', response.status);
                    const responseText = await response.text();
                    console.log('Response text:', responseText);

                    if (!response.ok) {
                        console.error('Upload failed with status:', response.status);
                        throw new Error('Failed to upload image');
                    }

                    const data = JSON.parse(responseText);
                    document.getElementById('companyLogo').src = data.logo_url;
                    alert('Company logo updated successfully!');
                } catch (error) {
                    console.error('Error uploading image:', error);
                    console.error('Full error:', error.stack);
                    alert('Failed to upload image. Please try again.');
                }
            });
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        alert('Failed to load user details');
    }

    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            // Hide all tab contents
            tabContents.forEach(content => content.classList.add('hidden'));
            // Show selected tab content
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.remove('hidden');

            // Lade gelistete Produkte wenn der "Listed Products" Tab ausgewählt wird
            if (tabId === 'listed') {
                try {
                    const response = await fetch(`http://localhost:3000/api/products/user?email=${userEmail}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch user products');
                    }
                    
                    const products = await response.json();
                    const productsGrid = document.querySelector('#listed .products-grid');
                    
                    if (products.length === 0) {
                        productsGrid.innerHTML = '<div class="no-items-message">No listed products yet</div>';
                        return;
                    }

                    productsGrid.innerHTML = products.map(product => `
                        <div class="product-item">
                            <h3>${product.name}</h3>
                            <p class="price">€${product.price}</p>
                            <p class="availability">
                                Available: ${new Date(product.available_from).toLocaleDateString()} - 
                                ${new Date(product.available_until).toLocaleDateString()}
                            </p>
                            <p class="quantity">Quantity: ${product.fullquantity}</p>
                            <div class="product-actions">
                                <button class="edit-product" data-id="${product.id}">Edit</button>
                                <button class="delete-product" data-id="${product.id}">Delete</button>
                            </div>
                        </div>
                    `).join('');

                    // Event Listener für Edit und Delete Buttons
                    document.querySelectorAll('.edit-product').forEach(button => {
                        button.addEventListener('click', () => {
                            // TODO: Implementiere Edit-Funktionalität
                            alert('Edit functionality coming soon');
                        });
                    });

                    document.querySelectorAll('.delete-product').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            if (confirm('Are you sure you want to delete this product?')) {
                                try {
                                    const response = await fetch(`http://localhost:3000/api/products/${button.dataset.id}`, {
                                        method: 'DELETE'
                                    });
                                    if (!response.ok) throw new Error('Failed to delete product');
                                    button.closest('.product-item').remove();
                                } catch (error) {
                                    console.error('Error deleting product:', error);
                                    alert('Failed to delete product');
                                }
                            }
                        });
                    });
                } catch (error) {
                    console.error('Error fetching user products:', error);
                    document.querySelector('#listed .products-grid').innerHTML = 
                        '<div class="error">Failed to load products</div>';
                }
            }
        });
    });

    // Edit button functionality
    const editButton = document.querySelector('.edit-button');
    const saveButton = document.querySelector('.save-button');

    editButton.addEventListener('click', () => {
        if(userData.account_type === 'company'){
            if(document.getElementById("editUserName").disabled===true){
                document.getElementById("editUserName").disabled = false; 
                document.getElementById("editCompanyName").disabled = false; 
                document.getElementById("editStreet").disabled = false; 
                document.getElementById("editPostalCode").disabled = false; 
                document.getElementById("editCity").disabled = false; 
                document.getElementById("savebtn").style.visibility = "visible";
            }
            else{
                document.getElementById("editUserName").disabled = true; 
                document.getElementById("editCompanyName").disabled = true; 
                document.getElementById("editStreet").disabled = true; 
                document.getElementById("editPostalCode").disabled = true; 
                document.getElementById("editCity").disabled = true; 
                document.getElementById("savebtn").style.visibility = "hidden";
            }
        }else{
            if(document.getElementById("editUserName").disabled===true){
                document.getElementById("editUserName").disabled = false; 
                document.getElementById("savebtn").style.visibility = "visible";
            }
            else{
                document.getElementById("editUserName").disabled = true; 
                document.getElementById("savebtn").style.visibility = "hidden";
            }
        }
    });

    saveButton.addEventListener('click', async () => {
        
        const name = document.getElementById('editUserName').value;
        const email =userData.email;
        if(userData.account_type === 'company'){
            const companyName = document.getElementById('editCompanyName').value;
            const street= document.getElementById('editStreet').value;
            const postalCode = document.getElementById('editPostalCode').value;
            const city = document.getElementById('editCity').value;
            console.log(name , companyName,street,postalCode,city,email);

            try {
                const response = await fetch('http://localhost:3000/api/auth/update-user-details', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({name, email ,companyName, street, postalCode, city})
                });

                if (!response.ok) {
                    throw new Error('Failed to update user details');
                }

                alert('Details updated successfully');
                window.location.reload();
            } catch (error) {
                console.error('Error updating user details:', error);
                alert('Failed to update details');
            }
        }else{
            try {
                const response = await fetch('http://localhost:3000/api/auth/update-user-details-private', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({name, email})
                });

                if (!response.ok) {
                    throw new Error('Failed to update user details');
                }

                alert('Details updated successfully');
                window.location.reload();
            } catch (error) {
                console.error('Error updating user details:', error);
                alert('Failed to update details');
            } 
        }
    });

    // Fetch purchased products
    const purchasedTab = document.getElementById('purchased');
    const purchasedProductsGrid = purchasedTab.querySelector('.products-grid');
    const userData = JSON.parse(userDatastring);

    try {
        const response = await fetch(`http://localhost:3000/api/products/purchases?userId=${userData.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch purchased products');
        }
        const purchasedProducts = await response.json();

        if (purchasedProducts.length === 0) {
            purchasedProductsGrid.innerHTML = '<div class="no-items-message">No purchased products yet</div>';
            return;
        }

        purchasedProductsGrid.innerHTML = purchasedProducts.map(product => `
            <div class="product-item">
                <h3>${product.name}</h3>
                <p class="price">€${product.price}</p>
                <p class="quantity">Quantity: ${product.quantity}</p>
                <p class="purchase-date">Purchased on: ${new Date(product.purchase_date).toLocaleDateString()}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching purchased products:', error);
        purchasedProductsGrid.innerHTML = '<div class="error">Failed to load purchased products</div>';
    }
}); 