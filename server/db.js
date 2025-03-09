const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Sociebitedb',
    password: 'MasterPW',
    port: 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// Erstelle die Users-Tabelle
const createTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                account_type VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS company_details (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                company_name VARCHAR(100),
                street VARCHAR(100),
                postal_code VARCHAR(5),
                city VARCHAR(100),
                iban VARCHAR(34),
                bic VARCHAR(11),
                account_holder VARCHAR(100),
                subscription_type VARCHAR(20),
                subscription_start TIMESTAMP,
                logo_url VARCHAR(255)
            );

            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                seller_id INTEGER REFERENCES users(id),
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                quantity INTEGER NOT NULL,
                fullquantity INTEGER NOT NULL,
                available_from TIMESTAMP,
                available_until TIMESTAMP,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS purchases (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database tables created successfully');
/*
        // Check if products table is empty
        const productsCount = await pool.query('SELECT COUNT(*) FROM products');
        if (productsCount.rows[0].count === '0') {
            console.log('Adding sample products...');
            // Get a user id first
            const userResult = await pool.query('SELECT id FROM users LIMIT 1');
            if (userResult.rows[0]) {
                await pool.query(`
                    INSERT INTO products (
                        seller_id, name, description, price, 
                        quantity,fullquantity, available_from, 
                        available_until
                    ) VALUES 
                    ($1, 'Sushi Box', 'Frische Sushi Box mit verschiedenen Rolls', 22.90, 
                        5, 5,NOW(), NOW() + INTERVAL '2 days'),
                    ($1, 'Klassische italienische Pizza', 8.99,
                        3,3, NOW(), NOW() + INTERVAL '1 day'),
                    ($1, 'Gemüse Box', 'Frisches Bio-Gemüse Mix', 15.50,
                        10, 10,NOW(), NOW() + INTERVAL '3 days'),
                    ($1, 'Pasta Box', 'Hausgemachte Pasta mit Sauce', 12.90,
                        8,8, NOW(), NOW() + INTERVAL '1 day')
                `, [userResult.rows[0].id]);
                console.log('Sample products added');
            }
        }
*/
        // Füge logo_url Spalte hinzu, falls sie nicht existiert
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='company_details' AND column_name='logo_url'
                ) THEN
                    ALTER TABLE company_details ADD COLUMN logo_url VARCHAR(255);
                END IF;
            END $$;
        `);
    } catch (err) {
        console.error('Error creating/updating tables:', err);
    }
};

createTables();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
}; 