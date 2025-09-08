import { Link } from 'react-router-dom'
import palvoriaLogo from '../assets/palvoria props logo.png'

const navigation = {
  main: [
    // { name: 'About', href: '/about' },
    { name: 'Properties', href: '/properties' },
    // { name: 'Search', href: '/search' },
    { name: 'Contact', href: '/contact' },
  ],
  services: [
    { name: 'Property Management', href: '#' },
    { name: 'Real Estate Investment', href: '#' },
    { name: 'Property Valuation', href: '#' },
    { name: 'Rental Services', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
  ],
  social: [
    {
      name: 'Facebook',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12.017 0C8.396 0 8.002.01 6.78.048 2.725.16 1.124 1.759 1.012 5.814.973 7.036.964 7.431.964 11.062c0 3.631.009 4.025.048 5.246.112 4.054 1.714 5.653 5.766 5.766 1.222.039 1.617.047 5.248.047 3.631 0 4.025-.008 5.247-.047 4.054-.113 5.653-1.713 5.766-5.766.039-1.221.047-1.615.047-5.246 0-3.631-.008-4.025-.047-5.246C21.976 1.759 20.378.16 16.323.048 15.102.01 14.707 0 11.077 0h.94zm-.056 5.503a6.565 6.565 0 110 13.13 6.565 6.565 0 010-13.13zm5.53-1.471a1.5 1.5 0 11-3.001.001 1.5 1.5 0 013.001-.001z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'Twitter',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t" style={{ backgroundColor: 'var(--black-secondary)', borderColor: 'rgba(255, 215, 0, 0.2)' }} aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <img
              className="h-12 w-auto"
              src={palvoriaLogo}
              alt="Palvoria Properties"
            />
            <p className="text-sm leading-6 playful-text">
              We're not just another property company. We're the ones who actually care about finding you the perfect home in Nairobi.
            </p>
            <div className="flex space-x-6">
              {navigation.social.map((item) => (
                <a 
                  key={item.name} 
                  href={item.href} 
                  className="transition-colors duration-300 hover:scale-110" 
                  style={{ color: 'var(--gray-muted)' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--gold-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--gray-muted)'}
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 gold-text">Navigation</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.main.map((item) => (
                    <li key={item.name}>
                      <Link 
                        to={item.href} 
                        className="text-sm leading-6 transition-colors duration-300" 
                        style={{ color: 'var(--white-secondary)' }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--gold-primary)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--white-secondary)'}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 gold-text">Services</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.services.map((item) => (
                    <li key={item.name}>
                      <a 
                        href={item.href} 
                        className="text-sm leading-6 transition-colors duration-300" 
                        style={{ color: 'var(--white-secondary)' }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--gold-primary)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--white-secondary)'}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 gold-text">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <a 
                        href={item.href} 
                        className="text-sm leading-6 transition-colors duration-300" 
                        style={{ color: 'var(--white-secondary)' }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--gold-primary)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--white-secondary)'}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 gold-text">Contact Info</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <p className="text-sm leading-6" style={{ color: 'var(--white-secondary)' }}>
                      Westlands Business District<br />
                      Nairobi, Kenya<br />
                      00100
                    </p>
                  </li>
                  <li>
                    <p className="text-sm leading-6" style={{ color: 'var(--white-secondary)' }}>
                      Phone: +254 700 123 456<br />
                      Email: info@palvoriaproperties.co.ke
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t pt-8 sm:mt-20 lg:mt-24" style={{ borderColor: 'rgba(255, 215, 0, 0.2)' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <p className="text-xs leading-5" style={{ color: 'var(--gray-muted)' }}>
              &copy; 2024 Palvoria Properties. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-xs leading-5" style={{ color: 'var(--gray-muted)' }}>
                Built with care for Nairobi dreamers ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}