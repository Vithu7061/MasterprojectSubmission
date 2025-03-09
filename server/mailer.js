const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db');
const multer = require('multer');
const path = require('path');

// Konfigurieren Sie den Nodemailer-Transporter

const transporter = nodemailer.createTransport({
  service: 'gmail', // oder ein anderer E-Mail-Dienst
  auth: {
    user: 'noreply.sociebite@gmail.com', // Ihre E-Mail-Adresse
    pass: 'rxnj pegj vjej dtkw'
  }
});

// API-Route zum Versenden von E-Mails
router.post('/send-order-email', async (req, res) => {
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: 'noreply@sociebite.com',
    to: to,
    subject: subject,
    html: text
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Email sent successfully' });
    console.log('mail send___________________');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send({ error: 'Failed to send email' });
  }
});

module.exports = router; 