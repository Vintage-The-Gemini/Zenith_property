import { useState } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const AdminAuth = ({ onAuthSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.username,
          password: credentials.password
        })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('palvoria_admin_token', data.token)
        localStorage.setItem('palvoria_admin_user', JSON.stringify(data.user))
        toast.success(`Welcome back, ${data.user.name}!`)
        if (onAuthSuccess) {
          onAuthSuccess()
        }
      } else {
        toast.error(data.message || 'Authentication failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto w-16 h-16 border-4 border-black flex items-center justify-center mb-6"
            style={{ backgroundColor: 'rgb(252, 224, 177)' }}
          >
            <LockClosedIcon className="w-8 h-8 text-black" />
          </motion.div>
          <h1 className="text-4xl font-bold text-black mb-2">PALVORIA</h1>
          <p className="text-lg text-black" style={{ fontWeight: '300' }}>
            Administrator Access Panel
          </p>
        </div>

        {/* Auth Form */}
        <div className="border-4 border-black p-8" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border-2 border-black focus:ring-4 focus:ring-amber-500 focus:border-amber-600 text-black font-medium transition-all"
                style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter admin email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 pr-12 border-2 border-black focus:ring-4 focus:ring-amber-500 focus:border-amber-600 text-black font-medium transition-all"
                  style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-amber-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-6 bg-black text-amber-400 font-bold uppercase tracking-widest border-2 border-black hover:bg-amber-600 hover:text-black transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                'Access Admin Panel'
              )}
            </motion.button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-black" style={{ fontWeight: '300' }}>
            Secure access to property management system
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminAuth