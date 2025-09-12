import { useState, useEffect } from 'react'
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
  CameraIcon,
  UsersIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Card from '../components/ui/Card'
import SEOHead from '../components/SEOHead'
import { usePropertyAnalytics } from '../hooks/useAnalytics'
import apiService from '../services/api'


export default function PropertyDetailPage() {
  const { id } = useParams()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Analytics tracking
  const propertyAnalytics = usePropertyAnalytics(property)

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!property?.images?.length || property.images.length <= 1) return
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property.images.length - 1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentImageIndex(prev => prev < property.images.length - 1 ? prev + 1 : 0)
      } else if (e.key === 'Escape' && showLightbox) {
        setShowLightbox(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [property?.images?.length, showLightbox])

  // Navigation functions
  const nextImage = () => {
    if (property?.images?.length > 1) {
      setCurrentImageIndex(prev => prev < property.images.length - 1 ? prev + 1 : 0)
    }
  }

  const prevImage = () => {
    if (property?.images?.length > 1) {
      setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property.images.length - 1)
    }
  }

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('📋 PropertyDetailPage: Fetching property with ID:', id)
        
        const response = await apiService.getProperty(id)
        console.log('📋 PropertyDetailPage: API Response:', response)
        
        if (response.success && response.data) {
          setProperty(response.data)
        } else {
          setError('Property not found')
        }
      } catch (err) {
        console.error('❌ PropertyDetailPage: Error fetching property:', err)
        setError('Failed to load property details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProperty()
    }
  }, [id])
  
  if (loading) {
    return (
      <div style={{ backgroundColor: 'rgb(252, 224, 177)', minHeight: '100vh' }}>
        <Header />
        <main className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto mb-4"></div>
            <h1 className="text-4xl font-bold text-black mb-8">Loading Property...</h1>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div style={{ backgroundColor: 'rgb(252, 224, 177)', minHeight: '100vh' }}>
        <Header />
        <main className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-black mb-8">
              {error || 'Property Not Found'}
            </h1>
            <p className="text-lg text-gray-800 mb-8">
              {error || "The property you're looking for doesn't exist."}
            </p>
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
      <SEOHead 
        property={property}
        seo={property?.seo}
        pageType="property"
      />
      <Header />
      
      {/* Hero Section with Image Gallery */}
      <div className="pt-28 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Image Gallery - Clean and Simple */}
          <div className="mb-8">
            {property.images && property.images.length > 0 ? (
                <>
                  {/* Main Image - Simple and Clean */}
                  <div className="relative max-w-3xl mx-auto mb-6">
                    <img
                      src={property.images[currentImageIndex]?.url || property.images[0]?.url}
                      alt={property.title}
                      className="w-full h-[375px] object-cover"
                      style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                    />
                    
                    {/* Image Counter - Simple */}
                    {property.images.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black text-amber-400 px-3 py-1 text-sm font-bold">
                        {currentImageIndex + 1} / {property.images.length}
                      </div>
                    )}

                    {/* Navigation Arrows - Only show if multiple images */}
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-amber-400 flex items-center justify-center hover:bg-amber-600 hover:text-black transition-colors"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-amber-400 flex items-center justify-center hover:bg-amber-600 hover:text-black transition-colors"
                        >
                          <ChevronLeftIcon className="h-5 w-5 rotate-180" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Simple Thumbnail Row */}
                  {property.images.length > 1 && (
                    <div className="max-w-3xl mx-auto">
                      <div className="flex gap-2 overflow-x-auto">
                        {property.images.map((image, index) => (
                          <button
                            key={index}
                            className={`flex-shrink-0 w-20 h-16 overflow-hidden cursor-pointer transition-all duration-200 ${
                              currentImageIndex === index 
                                ? 'ring-2 ring-amber-600 scale-105' 
                                : 'hover:scale-105'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            <img
                              src={image.url}
                              alt={`${property.title} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-[375px] max-w-3xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
                  <div className="text-center text-black">
                    <CameraIcon className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg font-bold">NO IMAGES AVAILABLE</p>
                  </div>
                </div>
              )}
            </div>

          {/* Property Header - Title, Price, Location */}
          <div className="text-center mt-8 mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-black mb-4">
              {property.title}
            </h1>
            <div className="text-4xl font-bold text-black mb-4">
              {property.price?.currency} {property.price?.amount?.toLocaleString()}
            </div>
            <div className="flex items-center justify-center text-gray-600 mb-6">
              <MapPinIcon className="h-6 w-6 mr-2" />
              <span className="text-xl">{property.location?.address}, {property.location?.city}</span>
            </div>
            {/* Quick Stats Row */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-black">{property.features?.bedrooms || 0}</div>
                <div className="text-sm text-black opacity-75">Bedrooms</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black">{property.features?.bathrooms || 0}</div>
                <div className="text-sm text-black opacity-75">Bathrooms</div>
              </div>
              {property.features?.area?.size && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-black">{property.features.area.size}</div>
                  <div className="text-sm text-black opacity-75">{property.features.area.unit}</div>
                </div>
              )}
            </div>
          </div>

          {/* Property Details Section */}
          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Main Content - Takes more space */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Description */}
              {property.description && (
                <Card className="p-6 rounded-2xl" style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <h3 className="text-xl font-bold text-black mb-4">About This Property</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {property.description}
                  </p>
                </Card>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <Card className="p-6 rounded-2xl" style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <h3 className="text-xl font-bold text-black mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-black">
                          {amenity.name || amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Property Details */}
              <Card className="p-6 rounded-2xl sticky top-24" style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)' }}>
                <h3 className="text-lg font-bold text-black mb-4">Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">Type</span>
                    <span className="font-semibold text-black text-sm">
                      {property.type?.charAt(0).toUpperCase() + property.type?.slice(1) || "Residential"}
                    </span>
                  </div>
                  {property.yearBuilt && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Year</span>
                      <span className="font-semibold text-black text-sm">{property.yearBuilt}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm">Status</span>
                    <span className="font-semibold text-green-600 text-sm">Available</span>
                  </div>
                </div>
                
                {/* Action Buttons - Moved Here */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex gap-3 justify-center">
                    <button 
                      className="p-3 border border-black rounded-xl hover:bg-black hover:text-white transition-colors duration-200"
                      onClick={() => {
                        const newLikedState = !isLiked;
                        setIsLiked(newLikedState);
                        propertyAnalytics.trackFavorite(newLikedState ? 'add' : 'remove');
                      }}
                      title="Add to wishlist"
                    >
                      {isLiked ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button 
                      className="p-3 border border-black rounded-xl hover:bg-black hover:text-white transition-colors duration-200"
                      onClick={async () => {
                        if (navigator.share) {
                          try {
                            propertyAnalytics.trackShare('native');
                            await navigator.share({
                              title: property.title,
                              text: `Check out this property: ${property.title} - ${property.price?.currency} ${property.price?.amount?.toLocaleString()}`,
                              url: window.location.href,
                            });
                          } catch (err) {
                            console.log('Error sharing:', err);
                          }
                        } else {
                          // Fallback for browsers that don't support Web Share API
                          propertyAnalytics.trackShare('clipboard');
                          navigator.clipboard.writeText(window.location.href);
                          alert('Property link copied to clipboard!');
                        }
                      }}
                      title="Share property"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Contact Agent Section */}
          <div className="mt-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="bg-white bg-opacity-60 rounded-2xl p-8 border border-black border-opacity-10">
                <h3 className="text-2xl font-bold text-black mb-4">Interested in this property?</h3>
                <p className="text-gray-700 mb-6">Get in touch with our team for more information, schedule a viewing, or discuss financing options.</p>
                <button 
                  className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-colors duration-200 font-semibold flex items-center justify-center gap-3 mx-auto text-lg"
                  onClick={() => {
                    propertyAnalytics.trackInquiry('whatsapp');
                    propertyAnalytics.trackContact('whatsapp');
                    const message = `Hello! I'm interested in this property: ${property.title} - ${property.price?.currency} ${property.price?.amount?.toLocaleString()}. Can you provide more information?`;
                    const whatsappUrl = `https://wa.me/254757880789?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Chat on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Lightbox Modal */}
      {showLightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-8"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative flex items-center justify-center w-full h-full">
            <div className="relative w-auto h-auto min-w-[400px] min-h-[300px] max-w-[90vw] max-h-[90vh] flex items-center justify-center">
              <img
                src={property.images?.[currentImageIndex]?.url}
                alt={property.title}
                className="max-w-full max-h-full w-auto h-auto rounded-2xl shadow-2xl"
                style={{ 
                  minWidth: '400px',
                  minHeight: '300px',
                  objectFit: 'contain'
                }}
              />
            </div>
            
            
            {/* Close Button - Fixed to viewport */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLightbox(false);
              }}
              className="fixed top-8 right-8 w-12 h-12 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 text-xl font-bold z-10"
              title="Close (ESC key)"
            >
              ×
            </button>
            
            {/* Image Counter - Fixed to viewport */}
            <div className="fixed top-8 left-8 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium z-10">
              {(currentImageIndex + 1)} of {property.images?.length || 0}
            </div>
            
            {/* Enhanced Navigation Arrows - Fixed to viewport */}
            {property.images && property.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="fixed left-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all duration-200 group/arrow z-10"
                  title="Previous image (← key)"
                >
                  <ChevronLeftIcon className="h-8 w-8 group-hover/arrow:scale-110 transition-transform" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="fixed right-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all duration-200 group/arrow z-10"
                  title="Next image (→ key)"
                >
                  <ChevronLeftIcon className="h-8 w-8 rotate-180 group-hover/arrow:scale-110 transition-transform" />
                </button>
              </>
            )}

            {/* Thumbnail Strip - Fixed to viewport */}
            {property.images && property.images.length > 1 && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 max-w-2xl overflow-x-auto py-3 px-6 bg-black/40 backdrop-blur-sm rounded-2xl z-10">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                      currentImageIndex === index 
                        ? 'ring-2 ring-white opacity-100 scale-110' 
                        : 'opacity-60 hover:opacity-80 hover:scale-105'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      <Footer />
    </div>
  )
}