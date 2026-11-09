import { Navigate, createHashRouter } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { AppLayout } from '@/layout/AppLayout';
import { ProtectedRoute } from '@/layout/ProtectedRoute';
import { PublicRoute } from '@/layout/PublicRoute';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';

export const router = createHashRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/register',
            element: <RegisterPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/categories',
            lazy: async () => ({ Component: (await import('@/pages/CategoriesPage')).CategoriesPage }),
          },
          {
            path: '/credits',
            lazy: async () => ({ Component: (await import('@/pages/CreditsPage')).CreditsPage }),
          },
          {
            path: '/savings',
            lazy: async () => ({ Component: (await import('@/pages/SavingsPage')).SavingsPage }),
          },
          {
            path: '/transactions',
            lazy: async () => ({ Component: (await import('@/pages/TransactionsPage')).TransactionsPage }),
          },
          {
            path: '/plan',
            lazy: async () => ({ Component: (await import('@/pages/PlanPage')).PlanPage }),
          },
          {
            path: '/reports',
            lazy: async () => ({ Component: (await import('@/pages/ReportsPage')).ReportsPage }),
          },
          {
            path: '/history',
            lazy: async () => ({ Component: (await import('@/pages/HistoryPage')).HistoryPage }),
          },
          {
            path: '/settings',
            lazy: async () => ({ Component: (await import('@/pages/SettingsPage')).SettingsPage }),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
