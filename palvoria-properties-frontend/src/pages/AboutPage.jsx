import { motion } from 'framer-motion'
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  TrophyIcon,
  HeartIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import Header from '../components/Header'
import Footer from '../components/Footer'

const stats = [
  { id: 1, name: 'Properties Sold', value: '2,500+', icon: BuildingOfficeIcon },
  { id: 2, name: 'Happy Families', value: '1,200+', icon: UserGroupIcon },
  { id: 3, name: 'Years Experience', value: '15+', icon: TrophyIcon },
  { id: 4, name: 'Client Satisfaction', value: '98%', icon: HeartIcon },
]

const values = [
  {
    name: 'Trust & Integrity',
    description: 'We believe in transparent dealings and honest communication with every client.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Excellence',
    description: 'We strive for perfection in every service we provide, from property search to closing.',
    icon: TrophyIcon,
  },
  {
    name: 'Client First',
    description: 'Your dreams and requirements are our priority. We tailor our services to your needs.',
    icon: HeartIcon,
  },
  {
    name: 'Market Expertise',
    description: 'Deep knowledge of local markets helps us provide the best advice and opportunities.',
    icon: ChartBarIcon,
  },
]

const team = [
  {
    name: 'Sarah Johnson',
    role: 'Founder & CEO',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b9c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    bio: '15+ years in real estate, specializing in luxury properties and commercial investments.'
  },
  {
    name: 'Michael Chen',
    role: 'Senior Property Consultant',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    bio: 'Expert in residential properties with a track record of helping over 500 families find homes.'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Commercial Real Estate Specialist',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    bio: 'Focused on commercial properties and investment opportunities for growing businesses.'
  },
]

export default function AboutPage() {
  return (
    <div className="bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 py-24">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              About Palvoria Properties
            </h1>
            <p className="mt-6 text-xl leading-8 text-primary-100 max-w-3xl mx-auto">
              For over 15 years, we've been helping families and businesses find their perfect properties. 
              Our commitment to excellence and client satisfaction sets us apart.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Our Story
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Built on trust, driven by excellence
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-lg mx-auto text-gray-600"
            >
              <p>
                Founded in 2008 by Sarah Johnson, Palvoria Properties began as a small boutique real estate agency 
                with a simple mission: to provide exceptional service and expert guidance to every client. What started 
                as a one-person operation has grown into a trusted team of dedicated professionals.
              </p>
              <p>
                Over the years, we've helped over 1,200 families find their dream homes and assisted countless businesses 
                in securing the perfect commercial spaces. Our success is built on three pillars: deep market knowledge, 
                personalized service, and unwavering integrity.
              </p>
              <p>
                Today, Palvoria Properties is recognized as one of the leading real estate agencies in the region, 
                with a 98% client satisfaction rate and numerous industry awards. But our greatest achievement is 
                the trust our clients place in us and the relationships we've built along the way.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Impact
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Numbers that reflect our commitment to excellence
            </p>
          </motion.div>

          <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-lg"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-600 mb-4">
                  <stat.icon className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <dt className="text-base font-medium text-gray-600">{stat.name}</dt>
                <dd className="text-4xl font-bold tracking-tight text-primary-600">{stat.value}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Values
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {values.map((value, index) => (
              <motion.div
                key={value.name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex gap-6 p-6 bg-gray-50 rounded-xl"
              >
                <div className="flex-none">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600">
                    <value.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold leading-7 text-gray-900 mb-2">
                    {value.name}
                  </h3>
                  <p className="text-base leading-7 text-gray-600">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Meet Our Team
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Experienced professionals dedicated to your success
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {team.map((person, index) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <img
                  className="h-64 w-full object-cover"
                  src={person.image}
                  alt={person.name}
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{person.name}</h3>
                  <p className="text-primary-600 font-medium mb-3">{person.role}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{person.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600">
        <div className="px-6 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to work with us?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Experience the difference of working with a team that puts your needs first. 
              Let's find your perfect property together.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/contact"
                className="btn-primary bg-white text-primary-600 hover:bg-gray-100"
              >
                Contact Us Today
              </a>
              <a
                href="/properties"
                className="font-semibold leading-6 text-white hover:text-primary-100"
              >
                Browse Properties <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}