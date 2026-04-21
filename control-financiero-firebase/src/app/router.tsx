import { Navigate, createHashRouter } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { AppLayout } from '@/layout/AppLayout';
import { ProtectedRoute } from '@/layout/ProtectedRoute';
import { PublicRoute } from '@/layout/PublicRoute';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TransactionsPage } from '@/pages/TransactionsPage';

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
            element: <CategoriesPage />,
          },
          {
            path: '/transactions',
            element: <TransactionsPage />,
          },
          {
            path: '/history',
            element: <HistoryPage />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
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

