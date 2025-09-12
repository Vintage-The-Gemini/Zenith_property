import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import HomePage from './pages/HomePage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
// import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
// import SearchPage from './pages/SearchPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminAuth from './components/admin/AdminAuth'
import ProtectedRoute from './components/admin/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--black-primary)', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.03) 0%, transparent 50%)' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            {/* <Route path="/search" element={<SearchPage />} /> */}
            {/* <Route path="/about" element={<AboutPage />} /> */}
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/palvadp" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
