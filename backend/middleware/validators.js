// backend/middleware/validators.js
import { check, validationResult } from 'express-validator';

export const validateUser = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('firstName', 'First name is required').notEmpty(),
  check('lastName', 'Last name is required').notEmpty()
];

export const validateProperty = [
  check('name', 'Property name is required').notEmpty(),
  check('address.street', 'Street address is required').notEmpty(),
  check('address.city', 'City is required').notEmpty(),
  check('address.state', 'State is required').notEmpty(),
  check('address.zipCode', 'Zip code is required').notEmpty(),
  check('propertyType', 'Property type is required').isIn(['apartment', 'house', 'condo', 'commercial', 'mixed-use'])
];

export const validateTenant = [
  check('firstName', 'First name is required').notEmpty(),
  check('lastName', 'Last name is required').notEmpty(),
  check('email', 'Valid email is required').isEmail(),
  check('phone', 'Valid phone number is required').matches(/^(\+254|254|0)[17]\d{8}$/),
  check('nationalId', 'Valid national ID is required').matches(/^\d{8}$/),
  check('dateOfBirth', 'Valid date of birth is required').isISO8601()
];

export const validateUnit = [
  check('propertyId', 'Property ID is required').notEmpty(),
  check('unitNumber', 'Unit number is required').notEmpty(),
  check('type', 'Unit type must be valid').isIn(['rental', 'bnb', 'commercial', 'storage', 'parking', 'mixed']),
  check('specifications.bedrooms', 'Number of bedrooms is required').isNumeric(),
  check('specifications.bathrooms', 'Number of bathrooms is required').isNumeric(),
];

export const validateExpense = [
  check('property', 'Property ID is required').notEmpty(),
  check('category', 'Valid expense category is required').isIn([
    'maintenance', 'utilities', 'taxes', 'insurance', 'mortgage', 'payroll', 'marketing', 'custom'
  ]),
  check('amount', 'Amount is required and must be numeric').isNumeric(),
  check('date', 'Valid date is required').isISO8601(),
  check('description', 'Description is required').notEmpty()
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Default export for convenience
export default {
  validateUser,
  validateProperty,
  validateTenant,
  validateUnit,
  validateExpense,
  validate
};