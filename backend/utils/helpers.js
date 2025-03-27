// utils/helpers.js
import crypto from 'crypto';

export const generateReference = () => {
  return `REF-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
};

export const calculateProRatedRent = (monthlyRent, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const daysOccupied = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return (monthlyRent / daysInMonth) * daysOccupied;
};

export const calculateLateFees = (dueAmount, daysLate, lateFeePercentage = 0.1) => {
  return dueAmount * lateFeePercentage * Math.min(daysLate, 3); // Cap at 3 days
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const generateInvoiceNumber = (prefix = 'INV') => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp.slice(-6)}${random}`;
};