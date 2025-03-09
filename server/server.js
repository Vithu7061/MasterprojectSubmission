const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool } = require('./db');
const authRoutes = require('./auth');
const stripeRoutes = require('./stripe');
const mailerRoutes = require('./mailer');

const productRoutes = require('./products');
const multer = require('multer');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

// Erstelle uploads Ordner, falls er nicht existiert
const uploadDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadDir)){
    require('fs').mkdirSync(uploadDir);
}

// Stelle uploads Ordner statisch zur Verfügung
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/productsupload', express.static(path.join(__dirname, 'productsupload')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/mailer', mailerRoutes);



app.post('/api/auth/register', async (req, res) => {
  const { accountType, name, email, password, companyDetails } = req.body;

  try {
    // Erstelle einen neuen Benutzer
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password, account_type) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, email, password, accountType]
    );

    const userId = userResult.rows[0].id;

    if (accountType === 'company' && companyDetails) {
      const { companyName, street, postalCode, city, iban, bic, accountHolder, subscriptionType } = companyDetails;

      // Speichere die Company Details inklusive Subscription
      await pool.query(
        `INSERT INTO company_details (user_id, company_name, street, postal_code, city, iban, bic, account_holder, subscription_type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, companyName, street, postalCode, city, iban, bic, accountHolder, subscriptionType]
      );
    }

    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send({ error: 'Registration failed' });
  }
});




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 