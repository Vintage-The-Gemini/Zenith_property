import { Link } from 'react-router-dom'

const navigation = {
  main: [
    { name: 'Properties', href: '/properties' },
    { name: 'Contact', href: '/contact' },
  ],
}

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'rgb(0, 0, 0)', borderTop: '2px solid #D97706' }}>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Logo Section */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-amber-400">PALVORIA</h2>
            <p className="text-sm mt-2" style={{ color: 'rgb(252, 224, 177)' }}>
              Premium Properties in Nairobi
            </p>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <nav className="flex justify-center space-x-8">
              {navigation.main.map((item) => (
                <Link 
                  key={item.name}
                  to={item.href} 
                  className="text-sm font-medium transition-colors duration-300 hover:text-amber-400"
                  style={{ color: 'rgb(252, 224, 177)' }}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-right">
            <div className="space-y-1">
              <p className="text-sm" style={{ color: 'rgb(252, 224, 177)' }}>
                +254 757 880 789
              </p>
              <p className="text-sm" style={{ color: 'rgb(252, 224, 177)' }}>
                info@palvoriaproperties.co.ke
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgb(252, 224, 177)' }}>
                Kileleshwa, Nairobi
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t-2 border-amber-600 text-center">
          <p className="text-xs" style={{ color: 'rgb(252, 224, 177)' }}>
            &copy; 2024 Palvoria Properties. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}