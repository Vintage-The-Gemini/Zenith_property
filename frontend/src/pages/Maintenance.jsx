// src/pages/Maintenance.jsx
// Purpose: Display and manage maintenance requests
import Card from '../components/ui/Card';

function Maintenance() {
  const requests = [
    { id: 1, issue: 'Plumbing', unit: '101', priority: 'High' },
    { id: 2, issue: 'HVAC', unit: '202', priority: 'Medium' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        Maintenance Requests
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((request) => (
          <Card key={request.id} title={`Unit ${request.unit}`}>
            <div className="space-y-2">
              <p>Issue: {request.issue}</p>
              <p>Priority: {request.priority}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Maintenance;