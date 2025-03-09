document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.querySelector('.products-container');
    const searchButton = document.querySelector('.search-button');
    const searchInput = document.querySelectorAll('.search-input')[0];
    const postalInput = document.querySelectorAll('.search-input')[1];
    const distanceSelect = document.querySelectorAll('.search-input')[2];

    // Load products from database
    async function loadProducts() {
        try {
            console.log('Fetching products from API...');
            const response = await fetch('http://localhost:3000/api/products', {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const products = await response.json();
            console.log('Products received:', products.length);
            displayProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
            productsContainer.innerHTML =
                '<div class="error">Failed to load products. Please try again later.</div>';
        }
    }

    // Funktion zum Abrufen der Koordinaten einer PLZ
    async function getCoordinates(postalCode) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&country=DE&format=json`);
            const data = await response.json();
            if (data && data[0]) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            return null;
        }
    }

    // Funktion zur Berechnung der Distanz zwischen zwei Koordinaten
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Erdradius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distanz in km
    }

    // Display products in UI
    function displayProducts(products) {
        productsContainer.innerHTML = '';

        if (products.length === 0) {
            productsContainer.innerHTML = '<div class="no-results">No products found</div>';
            displayProductDetails(null);
            return;
        }

        products.forEach((product, index) => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            if (index === 0) {
                productCard.classList.add('selected');
                displayProductDetails(product);
            }

            productCard.innerHTML = `
                <h2>${product.name}</h2>
                <p class="company">${product.company_name || product.seller_name}</p>
                <p class="location">${product.postal_code} ${product.city}</p>
                ${product.distance ? `<p class="distance">${Math.round(product.distance)}km entfernt</p>` : ''}
                <p class="description">${product.description}</p>
                <p class="price">€${product.price}</p>
            `;

            productCard.addEventListener('click', () => {
                document.querySelectorAll('.product-card').forEach(card => {
                    card.classList.remove('selected');
                });
                productCard.classList.add('selected');
                displayProductDetails(product);
            });

            productsContainer.appendChild(productCard);
        });
    }

    // Display product details
    function displayProductDetails(product) {
        const detailsContainer = document.querySelector('.product-details');

        if (!product) {
            detailsContainer.classList.add('empty');
            detailsContainer.innerHTML = '<p>Select a product to view details.</p>';
            return;
        }

        detailsContainer.classList.remove('empty');
            detailsContainer.innerHTML = `
            <div class="product-detail-content">
            <img class="product-detail-img" src="${product.logo_url}" alt="${product.company_name || product.seller_name}">
            <div class="product-detail-header">
                <h1>${product.name}</h1>
                <p class="company">${product.company_name || product.seller_name}</p>
                <hr>
            </div>
                <p class="price">€${product.price}</p>
                <div class="location-info">
                    <p><strong>Location:</strong> ${product.street}, ${product.postal_code} ${product.city}</p>
                    <p><strong>Available:</strong> ${new Date(product.available_from).toLocaleString()} - ${new Date(product.available_until).toLocaleString()}</p>
                    <p><strong>Quantity:</strong> ${product.quantity} available</p>
                </div>
                <p><strong>Description</strong></p>
                <p class="description">${product.description}</p>
                <img class="product-details-img2" src="${product.image_url}" onerror="this.style.display='none';">
            </div>
            <button class="auth-button">Order Now</button>
        `;
        console.log(product.image_url);
        const orderButton = detailsContainer.querySelector('.auth-button');
        orderButton.addEventListener('click', () => {
            const loggedInUser = localStorage.getItem('loggedInUser');
            if (!loggedInUser) {
                alert('Please log in to order products');
                return;
            }
            localStorage.setItem('selectedProduct', JSON.stringify(product));
            window.location.href = 'order-confirmation.html';
        });
    }

    // Search functionality
    searchButton.addEventListener('click', async () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const postalCode = postalInput.value.trim().split(' ')[0];
        const maxDistance = parseInt(distanceSelect.value);
        try {
            const response = await fetch('http://localhost:3000/api/products', {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            let products = await response.json();

            // Filter nach Suchbegriff
            if (searchTerm) {
                products = products.filter(product =>
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.description.toLowerCase().includes(searchTerm) ||
                    (product.company_name && product.company_name.toLowerCase().includes(searchTerm)) ||
                    (product.seller_name && product.seller_name.toLowerCase().includes(searchTerm))
                );
            }

            // Filter nach PLZ und Distanz
            if (postalCode) {
                productsContainer.innerHTML = '<div class="loading">Searching for Products...</div>';
                const searchCoords = await getCoordinates(postalCode);
                if (searchCoords) {
                    const productsWithDistance = await Promise.all(
                        products.map(async product => {
                            const productPostal = product.postal_code.match(/\d{5}/)?.[0];
                            if (!productPostal) return { ...product, distance: Infinity };

                            const productCoords = await getCoordinates(productPostal);
                            if (!productCoords) return { ...product, distance: Infinity };

                            const distance = calculateDistance(
                                searchCoords.lat, searchCoords.lon,
                                productCoords.lat, productCoords.lon
                            );
                            return { ...product, distance };
                        })
                    );

                    // Wenn maxDistance > 0, filtere nach Distanz
                    products = productsWithDistance
                        .filter(product => product.distance <= maxDistance);
                    console.log(productsWithDistance);
                    // Sonst zeige alle Produkte, sortiert nach Distanz

                    // Sortiere immer nach Distanz wenn eine PLZ eingegeben wurde
                    products.sort((a, b) => a.distance - b.distance);
                }
            }
            displayProducts(products);
        } catch (error) {
            console.error('Error searching products:', error);
            productsContainer.innerHTML =
                '<div class="error">Failed to search products. Please try again later.</div>';
        }
    });

    // PLZ Autovervollständigung
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'postal-suggestions';
    postalInput.parentNode.appendChild(suggestionsContainer);

    let debounceTimer;

    postalInput.addEventListener('input', async (e) => {
        const value = e.target.value.trim();
        clearTimeout(debounceTimer);
        suggestionsContainer.innerHTML = '';

        if (value.length >= 2) {
            debounceTimer = setTimeout(async () => {
                try {
                    pcode = /^[0-9]+$/.test(value);
                    let response = [];
                    if (pcode) {
                        try {
                            response = await fetch(
                                `https://openplzapi.org/de/Localities?postalCode=${value}&page=1&pageSize=50`
                            );
                        } catch (error) {
                            console.log('Fetch with Postalcode error');
                        }
                    } else {
                        try {
                            response = await fetch(
                                `https://openplzapi.org/de/Localities?name=${value}&page=1&pageSize=50`
                            );
                        } catch (error) {
                            console.log('Fetch with Cityname error')
                        }
                    }
                    const data = await response.json();

                    // Berechne Relevanz für jedes Ergebnis
                    const locations = data.map(item => ({
                        postcode: item.postalCode,
                        city: item.name,
                        state: item.federalState.name,
                        relevance: calculateRelevance(value, item)
                    }));


                    // Sortiere nach Relevanz (höchste zuerst)
                    locations.sort((a, b) => b.relevance - a.relevance);

                    // Zeige maximal 5 Vorschläge
                    suggestionsContainer.innerHTML = locations
                        .slice(0, 15)
                        .map(location => `
                            <div class="postal-suggestion">
                                <div class="suggestion-main">${location.postcode} ${location.city}</div>
                                <div class="suggestion-state">${location.state}</div>
                            </div>
                        `).join('');

                    // Event Listener für Vorschläge
                    document.querySelectorAll('.postal-suggestion').forEach(suggestion => {
                        suggestion.addEventListener('click', () => {
                            postalInput.value = suggestion.querySelector('.suggestion-main').textContent.trim();
                            suggestionsContainer.innerHTML = '';
                        });
                    });
                } catch (error) {
                    console.error('Error fetching postal suggestions:', error);
                }
            }, 300);
        }
    });

    // Funktion zur Berechnung der Relevanz
    function calculateRelevance(searchTerm, item) {
        let relevance = 0;
        searchTerm = searchTerm.toLowerCase();

        // PLZ-Übereinstimmung
        if (item.postalCode.startsWith(searchTerm)) {
            relevance += 100;
        } else if (item.postalCode.includes(searchTerm)) {
            relevance += 50;
        }

        // Stadt-Übereinstimmung
        const cityName = item.name.toLowerCase();
        if (cityName.startsWith(searchTerm)) {
            relevance += 75;
        } else if (cityName.includes(searchTerm)) {
            relevance += 25;
        }

        // Exakte Übereinstimmungen bevorzugen
        if (item.postalCode === searchTerm || cityName === searchTerm) {
            relevance += 200;
        }

        return relevance;
    }

    // Schließe Vorschläge beim Klicken außerhalb
    document.addEventListener('click', (e) => {
        if (!postalInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.innerHTML = '';
        }
    });

    // Load products when page loads
    loadProducts();
}); 