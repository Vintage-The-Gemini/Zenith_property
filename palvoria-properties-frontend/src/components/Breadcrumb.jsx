import { Link } from 'react-router-dom'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid'

const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex py-4 px-6 bg-gray-50" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-4">
        <li>
          <Link to="/" className="text-gray-500 hover:text-gold-primary transition-colors">
            <HomeIcon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400 mx-2" aria-hidden="true" />
              {item.href ? (
                <Link
                  to={item.href}
                  className="text-sm font-medium text-gray-700 hover:text-gold-primary transition-colors"
                  aria-current={index === items.length - 1 ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ) : (
                <span 
                  className="text-sm font-medium text-gray-900"
                  aria-current="page"
                >
                  {item.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
      
      {/* Breadcrumb Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://palvoriaproperties.co.ke/"
            },
            ...items.map((item, index) => ({
              "@type": "ListItem",
              "position": index + 2,
              "name": item.name,
              "item": item.href ? `https://palvoriaproperties.co.ke${item.href}` : undefined
            }))
          ]
        })}
      </script>
    </nav>
  )
}

export default Breadcrumb