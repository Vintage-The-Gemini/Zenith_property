export default function Card({ children, className = "", ...props }) {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}