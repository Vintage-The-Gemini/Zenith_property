// src/pages/Payments.jsx
// Purpose: Display and manage payments
import Card from '../components/ui/Card';

function Payments() {
  const payments = [
    { id: 1, tenant: 'John Doe', amount: 1200, status: 'Paid' },
    { id: 2, tenant: 'Jane Smith', amount: 1100, status: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        Payments
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {payments.map((payment) => (
          <Card key={payment.id} title={payment.tenant}>
            <div className="space-y-2">
              <p>Amount: ${payment.amount}</p>
              <p>Status: {payment.status}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Payments;