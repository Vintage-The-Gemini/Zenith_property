// models/Expense.js
import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  category: {
    type: String,
    required: true,
    enum: ['maintenance', 'utilities', 'taxes', 'insurance', 'mortgage', 'payroll', 'marketing', 'custom']
  },
  customCategory: {
    type: String,
    required: function() {
      return this.category === 'custom';
    }
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'annually'],
      required: function() {
        return this.recurring.isRecurring;
      }
    },
    nextDueDate: Date
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  documents: [{
    title: String,
    path: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  vendor: {
    name: String,
    contact: String,
    invoiceNumber: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Expense', expenseSchema);