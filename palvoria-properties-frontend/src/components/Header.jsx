import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import palvoriaLogo from '../assets/palvoria props logo.png'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Properties', href: '/properties' },
  // { name: 'Search', href: '/search' },
  // { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <header className="fixed top-3 left-3 right-3 md:top-6 md:left-6 md:right-6 z-50">
      <nav className="flex items-center justify-between px-4 md:px-6 lg:px-12 py-3 md:py-4 bg-white shadow-lg mx-auto max-w-6xl" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-3">
            <span className="sr-only">Palvoria Properties - Nairobi's Premier Real Estate</span>
            <img 
              src={palvoriaLogo} 
              alt="Palvoria Properties Logo" 
              className="h-6 md:h-8 lg:h-10 w-auto"
            />
            <div className="hidden sm:block">
              <div className="text-sm md:text-lg lg:text-xl font-bold text-black vogue-heading">
                PALVORIA
              </div>
              <div className="text-xs text-gray-600 -mt-1">
                Nairobi Properties
              </div>
            </div>
          </Link>
        </div>
        <div className="flex md:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center p-2.5 text-black hover:text-gray-600 transition-all duration-200"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden md:flex md:gap-x-6 lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-sm font-semibold leading-6 transition-all duration-200 px-3 py-2 ${
                isActive(item.href)
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex md:flex-1 md:justify-end">
          <Link 
            to="/contact" 
            className="bg-black px-4 lg:px-6 py-2 lg:py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-all duration-200"
          >
            Contact
          </Link>
        </div>
      </nav>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="fixed inset-0 z-50 bg-black/25"></div>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm border-l border-gray-200"
            >
              <div className="flex items-center justify-between">
                <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <span className="sr-only">Palvoria Properties - Nairobi's Premier Real Estate</span>
                  <img 
                    src={palvoriaLogo} 
                    alt="Palvoria Properties Logo" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <div className="text-lg font-bold text-black vogue-heading">
                      PALVORIA
                    </div>
                    <div className="text-xs text-gray-600 -mt-1">
                      Nairobi Properties
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`-mx-3 block px-3 py-2 text-base font-semibold leading-7 transition-colors duration-200 border-b border-gray-100 ${
                          isActive(item.href)
                            ? 'bg-black text-white'
                            : 'text-gray-900 hover:bg-gray-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <Link
                      to="/contact"
                      className="mt-4 block bg-black px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800 transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}