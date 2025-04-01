// frontend/src/components/common/LoadingSpinner.jsx
import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ size = "medium", message = "Loading..." }) => {
  const sizeClass =
    {
      small: "h-4 w-4",
      medium: "h-8 w-8",
      large: "h-12 w-12",
    }[size] || "h-8 w-8";

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <Loader2 className={`${sizeClass} animate-spin text-primary-600 mb-2`} />
      {message && <p className="text-gray-500">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
