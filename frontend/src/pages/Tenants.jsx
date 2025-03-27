// src/pages/Tenants.jsx
// Purpose: Display and manage tenants
import Card from '../components/ui/Card';

function Tenants() {
  const tenants = [
    { id: 1, name: 'John Doe', unit: '101', status: 'Active' },
    { id: 2, name: 'Jane Smith', unit: '202', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        Tenants
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => (
          <Card key={tenant.id} title={tenant.name}>
            <div className="space-y-2">
              <p>Unit: {tenant.unit}</p>
              <p>Status: {tenant.status}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Tenants;