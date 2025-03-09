const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db');
const multer = require('multer');
const path = require('path');

const stripe = require('stripe')('sk_test_51QtpcZDwTmkBGJT0HNZ1krU9MjIT4SCZj3fpNPG15E1kUs9DnJHJYDWb7lEB2J3sG5brnEJazhfqtahKiVVXkfRx00BtJo0Wmw');


router.post('/create-payment-link', async (req, res) => {
    try {
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: 'price_1QvLP2DwTmkBGJT0r4eIES1u',
            quantity: 1,
          },
        ],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: 'http://localhost:8081/index.html', // Erfolgreiche Zahlung
          },
        },
      });
  
      res.json({ url: paymentLink.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/create-payment-link2', async (req, res) => {
    try {
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: 'price_1QuEAaDwTmkBGJT0FI3D6Upw',
            quantity: 1,
          },
        ],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: 'http://localhost:8081/index.html', // Erfolgreiche Zahlung
          },
        },
      });
  
      res.json({ url: paymentLink.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


  router.post('/create-custompayment-link', async (req, res) => {
    console.log('war hier ------------------------------------------------------------------');
    try {
      const { productName, priceInCents, quantity } = req.body;

          // 1. Erstelle ein Produkt
    const product = await stripe.products.create({
      name: productName,
      description: "Eine kurze Beschreibung des Produkts",
    });

    console.log("Produkt-ID:", product.id);

    // 2. Erstelle den Preis für das Produkt
    const price = await stripe.prices.create({
      unit_amount: priceInCents, // Preis in Cent (50,00 €)
      currency: "eur",
      product: product.id,
    });

      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: price.id,
            quantity: quantity,
          },
        ],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: 'http://localhost:8081/index.html', // Erfolgreiche Zahlung
          },
        },
      });
  
      res.json({ url: paymentLink.url });
     
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  module.exports = router; 