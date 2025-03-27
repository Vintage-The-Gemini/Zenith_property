// models/Property.js
import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'condo', 'commercial', 'mixed-use'],
    required: true
  },
  units: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }],
  amenities: [{
    name: String,
    description: String
  }],
  managers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  documents: [{
    title: String,
    type: String,
    path: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    documents: [{
      title: String,
      path: String,
      uploadDate: { type: Date, default: Date.now }
    }]
  },
  expenses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Property', propertySchema);