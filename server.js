// File: server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://hemanthchiluka792:FmpkLzRZsN4ZkiDR@cluster0.fxvmarn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Loan Schema
const loanSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  loanTenure: Number,
  reason: String,
  employmentStatus: String,
  employmentAddress: String,
  dateApplied: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' } // approved, rejected, reviewed
});

const Loan = mongoose.model('Loan', loanSchema);

// POST - Submit Loan Application
app.post('/api/loans', async (req, res) => {
  try {
    const loan = new Loan(req.body);
    await loan.save();
    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Get All Loans
app.get('/api/loans', async (req, res) => {
  try {
    const loans = await Loan.find().sort({ dateApplied: -1 });
    res.status(200).json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH - Update Loan Status
app.patch('/api/loans/:id', async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Dashboard Summary
app.get('/api/summary', async (req, res) => {
  try {
    const totalLoans = await Loan.countDocuments();
    const totalBorrowers = await Loan.distinct('name').then(names => names.length);
    const totalCashDisbursed = await Loan.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalSavings = 450000; // dummy static data
    const cashReceived = 1000000; // dummy static data
    const repaidLoans = await Loan.countDocuments({ status: 'repaid' });

    res.json({
      totalLoans,
      totalBorrowers,
      totalCashDisbursed: totalCashDisbursed[0]?.total || 0,
      totalSavings,
      cashReceived,
      repaidLoans
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
