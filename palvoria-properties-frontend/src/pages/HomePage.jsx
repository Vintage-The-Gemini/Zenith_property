import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BuildingOfficeIcon, 
  HomeIcon, 
  MapPinIcon, 
  StarIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'
import SearchForm from '../components/SearchForm'

const stats = [
  { id: 1, name: 'Properties Available', value: '250+' },
  { id: 2, name: 'Happy Kenyan Families', value: '1,200+' },
  { id: 3, name: 'Years in Kenya', value: '15+' },
  { id: 4, name: 'Kenyan Cities', value: '8' },
]

const features = [
  {
    name: 'Premium Properties',
    description: 'Carefully curated selection of high-quality residential and commercial properties.',
    icon: BuildingOfficeIcon,
  },
  {
    name: 'Expert Guidance',
    description: 'Professional real estate experts to guide you through every step of your journey.',
    icon: HomeIcon,
  },
  {
    name: 'Prime Kenyan Locations',
    description: 'Properties in Kenya\'s most sought-after locations from Nairobi to Mombasa with excellent connectivity.',
    icon: MapPinIcon,
  },
  {
    name: 'Trusted in Kenya',
    description: 'Award-winning service with over 15 years of excellence in Kenyan real estate market.',
    icon: StarIcon,
  },
]

// Mock featured properties in Kenya
const featuredProperties = [
  {
    id: 1,
    title: 'Modern Westlands Apartment',
    price: 'KSH 45M',
    location: 'Westlands, Nairobi',
    bedrooms: 2,
    bathrooms: 2,
    area: '1,200 sq ft',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    type: 'Apartment',
    featured: true
  },
  {
    id: 2,
    title: 'Luxury Karen Villa',
    price: 'KSH 85M',
    location: 'Karen, Nairobi',
    bedrooms: 4,
    bathrooms: 3,
    area: '2,800 sq ft',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80',
    type: 'House',
    featured: true
  },
  {
    id: 3,
    title: 'CBD Office Space',
    price: 'KSH 65M',
    location: 'CBD, Nairobi',
    bedrooms: 0,
    bathrooms: 2,
    area: '1,800 sq ft',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80',
    type: 'Commercial',
    featured: true
  },
]

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredProperties.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Find Your Perfect Property
              <span className="text-accent-500"> in Kenya</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-100">
              Discover exceptional residential and commercial properties across Kenya with Palvoria Properties. 
              Your trusted partner in Kenyan real estate for over 15 years - from Nairobi to Mombasa and beyond.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/search" className="btn-primary">
                Start Your Search
              </Link>
              <Link to="/properties" className="btn-secondary bg-white text-primary-600 hover:bg-gray-50">
                Browse Properties
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 400 400">
            <defs>
              <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.1)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>
      </section>


      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Trusted by thousands of clients
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Our track record speaks for itself
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col bg-gray-50 p-8"
                >
                  <dt className="text-sm font-semibold leading-6 text-gray-600">{stat.name}</dt>
                  <dd className="order-first text-3xl font-semibold tracking-tight text-primary-600">
                    {stat.value}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured Properties
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Discover our handpicked selection of premium properties
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {featuredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <PropertyCard property={property} />
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link
              to="/properties"
              className="inline-flex items-center gap-x-2 btn-primary"
            >
              View All Properties
              <ChevronRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose Palvoria Properties?
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              We provide exceptional service and expertise in every transaction
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex gap-x-4"
                >
                  <div className="flex-none">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">
                      {feature.name}
                    </h3>
                    <p className="mt-2 text-base leading-7 text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to find your dream property?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Let our experts help you find the perfect property that matches your needs and budget.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/contact" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
                Contact Us Today
              </Link>
              <Link to="/search" className="font-semibold leading-6 text-white hover:text-primary-100">
                Start Searching <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}