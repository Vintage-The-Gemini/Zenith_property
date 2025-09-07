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
      phone: '+254 700 123 456',
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
    <div className="bg-white">
      <Header />
      
      {/* Breadcrumb */}
      <nav className="bg-gray-50 py-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-primary-600">Home</Link>
            <span className="text-gray-300">/</span>
            <Link to="/properties" className="text-gray-500 hover:text-primary-600">Properties</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">{property.title}</span>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            to="/properties" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Properties
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Image Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative mb-8"
              >
                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-gray-200">
                  <img
                    src={property.images[currentImageIndex]}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      {isLiked ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                    <button className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                      <ShareIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/80 px-3 py-1 rounded-full text-sm">
                    <CameraIcon className="h-4 w-4 inline mr-1" />
                    {property.images.length} photos
                  </div>
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 aspect-square w-16 rounded-lg overflow-hidden ${
                        currentImageIndex === index ? 'ring-2 ring-primary-500' : ''
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
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        property.type === 'Apartment' ? 'bg-blue-100 text-blue-800' :
                        property.type === 'House' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {property.type === 'Apartment' ? (
                          <BuildingOffice2Icon className="h-3 w-3 mr-1" />
                        ) : property.type === 'House' ? (
                          <HomeIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <BuildingOffice2Icon className="h-3 w-3 mr-1" />
                        )}
                        {property.type}
                      </span>
                      {property.featured && (
                        <span className="inline-flex items-center rounded-full bg-accent-500 px-3 py-1 text-sm font-medium text-white">
                          Featured
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPinIcon className="h-5 w-5 mr-1" />
                      <span>{property.location}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center text-primary-600 font-bold text-3xl mb-2">
                      <CurrencyDollarIcon className="h-8 w-8 mr-1" />
                      {property.price.replace('KSH', '')}
                    </div>
                    <div className="text-sm text-gray-500">Property ID: {property.propertyId}</div>
                  </div>
                </div>

                {/* Property Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-xl mb-8">
                  {property.bedrooms > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                      <div className="text-sm text-gray-600">Bedroom{property.bedrooms > 1 ? 's' : ''}</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
                    <div className="text-sm text-gray-600">Bathroom{property.bathrooms > 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{property.area}</div>
                    <div className="text-sm text-gray-600">Total Area</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{property.yearBuilt}</div>
                    <div className="text-sm text-gray-600">Year Built</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Property</h2>
                  <p className="text-gray-600 leading-relaxed">{property.description}</p>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="sticky top-8"
              >
                {/* Agent Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Agent</h3>
                  
                  <div className="flex items-center mb-4">
                    <img
                      src={property.agent.image}
                      alt={property.agent.name}
                      className="h-12 w-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{property.agent.name}</div>
                      <div className="text-sm text-gray-600">Property Specialist</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <a
                      href={`tel:${property.agent.phone}`}
                      className="flex items-center text-gray-700 hover:text-primary-600"
                    >
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {property.agent.phone}
                    </a>
                    <a
                      href={`mailto:${property.agent.email}`}
                      className="flex items-center text-gray-700 hover:text-primary-600"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      {property.agent.email}
                    </a>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setShowContactForm(!showContactForm)}
                      className="w-full btn-primary"
                    >
                      Request Information
                    </button>
                    <a
                      href={`tel:${property.agent.phone}`}
                      className="w-full btn-secondary text-center block"
                    >
                      Call Now
                    </a>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Type:</span>
                      <span className="font-medium">{property.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{property.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year Built:</span>
                      <span className="font-medium">{property.yearBuilt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Area:</span>
                      <span className="font-medium">{property.area}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property ID:</span>
                      <span className="font-medium">{property.propertyId}</span>
                    </div>
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