import Link from 'next/link';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className='container mx-auto px-4 py-8'>
          <h1 className='text-4xl font-bold mb-6'>Teo&apos;s Diet App</h1>
          <p className='text-lg mb-8'>
            Track your diet and nutrition with this interactive application.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-card p-6 rounded-lg shadow-md'>
              <h2 className='text-2xl font-semibold mb-4'>Weekly Diet Plan</h2>
              <p className='mb-4'>View and manage your weekly meal schedule.</p>
              <Link
                href='/diet-plan'
                className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
              >
                View Diet Plan
              </Link>
            </div>
            <div className='bg-card p-6 rounded-lg shadow-md'>
              <h2 className='text-2xl font-semibold mb-4'>
                Nutrition Analytics
              </h2>
              <p className='mb-4'>
                Track your calorie intake and nutritional balance.
              </p>
              <Link
                href='/analytics'
                className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
