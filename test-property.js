// Test script to validate property creation with correct data format
const testProperty = {
  title: "Luxury 4BR Villa in Karen",
  description: "Beautiful modern villa with swimming pool and garden",
  propertyType: "villa",
  category: "sale",
  location: {
    address: "123 Karen Road",
    city: "Nairobi",
    county: "Nairobi",
    neighborhood: "Karen"
  },
  price: {
    amount: 75000000,
    currency: "KES",
    period: "one-time"
  },
  features: {
    bedrooms: 4,
    bathrooms: 3,
    area: {
      size: 2500,
      unit: "sqft"
    }
  },
  amenities: [
    { name: "Swimming Pool", icon: "", description: "" },
    { name: "Garden", icon: "", description: "" },
    { name: "Security", icon: "", description: "" }
  ],
  status: "active",
  featured: true,
  yearBuilt: 2020,
  images: [],
  owner: "507f1f77bcf86cd799439011"
};

// Send test request
fetch('http://localhost:5000/api/properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testProperty)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Success:', data);
})
.catch(error => {
  console.error('Error:', error);
});