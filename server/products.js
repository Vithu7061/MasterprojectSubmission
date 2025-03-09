const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, 'productsupload');

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: function(req, file, cb) {
        cb(null, 'product-' + Date.now() +'-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB limit
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.name).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

router.post('/upload-product-foto', upload.single('image'), async (req, res) => {
    try {
        console.log('Upload request received');
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log('File received:', req.file);
        const logo_url = `/productsupload/${req.file.filename}`;

        res.json({ logo_url });

    }catch(error){

    }
 });

// Get all products
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/products wurde aufgerufen');
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        const result = await db.query(`
            SELECT p.*, u.name as seller_name, 
                   cd.company_name, cd.city, cd.postal_code, cd.street,
                   (SELECT cd2.logo_url 
                    FROM company_details cd2 
                    WHERE cd2.user_id = p.seller_id) as logo_url
            FROM products p
            JOIN users u ON p.seller_id = u.id
            LEFT JOIN company_details cd ON u.id = cd.user_id
            WHERE p.available_until > NOW() AND p.quantity > 0
            ORDER BY p.created_at DESC
        `);

        // Füge vollständige URL für Logos hinzu
        result.rows = result.rows.map(row => ({
            ...row,
            logo_url: row.logo_url ? `http://localhost:3000${row.logo_url}` : 'Images/musterlogo2.png',
            image_url: row.image_url ? `http://localhost:3000${row.image_url}` : ''

        }));

        console.log('Gefundene Produkte:', result.rows);
        res.json(result.rows);
        console.log(result.rows);
    } catch (error) {
        console.error('Fehler beim Abrufen der Produkte:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Add new product
router.post('/', async (req, res) => {
    try {
        console.log('Received product data:', req.body);
        const { 
            name, description, price, quantity, fullquantity,availableFrom, availableUntil,
            imageUrl 
        } = req.body;
        
        console.log('Looking for seller with email:', req.body.sellerEmail);
        // Get seller_id from email (stored in localStorage)
        const userResult = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [req.body.sellerEmail]
        );
        
        console.log('User query result:', userResult.rows);
        
        if (!userResult.rows[0]) {
            return res.status(404).json({ error: 'Seller not found' });
        }

        console.log('Inserting product with seller_id:', userResult.rows[0].id);

        const result = await db.query(
            `INSERT INTO products (
                seller_id, name, description, price, 
                quantity, fullquantity,available_from, 
                available_until, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [
                userResult.rows[0].id, name, description, 
                price, quantity,fullquantity, availableFrom, 
                availableUntil, imageUrl
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Test endpoint to check database content
router.get('/test', async (req, res) => {
    try {
        const tables = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM products) as products_count,
                (SELECT COUNT(*) FROM users) as users_count,
                (SELECT COUNT(*) FROM company_details) as companies_count
        `);
        res.json(tables.rows[0]);
    } catch (error) {
        console.error('Test query error:', error);
        res.status(500).json({ error: 'Test query failed' });
    }
});

// Get products by user email
router.get('/user', async (req, res) => {
    try {
        const { email } = req.query;
        
        // Get user id first
        const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (!userResult.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const result = await db.query(
            'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
            [userResult.rows[0].id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching user products:', error);
        res.status(500).json({ error: 'Failed to fetch user products' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Post uploadPicture


// Purchase product
router.post('/purchase', async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        // Überprüfe die verfügbare Menge des Produkts
        const productResult = await db.query('SELECT quantity FROM products WHERE id = $1', [productId]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const availableQuantity = productResult.rows[0].quantity;

        // Überprüfe, ob genügend Menge verfügbar ist
        if (availableQuantity < quantity) {
            return res.status(400).json({ error: 'Not enough quantity available' });
        }

        // Füge den Kauf in die Datenbank ein
        const result = await db.query(
            'INSERT INTO purchases (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
            [userId, productId, quantity]
        );

        // Reduziere die Menge des Produkts in der products-Tabelle
        await db.query('UPDATE products SET quantity = quantity - $1 WHERE id = $2', [quantity, productId]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error purchasing product:', error);
        res.status(500).json({ error: 'Failed to purchase product' });
    }
});

// Get purchased products by user ID
router.get('/purchases', async (req, res) => {
    try {
        const { userId } = req.query; // Benutzer-ID aus der Anfrage abrufen

        const result = await db.query(
            `SELECT p.*, pu.quantity, pu.purchase_date 
             FROM purchases pu 
             JOIN products p ON pu.product_id = p.id 
             WHERE pu.user_id = $1`, 
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching purchased products:', error);
        res.status(500).json({ error: 'Failed to fetch purchased products' });
    }
});

module.exports = router; 