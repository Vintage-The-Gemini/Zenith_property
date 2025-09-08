import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  MapPinIcon, 
  BuildingOffice2Icon, 
  HomeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronLeftIcon,
  HeartIcon,
  ShareIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Header from '../components/Header'
import Footer from '../components/Footer'

// Mock property data (in a real app, this would come from an API)
const propertyData = {
  1: {
    id: 1,
    title: 'Modern Westlands Apartment',
    price: 'KSH 45M',
    location: 'Westlands, Nairobi',
    bedrooms: 2,
    bathrooms: 2,
    area: '1,200 sq ft',
    type: 'Apartment',
    featured: true,
    description: 'Stunning modern apartment in the heart of Westlands, Nairobi. This beautiful 2-bedroom, 2-bathroom unit offers contemporary living with high-end finishes throughout. Located in one of Nairobi\'s most sought-after neighborhoods, you\'ll enjoy easy access to shopping, dining, and business districts.',
    features: [
      'Modern fitted kitchen with granite countertops',
      'Master bedroom with en-suite bathroom',
      'Private balcony with city views',
      'Secure parking space',
      '24/7 security and CCTV',
      'Backup generator',
      'Swimming pool and gym facilities',
      'Close to Sarit Centre and Westgate Mall'
    ],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80'
    ],
    yearBuilt: 2020,
    propertyId: 'PV-WL-001',
    agent: {
      name: 'Sarah Wanjiku',
      phone: '+254 757 880 789',
      email: 'sarah@palvoriaproperties.co.ke',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b9c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
    }
  },
  2: {
    id: 2,
    title: 'Luxury Karen Villa',
    price: 'KSH 85M',
    location: 'Karen, Nairobi',
    bedrooms: 4,
    bathrooms: 3,
    area: '2,800 sq ft',
    type: 'House',
    featured: false,
    description: 'Magnificent 4-bedroom villa nestled in the prestigious Karen neighborhood. This luxurious family home sits on a quarter-acre plot with beautifully landscaped gardens. Perfect for families seeking elegance and tranquility in one of Nairobi\'s most exclusive areas.',
    features: [
      'Spacious living and dining areas',
      'Modern fitted kitchen with pantry',
      'Master bedroom with walk-in closet',
      'Private garden with mature trees',
      'Double garage with additional parking',
      'Staff quarters',
      'Borehole water supply',
      'Electric fence and security system'
    ],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    ],
    yearBuilt: 2018,
    propertyId: 'PV-KR-002',
    agent: {
      name: 'Michael Ochieng',
      phone: '+254 722 345 678',
      email: 'michael@palvoriaproperties.co.ke',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
    }
  },
  3: {
    id: 3,
    title: 'CBD Office Space',
    price: 'KSH 65M',
    location: 'CBD, Nairobi',
    bedrooms: 0,
    bathrooms: 2,
    area: '1,800 sq ft',
    type: 'Commercial',
    featured: false,
    description: 'Prime commercial office space in Nairobi\'s Central Business District. This modern office suite offers excellent visibility and accessibility for your business. Perfect for companies looking to establish their presence in Kenya\'s financial hub.',
    features: [
      'Open plan office layout',
      'Reception area',
      'Conference room',
      'High-speed internet ready',
      'Air conditioning throughout',
      'Elevator access',
      'Dedicated parking spaces',
      'Walking distance to banks and government offices'
    ],
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80'
    ],
    yearBuilt: 2019,
    propertyId: 'PV-CBD-003',
    agent: {
      name: 'Emily Mwangi',
      phone: '+254 733 456 789',
      email: 'emily@palvoriaproperties.co.ke',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
    }
  }
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  
  const property = propertyData[id]
  
  if (!property) {
    return (
      <div className="bg-white">
        <Header />
        <main className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Property Not Found</h1>
            <p className="text-lg text-gray-600 mb-8">The property you're looking for doesn't exist.</p>
            <Link to="/properties" className="btn-primary">
              View All Properties
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'rgb(252, 224, 177)', minHeight: '100vh' }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-16 lg:pt-20 pb-16 overflow-hidden" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        {/* Parallax Background */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-10 parallax"
            src={property.images[0]}
            alt="Property background"
            style={{ transform: 'scale(1.05)' }}
          />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
          <div className="pt-20 lg:pt-32 text-center">
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-black mb-8 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2 }}
            >
              {property.location.split(',')[0].toUpperCase()}
            </motion.h1>
            <motion.h2 
              className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-black mb-8 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            >
              {property.title.toUpperCase()}
            </motion.h2>
            
            <motion.div
              className="flex items-center justify-center gap-8 mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-black mb-2 vogue-heading">{property.price}</div>
                <div className="text-sm text-black uppercase tracking-widest" style={{ fontWeight: '300' }}>Investment</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="py-8" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            to="/properties" 
            className="inline-flex items-center gap-2 text-black hover:text-gray-800 mb-8 text-sm font-semibold uppercase tracking-widest"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Collection
          </Link>

          <div className="grid grid-cols-1 gap-16">
            {/* Main Content */}
            <div>
              {/* Image Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative mb-8"
              >
                <div className="aspect-[16/10] overflow-hidden bg-white">
                  <img
                    src={property.images[currentImageIndex]}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4 bg-black text-white px-4 py-2 text-sm font-semibold uppercase tracking-widest">
                    <CameraIcon className="h-4 w-4 inline mr-2" />
                    {property.images.length} Images
                  </div>
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 aspect-square w-16 overflow-hidden ${
                        currentImageIndex === index ? 'ring-2 ring-black' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${property.title} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Property Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center mb-16"
              >
                <div className="mb-8">
                  <span className="inline-block bg-black text-white px-6 py-2 text-sm font-semibold uppercase tracking-widest mb-4">
                    {property.type}
                  </span>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 vogue-heading leading-none">
                    PROPERTY
                    <br />
                    DETAILS
                  </h2>
                  <div className="flex items-center justify-center text-black mb-4">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span className="text-lg">{property.location}</span>
                  </div>
                  <div className="text-sm text-black uppercase tracking-widest" style={{ fontWeight: '300' }}>
                    Property ID: {property.propertyId}
                  </div>
                </div>

                {/* Property Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                  {property.bedrooms > 0 && (
                    <div className="text-center">
                      <div className="text-4xl lg:text-5xl font-bold text-black mb-2 vogue-heading">{property.bedrooms}</div>
                      <div className="text-sm text-black uppercase tracking-widest" style={{ fontWeight: '300' }}>Bedroom{property.bedrooms > 1 ? 's' : ''}</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-4xl lg:text-5xl font-bold text-black mb-2 vogue-heading">{property.bathrooms}</div>
                    <div className="text-sm text-black uppercase tracking-widest" style={{ fontWeight: '300' }}>Bathroom{property.bathrooms > 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl lg:text-5xl font-bold text-black mb-2 vogue-heading">{property.area}</div>
                    <div className="text-sm text-black uppercase tracking-widest" style={{ fontWeight: '300' }}>Total Area</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl lg:text-5xl font-bold text-black mb-2 vogue-heading">{property.yearBuilt}</div>
                    <div className="text-sm text-black uppercase tracking-widest" style={{ fontWeight: '300' }}>Year Built</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-16 text-center">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-8 vogue-heading leading-none">
                    ABOUT THIS
                    <br />
                    PROPERTY
                  </h2>
                  <p className="text-lg md:text-xl text-black leading-relaxed max-w-4xl mx-auto" style={{ fontWeight: '300' }}>
                    {property.description}
                  </p>
                </div>

                {/* Features */}
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-12 vogue-heading leading-none">
                    PROPERTY
                    <br />
                    FEATURES
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-center md:justify-start">
                        <div className="w-3 h-3 bg-black mr-4"></div>
                        <span className="text-black text-lg">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}