import { useState, useEffect } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline'

const nairobiNeighborhoods = [
  'Westlands', 'Karen', 'Kileleshwa', 'Lavington', 'Kilimani', 'Upperhill', 
  'Runda', 'Muthaiga', 'CBD', 'Parklands', 'Hurlingham', 'South C', 'South B', 
  'Garden Estate', 'Kasarani', 'Loresho', 'Spring Valley', 'Gigiri', 'Ridgeways',
  'Riverside', 'Woodley', 'Nairobi West', 'Donholm', 'Pipeline', 'Embakasi',
  'Kahawa', 'Thome', 'Zimmerman', 'Roysambu', 'Mwiki'
]

export default function EnhancedLocationFilter({ 
  selectedArea, 
  onAreaChange, 
  customArea, 
  onCustomAreaChange 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState(nairobiNeighborhoods)

  useEffect(() => {
    if (searchTerm) {
      setFilteredNeighborhoods(
        nairobiNeighborhoods.filter(area => 
          area.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredNeighborhoods(nairobiNeighborhoods)
    }
  }, [searchTerm])

  const handleAreaSelect = (area) => {
    onAreaChange(area)
    setIsOpen(false)
    setSearchTerm('')
    if (area !== 'Custom Area') {
      setShowCustomInput(false)
      onCustomAreaChange('')
    } else {
      setShowCustomInput(true)
    }
  }

  const handleCustomAreaSubmit = (e) => {
    e.preventDefault()
    if (customArea.trim()) {
      onAreaChange(customArea.trim())
      setShowCustomInput(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        Location / Area
      </h3>
      
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
      >
        <div className="flex items-center">
          <MapPinIcon className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">
            {selectedArea === 'All' ? 'All Locations' : selectedArea}
          </span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search neighborhoods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {/* All Locations Option */}
            <button
              onClick={() => handleAreaSelect('All')}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center ${
                selectedArea === 'All' ? 'bg-gray-100 font-semibold' : ''
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-gray-400 mr-3"></div>
              All Locations
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Popular Nairobi Neighborhoods */}
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Popular Areas
            </div>
            
            {filteredNeighborhoods.slice(0, 10).map(area => (
              <button
                key={area}
                onClick={() => handleAreaSelect(area)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center ${
                  selectedArea === area ? 'bg-gray-100 font-semibold' : ''
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 mr-3"></div>
                {area}
              </button>
            ))}

            {filteredNeighborhoods.length > 10 && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  More Areas
                </div>
                {filteredNeighborhoods.slice(10).map(area => (
                  <button
                    key={area}
                    onClick={() => handleAreaSelect(area)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center ${
                      selectedArea === area ? 'bg-gray-100 font-semibold' : ''
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-400 mr-3"></div>
                    {area}
                  </button>
                ))}
              </>
            )}

            {searchTerm && filteredNeighborhoods.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500">
                <MapPinIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No neighborhoods found</p>
                <p className="text-xs text-gray-400">Try a custom location below</p>
              </div>
            )}

            {/* Custom Area Option */}
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={() => handleAreaSelect('Custom Area')}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center text-amber-600 font-medium"
            >
              <div className="w-2 h-2 rounded-full bg-amber-600 mr-3"></div>
              + Enter Custom Location
            </button>

            {/* Other Areas Fallback */}
            <button
              onClick={() => handleAreaSelect('Other Areas')}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center ${
                selectedArea === 'Other Areas' ? 'bg-gray-100 font-semibold' : ''
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-gray-500 mr-3"></div>
              Other Areas
            </button>
          </div>
        </div>
      )}

      {/* Custom Area Input */}
      {showCustomInput && (
        <form onSubmit={handleCustomAreaSubmit} className="mt-3 p-3 border border-amber-200 bg-amber-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter specific location:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customArea}
              onChange={(e) => onCustomAreaChange(e.target.value)}
              placeholder="e.g., Nyayo Estate, Hardy..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              Set
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter any area in Kenya (not just Nairobi)
          </p>
        </form>
      )}
    </div>
  )
}