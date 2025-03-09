document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = 'index.html';
        return;
    }


    const form = document.getElementById('listProductForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tmp = Date.now();
        let productData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: document.getElementById('productPrice').value,
            quantity: document.getElementById('productQuantity').value,
            fullquantity: document.getElementById('productQuantity').value,
            availableFrom: document.getElementById('availableFrom').value,
            availableUntil: document.getElementById('availableUntil').value,
            sellerEmail: loggedInUser,
            imageUrl: document.getElementById('productImage').files[0] ? '/productsupload/' + 'product-' + tmp +'-' +document.getElementById('productImage').files[0].name : null
        };

        //
        if(productData.imageUrl!==null){
            document.getElementById('productImage').files[0];

            console.log(document.getElementById('productImage').files[0])
            const formData = new FormData();
            formData.append('image', document.getElementById('productImage').files[0]);
            formData.append('date', tmp);
        
            try {
                const response = await fetch('http://localhost:3000/api/products/upload-product-foto', {
                    method: 'POST',
                    body: formData
                });
    
                const responseText = await response.text();
                const data = JSON.parse(responseText);
                console.log(data.logo_url);
                productData.imageUrl = data.logo_url;
    
                if (!response.ok) {
                    console.error('Upload failed with status:', response.status);
                    throw new Error('Failed to upload image');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                console.error('Full error:', error.stack);
                alert('Failed to upload image. Please try again.');
            }
        }

        //
        console.log('Sending product data:', productData);

        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData)
            });

            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);

            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            alert('Product listed successfully!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Failed to create product. Please try again.');
        }
    });
}); 