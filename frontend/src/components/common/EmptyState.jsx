// frontend/src/components/common/EmptyState.jsx
import React from "react";
import Card from "../ui/Card";

const EmptyState = ({ icon, title, description, action = null }) => {
  return (
    <Card className="text-center py-12">
      {icon && <div className="mx-auto mb-4">{icon}</div>}
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
};

export default EmptyState;
