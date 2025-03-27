// frontend/src/pages/Tenants.jsx
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import Card from "../components/ui/Card";

const Tenants = () => {
  const [tenants, setTenants] = useState([]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tenants
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your property tenants
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus className="h-5 w-5 mr-2" />
          Add Tenant
        </button>
      </div>

      <Card className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No tenants
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by adding your first tenant
        </p>
        <div className="mt-6">
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="h-5 w-5 mr-2" />
            Add Tenant
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Tenants;
