import { useEffect, useState } from 'react'
import AdminAuth from './AdminAuth'
import { getAuthToken, verifyToken } from '../../utils/auth'

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Check if admin is authenticated using new auth utilities
      const token = getAuthToken()
      if (token) {
        // Verify token is still valid
        const isValid = await verifyToken()
        setIsAuthenticated(isValid)
      } else {
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminAuth onAuthSuccess={handleAuthSuccess} />
  }

  return children
}

export default ProtectedRoute