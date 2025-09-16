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
import SEOHead from '../components/SEOHead'
import apiService from '../services/api'


export default function HomePage() {
  const [featuredProps, setFeaturedProps] = useState([])
  const [offPlanProps, setOffPlanProps] = useState([])
  const [locationProperties, setLocationProperties] = useState([])

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        // Fetch from Palvoria's own database
        const response = await apiService.getProperties({ status: 'active', limit: 3 })
        console.log('Fetched featured properties:', response)

        if (response.success && response.data && response.data.length > 0) {
          // Transform Palvoria backend data to match frontend format
          const transformedProperties = response.data.slice(0, 3).map(property => ({
            id: property._id,
            title: property.title,
            price: `KSH ${property.price?.amount?.toLocaleString() || 'Price on Request'}`,
            location: `${property.location?.city || ''}, ${property.location?.county || 'Kenya'}`,
            bedrooms: property.features?.bedrooms || 0,
            bathrooms: property.features?.bathrooms || 0,
            area: property.features?.area ? `${property.features.area.size} ${property.features.area.unit}` : 'N/A',
            image: property.images && property.images.length > 0 ?
              (property.images.find(img => img.isPrimary) || property.images[0]).url :
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            type: property.propertyType?.charAt(0).toUpperCase() + property.propertyType?.slice(1) || 'Property',
            featured: true
          }))

          setFeaturedProps(transformedProperties)
        }
      } catch (err) {
        console.error('Error fetching featured properties:', err)
      }
    }

    const fetchOffPlanProperties = async () => {
      try {
        // Fetch off-plan properties
        const response = await apiService.getProperties({ status: 'active', isOffPlan: true, limit: 4 })
        console.log('Fetched off-plan properties:', response)

        if (response.success && response.data && response.data.length > 0) {
          const transformedProperties = response.data.map(property => ({
            id: property._id,
            title: property.title,
            price: `KSH ${property.price?.amount?.toLocaleString() || 'Price on Request'}`,
            location: `${property.location?.city || ''}, ${property.location?.county || 'Kenya'}`,
            bedrooms: property.features?.bedrooms || 0,
            bathrooms: property.features?.bathrooms || 0,
            area: property.features?.area ? `${property.features.area.size} ${property.features.area.unit}` : 'N/A',
            image: property.images && property.images.length > 0 ?
              (property.images.find(img => img.isPrimary) || property.images[0]).url :
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            type: property.propertyType?.charAt(0).toUpperCase() + property.propertyType?.slice(1) || 'Property',
            isOffPlan: property.isOffPlan,
            completionDate: property.offPlanDetails?.completionDate,
            constructionProgress: property.offPlanDetails?.constructionProgress || 0,
            developer: property.offPlanDetails?.developer?.name || 'Developer',
            projectName: property.offPlanDetails?.projectDetails?.projectName || property.title
          }))

          setOffPlanProps(transformedProperties)
        }
      } catch (err) {
        console.error('Error fetching off-plan properties:', err)
      }
    }

    const fetchLocationProperties = async () => {
      try {
        // Fetch all active properties to group by location
        const response = await apiService.getProperties({ status: 'active', limit: 100 })
        console.log('Fetched properties for locations:', response)

        if (response.success && response.data && response.data.length > 0) {
          // Group properties by area/location
          const groupedByArea = response.data.reduce((acc, property) => {
            const area = property.location?.area || property.location?.city || 'Other'
            if (!acc[area]) {
              acc[area] = []
            }
            acc[area].push({
              id: property._id,
              title: property.title,
              price: `KSH ${property.price?.amount?.toLocaleString() || 'Price on Request'}`,
              location: `${property.location?.city || ''}, ${property.location?.county || 'Kenya'}`,
              area: area,
              image: property.images && property.images.length > 0 ?
                (property.images.find(img => img.isPrimary) || property.images[0]).url :
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
              propertyType: property.propertyType,
              bedrooms: property.features?.bedrooms || 0,
              bathrooms: property.features?.bathrooms || 0
            })
            return acc
          }, {})

          // Convert to array format and sort by property count
          const locationData = Object.keys(groupedByArea)
            .map(area => ({
              name: area.toUpperCase(),
              description: getAreaDescription(area),
              properties: groupedByArea[area].length,
              sampleProperties: groupedByArea[area].slice(0, 3), // Take first 3 as samples
              // Use the primary image from the first property as the area image
              image: groupedByArea[area][0]?.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            }))
            .sort((a, b) => b.properties - a.properties) // Sort by property count descending
            .slice(0, 6) // Take top 6 areas

          setLocationProperties(locationData)
        }
      } catch (err) {
        console.error('Error fetching location properties:', err)
      }
    }

    // Helper function to get area descriptions
    const getAreaDescription = (area) => {
      const descriptions = {
        'Westlands': 'Urban sophistication at its finest',
        'Karen': 'Tranquil luxury estates',
        'Kileleshwa': 'Dynamic professional living',
        'Runda': 'Exclusive gated communities',
        'Lavington': 'Family-oriented elegance',
        'Loresho': 'Private sanctuary living',
        'Kilimani': 'Contemporary urban lifestyle',
        'Upperhill': 'Business district luxury',
        'Muthaiga': 'Elite residential enclave',
        'Spring Valley': 'Peaceful suburban charm'
      }
      return descriptions[area] || 'Premium residential area'
    }

    fetchFeaturedProperties()
    fetchOffPlanProperties()
    fetchLocationProperties()
  }, [])

  return (
    <div style={{ backgroundColor: 'rgb(252, 224, 177)', minHeight: '100vh' }}>
      <SEOHead
        customTitle="Palvoria Properties - Premium Real Estate in Kenya"
        customDescription="Discover luxury properties in Nairobi's prime locations. Houses, apartments, and commercial spaces in Westlands, Karen, Kilimani, and more premium areas."
        customKeywords={['real estate kenya', 'properties nairobi', 'houses for sale', 'apartments rent', 'luxury properties', 'westlands karen kilimani']}
        pageType="homepage"
      />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen pt-20" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        {/* Artistic Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 right-10 w-96 h-96 border-4 border-black/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/4 left-10 w-64 h-64 border-2 border-black/5"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-black/5 rounded-full"></div>
          </div>
          <img
            className="absolute right-0 top-0 w-1/2 h-full object-cover opacity-20 mix-blend-multiply"
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
            alt="Nairobi skyline"
          />
        </div>

        <div className="relative z-10 flex items-center min-h-[calc(100vh-5rem)]">
          <div className="mx-auto max-w-7xl px-4 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="text-left">
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1 }}
                >
                  <div className="inline-block border-l-4 border-black pl-6">
                    <span className="text-sm font-light tracking-[0.3em] text-black/70 uppercase">Premium Real Estate</span>
                  </div>
                </motion.div>

                <motion.h1
                  className="text-7xl md:text-8xl lg:text-9xl font-bold text-black mb-6 vogue-heading leading-[0.85]"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1.2, delay: 0.2 }}
                >
                  NAIROBI
                  <br />
                  <span className="text-6xl md:text-7xl lg:text-8xl font-light italic">Luxury</span>
                  <br />
                  <span className="text-5xl md:text-6xl lg:text-7xl">LIVING</span>
                </motion.h1>

                <motion.p
                  className="text-lg md:text-xl text-black/80 max-w-lg mb-12 leading-relaxed font-light"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  Curating Kenya's most prestigious addresses where architectural excellence meets uncompromising luxury.
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row gap-6"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.6 }}
                >
                  <Link
                    to="/properties"
                    className="group bg-black text-white px-10 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-black/80 transition-all duration-500 flex items-center gap-3"
                  >
                    Explore Collection
                    <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/contact"
                    className="group border-2 border-black text-black px-10 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-500 flex items-center gap-3"
                  >
                    Consultation
                    <StarIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  </Link>
                </motion.div>
              </div>

              {/* Right Content - Featured Property Showcase */}
              <div className="relative">
                <motion.div
                  className="space-y-8"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.8 }}
                >
                  {featuredProps.length > 0 ? featuredProps.slice(0, 2).map((property, index) => (
                    <div key={property.id} className={`group relative ${index === 1 ? 'ml-20' : ''}`}>
                      <div className="relative overflow-hidden">
                        <img
                          className="w-full h-72 object-cover transition-all duration-700 group-hover:scale-105"
                          src={property.image}
                          alt={property.title}
                          style={{
                            filter: 'sepia(20%) saturate(80%) contrast(110%)',
                            clipPath: index === 0 ? 'polygon(0 0, 85% 0, 100% 100%, 0 100%)' : 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-6 left-6">
                          <div className="border-l-4 border-white pl-4">
                            <h3 className="text-2xl font-bold text-white vogue-heading mb-1">
                              {property.location?.split(',')[0]?.toUpperCase() || property.title?.toUpperCase() || 'PREMIUM PROPERTY'}
                            </h3>
                            <p className="text-white/90 font-light">{property.price}</p>
                          </div>
                        </div>
                        <Link
                          to={`/properties/${property.id}`}
                          className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm text-white p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30"
                        >
                          <ChevronRightIcon className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  )) : (
                    // Fallback for when no properties are loaded yet
                    [0, 1].map((index) => (
                      <div key={index} className={`group relative ${index === 1 ? 'ml-20' : ''}`}>
                        <div className="relative overflow-hidden">
                          <div
                            className="w-full h-72 bg-gradient-to-br from-gray-200 to-gray-300 transition-all duration-700"
                            style={{
                              clipPath: index === 0 ? 'polygon(0 0, 85% 0, 100% 100%, 0 100%)' : 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-6 left-6">
                            <div className="border-l-4 border-white pl-4">
                              <h3 className="text-2xl font-bold text-white vogue-heading mb-1">
                                {index === 0 ? 'WESTLANDS' : 'KAREN'}
                              </h3>
                              <p className="text-white/90 font-light">Premium Properties Available</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>

                {/* Decorative Elements */}
                <motion.div
                  className="absolute -top-10 -right-10 w-32 h-32 border border-black/10"
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 45 }}
                  transition={{ duration: 2, delay: 1.5 }}
                ></motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Gallery Section */}
      <section className="py-32 relative overflow-hidden" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-black mb-8 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              FEATURED
              <br />
              <span className="italic font-light">Collection</span>
            </motion.h2>
            <motion.div
              className="w-24 h-1 bg-black mx-auto mb-8"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ duration: 1, delay: 0.5 }}
            ></motion.div>
            <motion.p
              className="text-lg md:text-xl text-black max-w-3xl mx-auto leading-relaxed font-light"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Handpicked properties that define luxury living in Nairobi's most coveted addresses.
            </motion.p>
          </div>

          {/* Dynamic Property Showcase */}
          {featuredProps.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              {featuredProps.slice(0, 6).map((property, index) => (
                <motion.div
                  key={property.id}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-700"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  style={{
                    clipPath: index % 3 === 0 ? 'polygon(0 0, 90% 0, 100% 100%, 0 100%)' :
                             index % 3 === 1 ? 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' :
                             'polygon(5% 0, 95% 0, 100% 100%, 0 100%)'
                  }}
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      style={{
                        filter: 'sepia(10%) saturate(90%) contrast(105%)',
                        mixBlendMode: 'multiply'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                    {/* Property Details Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="border-l-4 border-white pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 text-xs font-medium tracking-wider">
                            {property.type}
                          </span>
                          {property.bedrooms > 0 && (
                            <span className="text-white/80 text-xs">
                              {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-white vogue-heading mb-1 leading-tight">
                          {property.title}
                        </h3>
                        <p className="text-white/90 font-light text-sm mb-2">
                          {property.location}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">{property.price}</p>
                          <Link
                            to={`/properties/${property.id}`}
                            className="inline-flex items-center gap-1 text-white/80 hover:text-white text-xs font-medium tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all duration-300"
                          >
                            View
                            <ChevronRightIcon className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Corner */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-2 border-black/20 rotate-45 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <div className="text-black/60 font-light">Loading featured properties...</div>
            </div>
          )}

          {/* Services Section - Redesigned */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            {[
              {
                letter: 'B',
                title: 'BUY',
                description: 'Discover your perfect Nairobi home in prime locations.',
                link: '/properties',
                linkText: 'Browse Properties'
              },
              {
                letter: 'S',
                title: 'SELL',
                description: 'Showcase your property to discerning buyers.',
                link: '/contact',
                linkText: 'Sell With Us'
              },
              {
                letter: 'R',
                title: 'RENT',
                description: 'Flexible living solutions in premium areas.',
                link: '/contact',
                linkText: 'Find Rentals'
              }
            ].map((service, index) => (
              <motion.div
                key={service.title}
                className="group text-center relative overflow-hidden bg-white/5 backdrop-blur-sm hover:bg-white/10 p-8 transition-all duration-700"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -5 }}
                style={{
                  clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)'
                }}
              >
                <div className="mb-6">
                  <div className="w-20 h-20 bg-black mx-auto mb-6 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500">
                    <div className="text-white text-2xl font-bold vogue-heading">{service.letter}</div>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-black mb-4 vogue-heading tracking-wider">{service.title}</h3>
                  <p className="text-black/80 leading-relaxed font-light mb-6">
                    {service.description}
                  </p>
                </div>
                <Link
                  to={service.link}
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-semibold hover:bg-black/90 transition-all duration-300 uppercase tracking-widest group-hover:gap-3"
                >
                  {service.linkText}
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>

                {/* Decorative Element */}
                <div className="absolute top-4 right-4 w-8 h-8 border border-black/10 rotate-45 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Background Art Elements */}
        <div className="absolute top-32 left-8 w-1 h-24 bg-black/10"></div>
        <div className="absolute bottom-32 right-8 w-24 h-1 bg-black/10"></div>
      </section>

      {/* Neighborhoods Section - Creative Visual Design */}
      <section className="py-32 relative overflow-hidden" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2
              className="text-6xl md:text-8xl lg:text-9xl font-bold text-black mb-8 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              PREMIUM
              <br />
              <span className="italic font-light">Locations</span>
            </motion.h2>
            <motion.div
              className="w-32 h-1 bg-black mx-auto mb-8"
              initial={{ width: 0 }}
              whileInView={{ width: 128 }}
              transition={{ duration: 1, delay: 0.5 }}
            ></motion.div>
            <motion.p
              className="text-xl text-black max-w-3xl mx-auto leading-relaxed font-light"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Each neighborhood curated for the discerning. Where prestige meets possibility.
            </motion.p>
          </div>

          {/* Interactive Location Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {locationProperties.length > 0 ? locationProperties.map((location, index) => {
              const accentStyles = [
                'top-left', 'center', 'top-right',
                'bottom-left', 'center-bottom', 'bottom-right'
              ];
              const accent = accentStyles[index % accentStyles.length];

              return (
              <motion.div
                key={location.name}
                className="group relative overflow-hidden bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-700 cursor-pointer"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                style={{
                  clipPath: location.accent === 'top-left' ? 'polygon(0 0, 85% 0, 100% 100%, 0 100%)' :
                           location.accent === 'top-right' ? 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' :
                           location.accent === 'center' ? 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' :
                           'polygon(0 0, 100% 0, 90% 100%, 10% 100%)'
                }}
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    style={{
                      filter: 'sepia(15%) saturate(85%) contrast(105%)',
                      mixBlendMode: 'multiply'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60"></div>

                  {/* Property Count Badge */}
                  <div className="absolute top-6 right-6">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-2 text-xs font-medium tracking-wider">
                      {location.properties} PROPERTIES
                    </div>
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="border-l-4 border-white pl-4">
                      <h3 className="text-2xl font-bold text-white vogue-heading mb-2 tracking-wide">
                        {location.name}
                      </h3>
                      <p className="text-white/90 font-light text-sm mb-4 leading-relaxed">
                        {location.description}
                      </p>
                      <Link
                        to={`/properties?area=${location.name.toLowerCase()}`}
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        Explore Area
                        <ChevronRightIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Decorative Corner Element */}
                <div className="absolute -top-2 -right-2 w-8 h-8 border-2 border-black/20 rotate-45 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </motion.div>
              );
            }) : (
              // Fallback while loading
              [1, 2, 3, 4, 5, 6].map((index) => (
                <motion.div
                  key={index}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-sm transition-all duration-700"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  style={{
                    clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)'
                  }}
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <div
                      className="w-full h-full bg-gradient-to-br from-gray-200/50 to-gray-300/50 transition-all duration-700"
                      style={{
                        filter: 'sepia(15%) saturate(85%) contrast(105%)',
                        mixBlendMode: 'multiply'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60"></div>

                    {/* Loading Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="border-l-4 border-white/50 pl-4">
                        <h3 className="text-2xl font-bold text-white/70 vogue-heading mb-2 tracking-wide">
                          Loading...
                        </h3>
                        <p className="text-white/60 font-light text-sm mb-4 leading-relaxed">
                          Discovering premium locations
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Call to Action */}
          <motion.div
            className="text-center mt-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Link
              to="/properties"
              className="group inline-flex items-center gap-4 border-2 border-black text-black px-12 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-500"
            >
              <MapPinIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              View All Locations
              <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-20 left-10 w-2 h-32 bg-black/5"></div>
        <div className="absolute bottom-20 right-10 w-32 h-2 bg-black/5"></div>
      </section>

      {/* Off-Plan Properties Section */}
      <section className="py-32 relative overflow-hidden" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-20">
            <motion.div
              className="inline-flex items-center gap-4 mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-16 h-px bg-black/30"></div>
              <span className="text-sm font-light tracking-[0.4em] text-black/70 uppercase">Coming Soon</span>
              <div className="w-16 h-px bg-black/30"></div>
            </motion.div>

            <motion.h2
              className="text-6xl md:text-8xl lg:text-9xl font-bold text-black mb-8 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              OFF-PLAN
              <br />
              <span className="italic font-light text-5xl md:text-7xl lg:text-8xl">Developments</span>
            </motion.h2>

            <motion.p
              className="text-xl text-black max-w-4xl mx-auto leading-relaxed font-light mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Secure your future home today. Exclusive pre-construction opportunities with flexible payment plans and early-bird pricing.
            </motion.p>
          </div>

          {/* Off-Plan Properties Grid */}
          {offPlanProps.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              {offPlanProps.slice(0, 4).map((property, index) => (
                <motion.div
                  key={property.id}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-700"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  whileHover={{ y: -15 }}
                  style={{
                    clipPath: index % 2 === 0 ? 'polygon(0 0, 85% 0, 100% 100%, 15% 100%)' : 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)'
                  }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden">
                      <img
                        src={property.image}
                        alt={property.projectName}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        style={{
                          filter: 'sepia(10%) saturate(90%) contrast(105%)',
                          mixBlendMode: 'multiply'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                      {/* Construction Progress */}
                      <div className="absolute top-6 left-6">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium tracking-wider">
                              {property.constructionProgress}% COMPLETE
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute top-6 right-6">
                        <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium tracking-wider">
                          OFF-PLAN
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 lg:p-10 flex flex-col justify-center">
                      <div className="border-l-4 border-black/20 pl-6">
                        <div className="mb-4">
                          <span className="text-xs font-light tracking-widest text-black/60 uppercase block mb-2">
                            {property.developer}
                          </span>
                          <h3 className="text-2xl lg:text-3xl font-bold text-black vogue-heading mb-2 leading-tight">
                            {property.projectName}
                          </h3>
                          <p className="text-black/70 font-light mb-4">{property.location}</p>
                        </div>

                        <div className="mb-6">
                          <div className="text-2xl font-bold text-black mb-2">{property.price}</div>
                          <div className="text-sm text-black/60 font-light">
                            {property.bedrooms > 0 && `${property.bedrooms} bedrooms • `}
                            {property.area !== 'N/A' && property.area}
                          </div>
                        </div>

                        {/* Completion Date */}
                        {property.completionDate && (
                          <div className="mb-6">
                            <div className="text-xs font-light tracking-widest text-black/60 uppercase mb-1">
                              Expected Completion
                            </div>
                            <div className="text-sm font-medium text-black">
                              {new Date(property.completionDate).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        )}

                        <Link
                          to={`/properties/${property.id}`}
                          className="inline-flex items-center gap-3 bg-black text-white px-8 py-3 text-xs font-semibold hover:bg-black/90 transition-all duration-300 uppercase tracking-widest group-hover:gap-4"
                        >
                          <BuildingOfficeIcon className="w-4 h-4" />
                          View Project Details
                          <ChevronRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Corner Elements */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-2 border-black/10 rotate-45 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border border-black/20 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200"></div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-20 border-2 border-dashed border-black/20 rounded-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <BuildingOfficeIcon className="w-16 h-16 text-black/30 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-black/70 mb-4 vogue-heading">Exciting Projects Coming Soon</h3>
              <p className="text-black/60 font-light max-w-lg mx-auto leading-relaxed">
                We're preparing exceptional off-plan developments in Nairobi's most sought-after locations.
                Be the first to know when they launch.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 text-xs font-semibold hover:bg-black/90 transition-all duration-300 uppercase tracking-widest mt-8"
              >
                <StarIcon className="w-4 h-4" />
                Get Notified
              </Link>
            </motion.div>
          )}

          {/* Call to Action */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-black vogue-heading mb-2">Early Bird</div>
                <div className="text-black/70 font-light">Special pricing for first buyers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black vogue-heading mb-2">Flexible</div>
                <div className="text-black/70 font-light">Customizable payment plans</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black vogue-heading mb-2">Secure</div>
                <div className="text-black/70 font-light">Trusted developers & guarantees</div>
              </div>
            </div>

            <Link
              to="/properties?isOffPlan=true"
              className="inline-flex items-center gap-4 border-2 border-black text-black px-12 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-500"
            >
              <BuildingOfficeIcon className="w-5 h-5" />
              Explore All Off-Plan Projects
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Background Art */}
        <div className="absolute top-40 right-20 w-32 h-32 border-4 border-black/5 rotate-12"></div>
        <div className="absolute bottom-40 left-20 w-2 h-40 bg-black/5 rotate-45"></div>
      </section>

      {/* Final CTA Section - Dramatic & Artistic */}
      <section className="relative py-40 overflow-hidden" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        {/* Abstract Background Art */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border-8 border-black/5 transform -rotate-12"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border-4 border-black/10 rounded-full"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-48 bg-black/10 transform rotate-45"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - Artistic Text Layout */}
            <div className="text-left">
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.5 }}
              >
                <div className="border-l-8 border-black pl-8">
                  <span className="text-sm font-light tracking-[0.4em] text-black/60 uppercase block mb-4">
                    Your Next Chapter
                  </span>
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black vogue-heading leading-[0.9] mb-6">
                    BEGINS
                    <br />
                    <span className="italic font-light text-4xl md:text-5xl lg:text-6xl">with us</span>
                  </h2>
                </div>
              </motion.div>

              <motion.p
                className="text-lg md:text-xl text-black/80 leading-relaxed font-light mb-12 max-w-lg"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                Every property tells a story. Every neighborhood holds possibilities.
                Let us curate the perfect setting for your Kenya chapter.
              </motion.p>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-4 bg-black text-white px-12 py-5 text-sm font-semibold uppercase tracking-widest hover:bg-black/90 transition-all duration-500"
                >
                  <BuildingOfficeIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Begin Your Journey
                  <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
                <div className="flex items-center gap-8 text-sm text-black/60 font-light">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4" />
                    <span>Exclusive Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4" />
                    <span>Expert Guidance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4" />
                    <span>Premium Service</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right - Artistic Visual Element */}
            <div className="relative">
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
              >
                {/* Large Circular Element */}
                <div className="w-80 h-80 mx-auto relative">
                  <div className="absolute inset-0 border-4 border-black/20 rounded-full animate-spin-slow"></div>
                  <div className="absolute inset-8 border-2 border-black/10 rounded-full"></div>
                  <div className="absolute inset-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-black vogue-heading mb-2">250+</div>
                      <div className="text-sm font-light tracking-widest uppercase text-black/70">Properties</div>
                      <div className="w-16 h-px bg-black/30 mx-auto my-3"></div>
                      <div className="text-2xl font-bold text-black vogue-heading mb-1">15+</div>
                      <div className="text-xs font-light tracking-widest uppercase text-black/70">Locations</div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  className="absolute -top-6 -left-6 w-16 h-16 bg-black/10 rotate-45"
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity }}
                ></motion.div>
                <motion.div
                  className="absolute -bottom-4 -right-4 w-8 h-8 border-2 border-black/20 rounded-full"
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                ></motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Border Art */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-black/20 to-transparent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 2, delay: 1 }}
        ></motion.div>
      </section>

      <Footer />
    </div>
  )
}