# Sociebite

## Prerequisites  
- Ensure **Node.js** and **npm** are installed.  
- Install and start **PostgreSQL** on your machine.  

## Database Setup  
1. Start PostgreSQL and create the database:  
   ```sql
   CREATE DATABASE Sociebitedb;
   ```
2. Update the database connection settings in `server/db.js` if needed:  
   ```javascript
   const pool = new Pool({
       user: 'postgres', // Change if using a different user
       host: 'localhost',
       database: 'Sociebitedb',
       password: 'MasterPW', // Update with your actual password
       port: 5432, // Modify if using a different port
   });
   ```

## Running the Application  
1. Open a terminal and navigate to the project root directory.  
2. Start the application:  
   ```sh
   npm run dev
   ```
This will launch the application on http://localhost:8081/landing.html.  
If your browser does not open please go to http://localhost:8081/landing.html in your choosen browser.

##Stripe testing
To test Stripe functionality, you can use the following test card details:

Card Number: 5555 5555 5555 4444

Expiration Date: Any future date (e.g., 12/34)

CVC: Any 3-digit number (e.g., 123)
---

