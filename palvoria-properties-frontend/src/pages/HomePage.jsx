import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BuildingOfficeIcon, 
  HomeIcon, 
  MapPinIcon, 
  StarIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'

const featuredProperties = [
  {
    id: 1,
    title: 'Modern Westlands Apartment',
    price: 'KSH 12,500,000',
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
    price: 'KSH 35,000,000',
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
    price: 'KSH 18,000,000',
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
  return (
    <div style={{ backgroundColor: 'rgb(252, 224, 177)', minHeight: '100vh' }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-16 lg:pt-20 pb-32 overflow-hidden min-h-screen" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        {/* Parallax Background */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-10 parallax"
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
            alt="Nairobi architecture"
            style={{ transform: 'scale(1.05)' }}
          />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
          <div className="pt-20 lg:pt-32 text-center">
            <motion.h1 
              className="text-6xl md:text-8xl lg:text-9xl xl:text-[12rem] font-bold text-black mb-8 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2 }}
            >
              NAIROBI
            </motion.h1>
            <motion.h2 
              className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-black mb-16 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            >
              LUXURY LIVING
            </motion.h2>
            
            <motion.div
              className="max-w-4xl mx-auto mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className="text-lg md:text-xl lg:text-2xl text-black leading-relaxed" style={{ fontWeight: '300' }}>
                From the sophisticated towers of Westlands to the serene estates of Karen — we curate Kenya's most prestigious addresses for those who demand excellence.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link 
                to="/properties" 
                className="bg-black text-white px-8 lg:px-12 py-3 lg:py-4 text-sm font-semibold hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest"
              >
                View Collection
              </Link>
              <Link 
                to="/contact" 
                className="border-2 border-black text-black px-8 lg:px-12 py-3 lg:py-4 text-sm font-semibold hover:bg-black hover:text-white transition-all duration-300 uppercase tracking-widest"
              >
                Private Consultation
              </Link>
            </motion.div>
          </div>
          
          {/* Featured Property Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-20"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            {featuredProperties.slice(0, 3).map((property, index) => (
              <Link key={property.id} to={`/properties/${property.id}`} className="group cursor-pointer">
                <div className="relative overflow-hidden mb-4">
                  <img
                    className="w-full h-64 lg:h-80 object-cover transition-transform duration-700 group-hover:scale-105"
                    src={property.image}
                    alt={property.title}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl lg:text-2xl font-bold text-black mb-2 vogue-heading">
                    {property.location.split(',')[0].toUpperCase()}
                  </h3>
                  <p className="text-black text-sm lg:text-base" style={{ fontWeight: '300' }}>
                    {property.price}
                  </p>
                </div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2 
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-black mb-8 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              YOUR NAIROBI
              <br />
              JOURNEY
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-black max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ fontWeight: '300' }}
            >
              Whether you're ready to buy, sell, or rent — we've curated the perfect path for your Nairobi property dreams.
            </motion.p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            {/* Buy */}
            <div className="group text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-black mx-auto mb-6 flex items-center justify-center">
                  <div className="text-white text-3xl font-bold vogue-heading">B</div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-black mb-4 vogue-heading">BUY</h3>
                <p className="text-black leading-relaxed mb-8" style={{ fontWeight: '300' }}>
                  Discover your perfect Nairobi home. From Westlands penthouses to Karen estates — we'll find your forever address.
                </p>
              </div>
              <Link 
                to="/properties" 
                className="bg-black text-white px-8 py-3 text-sm font-semibold hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest group-hover:scale-105"
              >
                Browse Properties
              </Link>
            </div>

            {/* Sell */}
            <div className="group text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-black mx-auto mb-6 flex items-center justify-center">
                  <div className="text-white text-3xl font-bold vogue-heading">S</div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-black mb-4 vogue-heading">SELL</h3>
                <p className="text-black leading-relaxed mb-8" style={{ fontWeight: '300' }}>
                  Ready to move on? We'll showcase your property to Nairobi's most discerning buyers with unmatched expertise.
                </p>
              </div>
              <Link 
                to="/contact" 
                className="bg-black text-white px-8 py-3 text-sm font-semibold hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest group-hover:scale-105"
              >
                Sell With Us
              </Link>
            </div>

            {/* Rent */}
            <div className="group text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-black mx-auto mb-6 flex items-center justify-center">
                  <div className="text-white text-3xl font-bold vogue-heading">R</div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-black mb-4 vogue-heading">RENT</h3>
                <p className="text-black leading-relaxed mb-8" style={{ fontWeight: '300' }}>
                  Flexible living in Nairobi's prime locations. From short stays to long-term homes — find your perfect rental.
                </p>
              </div>
              <Link 
                to="/contact" 
                className="bg-black text-white px-8 py-3 text-sm font-semibold hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest group-hover:scale-105"
              >
                Find Rentals
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="py-32" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-32">
            <motion.h2 
              className="text-6xl md:text-8xl lg:text-9xl font-bold text-black mb-16 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              PREMIUM
              <br />
              LOCATIONS
            </motion.h2>
            <motion.p 
              className="text-xl lg:text-2xl text-black max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ fontWeight: '300' }}
            >
              Each neighborhood tells a story. From the cosmopolitan energy of Westlands to the tranquil elegance of Karen — discover where luxury meets lifestyle.
            </motion.p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <div className="space-y-12">
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-black mb-4 vogue-heading">WESTLANDS</h3>
                <p className="text-lg text-black leading-relaxed" style={{ fontWeight: '300' }}>
                  The beating heart of Nairobi's business district. Where modern architecture meets urban sophistication.
                </p>
              </div>
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-black mb-4 vogue-heading">KAREN</h3>
                <p className="text-lg text-black leading-relaxed" style={{ fontWeight: '300' }}>
                  Expansive estates and verdant landscapes. The epitome of refined living away from the city's pulse.
                </p>
              </div>
            </div>
            <div className="space-y-12">
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-black mb-4 vogue-heading">KILIMANI</h3>
                <p className="text-lg text-black leading-relaxed" style={{ fontWeight: '300' }}>
                  Contemporary living for the modern professional. Sleek apartments with unparalleled city views.
                </p>
              </div>
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-black mb-4 vogue-heading">LAVINGTON</h3>
                <p className="text-lg text-black leading-relaxed" style={{ fontWeight: '300' }}>
                  Family-oriented luxury in one of Nairobi's most established and secure neighborhoods.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <motion.h2 
            className="text-6xl md:text-8xl lg:text-9xl font-bold text-black mb-16 vogue-heading leading-none"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            YOUR STORY
            <br />
            BEGINS HERE
          </motion.h2>
          <motion.p 
            className="text-xl lg:text-2xl text-black mb-16 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontWeight: '300' }}
          >
            Every address we curate is more than a location — it's the foundation for your next chapter in Kenya's capital.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link 
              to="/contact" 
              className="bg-black text-white px-12 lg:px-16 py-4 lg:py-6 text-lg font-semibold hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest"
            >
              Begin Your Journey
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}