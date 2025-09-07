import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Header from '../components/Header'
import Footer from '../components/Footer'

const contactInfo = [
  {
    name: 'Phone',
    value: '+1 (555) 123-4567',
    icon: PhoneIcon,
    href: 'tel:+15551234567'
  },
  {
    name: 'Email',
    value: 'hello@palvoriaproperties.com',
    icon: EnvelopeIcon,
    href: 'mailto:hello@palvoriaproperties.com'
  },
  {
    name: 'Address',
    value: '123 Main Street, Suite 456\nCity, State 12345',
    icon: MapPinIcon,
    href: 'https://maps.google.com'
  },
  {
    name: 'Hours',
    value: 'Mon-Fri: 9AM-6PM\nSat: 10AM-4PM\nSun: By appointment',
    icon: ClockIcon,
    href: null
  }
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: 'general',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitted(true)
    setIsSubmitting(false)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: 'general',
        message: ''
      })
    }, 3000)
  }

  return (
    <div className="bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary-600 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Get In Touch
            </h1>
            <p className="mt-4 text-xl text-primary-100">
              Ready to find your perfect property? We're here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((info) => (
                    <div key={info.name} className="flex items-start">
                      <div className="flex-none">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                          <info.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <dt className="text-sm font-medium text-gray-900">{info.name}</dt>
                        <dd className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                          {info.href ? (
                            <a 
                              href={info.href} 
                              className="hover:text-primary-600 transition-colors"
                            >
                              {info.value}
                            </a>
                          ) : (
                            info.value
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Contact Cards */}
                <div className="mt-12 space-y-4">
                  <div className="bg-primary-50 p-6 rounded-xl">
                    <div className="flex items-center mb-3">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Quick Response</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Need immediate assistance? Call us directly and speak with one of our property experts.
                    </p>
                  </div>
                  
                  <div className="bg-accent-50 p-6 rounded-xl">
                    <div className="flex items-center mb-3">
                      <CheckCircleIcon className="h-6 w-6 text-accent-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Free Consultation</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Schedule a free consultation to discuss your property needs with no obligation.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gray-50 p-8 rounded-2xl"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  Send Us a Message
                </h2>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-gray-600">
                      Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="buying">Buying a Property</option>
                        <option value="selling">Selling a Property</option>
                        <option value="renting">Renting</option>
                        <option value="commercial">Commercial Properties</option>
                        <option value="investment">Investment Opportunities</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        placeholder="Tell us about your property needs, budget, preferred locations, or any specific requirements..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary py-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Visit Our Office
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Stop by for a consultation or just to say hello
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-300 rounded-2xl h-96 flex items-center justify-center"
          >
            <div className="text-center">
              <MapPinIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Interactive Map Coming Soon</p>
              <p className="text-gray-500 text-sm mt-2">123 Main Street, Suite 456, City, State 12345</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}