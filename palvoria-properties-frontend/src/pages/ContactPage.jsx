import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Header from '../components/Header'
import Footer from '../components/Footer'
import apiService from '../services/api'

const contactInfo = [
  {
    name: 'Phone',
    value: '+254 757 880 789',
    icon: PhoneIcon,
    href: 'tel:+254757880789'
  },
  {
    name: 'Email',
    value: 'hello@palvoriaproperties.co.ke',
    icon: EnvelopeIcon,
    href: 'mailto:hello@palvoriaproperties.co.ke'
  },
  {
    name: 'Address',
    value: 'Kileleshwa\nNairobi, Kenya\n00100',
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
  const [submitError, setSubmitError] = useState(null)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await apiService.submitContact(formData)

      if (response.success) {
        setIsSubmitted(true)
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
      } else {
        throw new Error(response.message || 'Failed to submit contact form')
      }
    } catch (error) {
      console.error('Contact form submission error:', error)
      setSubmitError(error.message || 'Failed to submit contact form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ backgroundColor: 'rgb(252, 224, 177)', minHeight: '100vh' }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-16 lg:pt-20 pb-32 overflow-hidden min-h-screen" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        {/* Parallax Background */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-10 parallax"
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80"
            alt="Nairobi cityscape"
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
              LET'S
            </motion.h1>
            <motion.h2 
              className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-black mb-16 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            >
              CONNECT
            </motion.h2>
            
            <motion.div
              className="max-w-4xl mx-auto mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className="text-lg md:text-xl lg:text-2xl text-black leading-relaxed" style={{ fontWeight: '300' }}>
                Whether you're seeking that perfect Kilimani residence or envisioning a Karen estate — we're here to curate your extraordinary Nairobi property journey.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            {/* Contact Information */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-black p-8 lg:p-12 text-white h-full"
              >
                <h2 className="text-3xl font-bold mb-8">
                  Your Nairobi Property <span className="text-amber-400">Squad! 👥</span>
                </h2>
                <p className="text-stone-300 mb-12 text-lg leading-relaxed">
                  From Westlands to Kileleshwa, we know Nairobi like the back of our hand! Ready to find your perfect spot in the city under the sun? Hit us up - we don't bite, we promise! 😄
                </p>
                
                <div className="space-y-8">
                  {contactInfo.map((info) => (
                    <div key={info.name} className="flex items-start group">
                      <div className="flex-none">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 group-hover:bg-amber-400 transition-colors duration-300">
                          <info.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="ml-5">
                        <dt className="text-sm font-semibold text-amber-400 uppercase tracking-wide">{info.name}</dt>
                        <dd className="mt-2 text-base whitespace-pre-line text-stone-300">
                          {info.href ? (
                            <a 
                              href={info.href} 
                              className="hover:text-amber-400 transition-colors duration-300"
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

                {/* Social proof */}
                <div className="mt-12 pt-8 border-t border-stone-700">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-amber-400">500+</div>
                      <div className="text-sm text-stone-400">Nairobi Families</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-400">25+</div>
                      <div className="text-sm text-stone-400">Neighborhoods</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white p-8 lg:p-12"
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-stone-900 mb-4">
                    Spill the Tea! ☕
                  </h2>
                  <p className="text-stone-600 text-lg">
                    Tell us what's on your mind - whether it's that dream Karen villa or a trendy Westlands apartment. We'll get back to you faster than Nairobi traffic! 😂
                  </p>
                </div>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircleIcon className="h-10 w-10 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-4 text-stone-900">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-stone-600 text-lg">
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
                      >
                        <div className="flex items-center">
                          <div className="text-red-600 text-sm">{submitError}</div>
                        </div>
                      </motion.div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold mb-3 text-stone-700">
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-4 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-stone-50 text-stone-900"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-semibold mb-3 text-stone-700">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-4 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-stone-50 text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold mb-3 text-stone-700">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-4 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-stone-50 text-stone-900"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold mb-3 text-stone-700">
                          Phone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-stone-50 text-stone-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold mb-3 text-stone-700">
                        What can we help you with? *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-stone-50 text-stone-900"
                      >
                        <option value="general">Just Saying Jambo! 👋</option>
                        <option value="buying">I Want to Buy in Nairobi</option>
                        <option value="selling">Time to Sell My Place</option>
                        <option value="renting">Looking for a Rental</option>
                        <option value="commercial">Business Property Hunt</option>
                        <option value="investment">Investment Gold Mine</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold mb-3 text-stone-700">
                        Tell us more about your requirements *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        placeholder="Spill it all! Dream neighborhood (Karen? Westlands? Kilimani?), budget, must-haves, deal-breakers - we're all ears! 👂✨"
                        className="w-full px-4 py-4 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-stone-50 text-stone-900 resize-none"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black text-white py-4 px-8 text-lg font-semibold hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Sending...
                          </span>
                        ) : (
                          'Send Message'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}