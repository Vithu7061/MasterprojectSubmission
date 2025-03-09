const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db');
const multer = require('multer');
const path = require('path');

// Configure multer for image upload
const uploadDir = path.join(__dirname, 'uploads');

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: function(req, file, cb) {
        cb(null, 'company-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

router.post('/subscriptionupdate', async (req, res) => {
    try {
        const { subscriptionType, userMail } = req.body;
        // Aktualisiere die Subscription-Daten in der company_details Tabelle
        const dbResult = await db.query(
            `UPDATE company_details SET subscription_type = $1 WHERE user_id = (SELECT id FROM users WHERE email = $2)`,
            [subscriptionType, userMail]
        );

        res.status(200).send({ message: 'Subscription updated successfully' });
        console.log('successful subscription type:' + subscriptionType + ' userMail:' + userMail);
    } catch (error) {
        console.error('Subscription update error:', error);
        if (!res.headersSent) {
            res.status(500).send({ error: 'Subscription update failed' });
        }
    }
});
  


// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, accountType } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await db.query(
            'INSERT INTO users (name, email, password, account_type) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, email, hashedPassword, accountType]
        );

        if (accountType === 'company' && req.body.companyDetails) {
            const { companyName, street, postalCode, city, iban, bic, accountHolder } = req.body.companyDetails;
            await db.query(
                `INSERT INTO company_details 
                (user_id, company_name, street, postal_code, city, iban, bic, account_holder) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [userResult.rows[0].id, companyName, street, postalCode, city, iban, bic, accountHolder]
            );
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        console.log('Login-Versuch für:', req.body.email);
        const { email, password } = req.body;
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        console.log('Gefundener User:', user ? 'Ja' : 'Nein');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log('Login fehlgeschlagen: Ungültige Anmeldedaten');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Login erfolgreich für User:', user.email);
        delete user.password;
        res.json({ user });
    } catch (error) {
        console.error('Login-Fehler:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// User details endpoint
router.get('/user-details', async (req, res) => {
    try {
        const { email } = req.query;
        
        // Get user data
        const userResult = await db.query(
            'SELECT id, name, email, account_type FROM users WHERE email = $1',
            [email]
        );
        
        if (!userResult.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        // If company account, get company details
        if (user.account_type === 'company') {
            const companyResult = await db.query(
                'SELECT company_name, street, postal_code, city, logo_url FROM company_details WHERE user_id = $1',
                [user.id]
            );
            if (companyResult.rows[0]) {
                user.companyDetails = companyResult.rows[0];
                if (user.companyDetails.logo_url) {
                    user.companyDetails.logo_url = `http://localhost:3000${user.companyDetails.logo_url}`;
                }
            }
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// Company Logo Upload Endpoint
router.post('/upload-company-logo', upload.single('image'), async (req, res) => {
    try {
        console.log('Upload request received');
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File received:', req.file);

        const email = req.body.email;
        const logo_url = `/uploads/${req.file.filename}`;

        console.log('Email:', email);
        console.log('Logo URL:', logo_url);

        // Update company_details with new logo URL
        const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (!userResult.rows[0]) {
            console.log('User not found for email:', email);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User found:', userResult.rows[0]);

        await db.query(
            'UPDATE company_details SET logo_url = $1 WHERE user_id = $2',
            [logo_url, userResult.rows[0].id]
        );

        console.log('Database updated successfully');

        res.json({ logo_url });
    } catch (error) {
        console.error('Error uploading logo:', error);
        console.error('Full error:', error.stack);
        res.status(500).json({ error: 'Failed to upload logo' });
    }
});

// Neue Route, um die userId basierend auf der E-Mail abzurufen
router.get('/userid', async (req, res) => {
  const { email } = req.query;

  try {
    const result = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      res.status(200).send({ userId: result.rows[0].id });
    } else {
      res.status(404).send({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching userId:', error);
    res.status(500).send({ error: 'Database query failed' });
  }
});

router.post('/update-user-details', async (req, res) => {
    try {
        const { name, email ,companyName, street, postalCode, city } = req.body;
        // Aktualisiere die Benutzerdaten
        await db.query(
            'UPDATE users SET name = $1 WHERE email = $2',
            [name, email]
        );

        // Aktualisiere die Firmendetails, falls vorhanden
        await db.query(
            `UPDATE company_details 
             SET company_name = $1, street = $2, postal_code = $3, city = $4 
             WHERE user_id = (SELECT id FROM users WHERE email = $5)`,
            [companyName, street, postalCode, city, email]
        );

        res.status(200).send({ message: 'User details updated successfully' });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).send({ error: 'Failed to update user details' });
    }
});


router.post('/update-user-details-private', async (req, res) => {
    try {
        const { name, email} = req.body;
        // Aktualisiere die Benutzerdaten
        await db.query(
            'UPDATE users SET name = $1 WHERE email = $2',
            [name, email]
        );
        res.status(200).send({ message: 'User details updated successfully' });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).send({ error: 'Failed to update user details' });
    }
});


module.exports = router; 