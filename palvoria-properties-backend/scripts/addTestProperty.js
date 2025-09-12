import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/Property.js';

dotenv.config();

const addTestProperty = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const testProperty = {
      title: "Modern Westlands Apartment",
      description: "Beautiful 2-bedroom apartment in the heart of Westlands with modern amenities and great city views.",
      propertyType: "apartment",
      category: "sale", // Required field
      status: "active", // Valid enum value
      featured: true,
      price: {
        amount: 12500000,
        currency: "KES" // Valid enum value
      },
      location: {
        address: "Westlands Road",
        city: "Nairobi",
        county: "Nairobi",
        area: "Westlands"
      },
      features: {
        bedrooms: 2,
        bathrooms: 2,
        area: {
          size: 1200,
          unit: "sqft" // Valid enum value
        }
      },
      amenities: [
        { name: "Parking" },
        { name: "Security" },
        { name: "Gym" },
        { name: "Swimming Pool" }
      ],
      images: [
        {
          url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
          publicId: "test-property-image-1",
          isPrimary: true,
          order: 0
        }
      ],
      owner: new mongoose.Types.ObjectId(), // Required field
      contact: {
        name: "Palvoria Properties",
        phone: "+254757880789",
        email: "info@palvoria.com"
      }
    };

    const property = new Property(testProperty);
    await property.save();
    
    console.log('✅ Test property created successfully!');
    console.log('Property ID:', property._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test property:', error);
    process.exit(1);
  }
};

addTestProperty();