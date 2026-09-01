import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { AppLayout } from '../components/layout';
import { PrivateRoute } from '../components/auth/PrivateRoute';
import { AdminRoute } from '../components/admin/AdminRoute';
import { AdminLayout } from '../components/admin/AdminLayout';
import { getDefaultRouteForUser } from '../lib/auth';
import { useAuthStore } from '../store/auth.store';

const Landing = lazy(() => import('../pages/Landing').then((m) => ({ default: m.Landing })));
const Login = lazy(() => import('../pages/Login').then((m) => ({ default: m.Login })));
const AdminLogin = lazy(() => import('../pages/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const Register = lazy(() => import('../pages/Register').then((m) => ({ default: m.Register })));
const AuthCallback = lazy(() => import('../pages/AuthCallback').then((m) => ({ default: m.AuthCallback })));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('../pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const Dashboard = lazy(() => import('../pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Tasks = lazy(() => import('../pages/Tasks').then((m) => ({ default: m.Tasks })));
const Calendar = lazy(() => import('../pages/Calendar').then((m) => ({ default: m.Calendar })));
const Planner = lazy(() => import('../pages/Planner').then((m) => ({ default: m.Planner })));
const Focus = lazy(() => import('../pages/Focus').then((m) => ({ default: m.Focus })));
const Analytics = lazy(() => import('../pages/Analytics').then((m) => ({ default: m.Analytics })));
const Reminders = lazy(() => import('../pages/Reminders').then((m) => ({ default: m.Reminders })));
const Notifications = lazy(() => import('../pages/Notifications').then((m) => ({ default: m.Notifications })));
const Settings = lazy(() => import('../pages/Settings').then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import('../pages/NotFound').then((m) => ({ default: m.NotFound })));
const RouteError = lazy(() => import('../pages/RouteError').then((m) => ({ default: m.RouteError })));
const Subscription = lazy(() => import('../pages/Subscription').then((m) => ({ default: m.Subscription })));
const Pricing = lazy(() => import('../pages/Pricing').then((m) => ({ default: m.Pricing })));
const Fitness = lazy(() => import('../pages/Fitness').then((m) => ({ default: m.Fitness })));
const FitnessProfile = lazy(() => import('../pages/FitnessProfile').then((m) => ({ default: m.FitnessProfile })));
const FitnessDevices = lazy(() => import('../pages/FitnessDevices').then((m) => ({ default: m.FitnessDevices })));
const WorkoutHistory = lazy(() => import('../pages/WorkoutHistory').then((m) => ({ default: m.WorkoutHistory })));
const WorkoutDetail = lazy(() => import('../pages/WorkoutDetail').then((m) => ({ default: m.WorkoutDetail })));
const GpsTracking = lazy(() => import('../pages/GpsTracking').then((m) => ({ default: m.GpsTracking })));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const UserManagement = lazy(() => import('../pages/admin/UserManagement').then((m) => ({ default: m.UserManagement })));
const ActivityLogs = lazy(() => import('../pages/admin/ActivityLogs').then((m) => ({ default: m.ActivityLogs })));
const DatabaseManagement = lazy(() => import('../pages/admin/DatabaseManagement').then((m) => ({ default: m.DatabaseManagement })));
const SystemSettings = lazy(() => import('../pages/admin/SystemSettings').then((m) => ({ default: m.SystemSettings })));
const FontTest = lazy(() => import('../pages/FontTest').then((m) => ({ default: m.default })));

function LandingEntry() {
    const { isAuthenticated, user } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to={getDefaultRouteForUser(user)} replace />;
    }

    return <Landing />;
}

function RoleHomeRedirect() {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to={getDefaultRouteForUser(user)} replace />;
}

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <LandingEntry />,
            errorElement: <RouteError />,
        },
        {
            path: '/login',
            element: <Login />,
            errorElement: <RouteError />,
        },
        {
            path: '/admin/login',
            element: <AdminLogin />,
            errorElement: <RouteError />,
        },
        {
            path: '/register',
            element: <Register />,
            errorElement: <RouteError />,
        },
        {
            path: '/font-test',
            element: <FontTest />,
            errorElement: <RouteError />,
        },
        {
            path: '/auth/callback',
            element: <AuthCallback />,
            errorElement: <RouteError />,
        },
        {
            path: '/forgot-password',
            element: <ForgotPassword />,
            errorElement: <RouteError />,
        },
        {
            path: '/reset-password',
            element: <ResetPassword />,
            errorElement: <RouteError />,
        },
        {
            path: '/admin',
            element: (
                <AdminRoute>
                    <AdminLayout />
                </AdminRoute>
            ),
            errorElement: <RouteError />,
            children: [
                {
                    index: true,
                    element: <AdminDashboard />,
                },
                {
                    path: 'users',
                    element: <UserManagement />,
                },
                {
                    path: 'activity',
                    element: <ActivityLogs />,
                },
                {
                    path: 'database',
                    element: <DatabaseManagement />,
                },
                {
                    path: 'settings',
                    element: <SystemSettings />,
                },
            ],
        },
        {
            path: '/app',
            element: (
                <PrivateRoute>
                    <AppLayout />
                </PrivateRoute>
            ),
            errorElement: <RouteError />,
            children: [
                {
                    index: true,
                    element: <Dashboard />,
                },
                {
                    path: 'tasks',
                    element: <Tasks />,
                },
                {
                    path: 'calendar',
                    element: <Calendar />,
                },
                {
                    path: 'planner',
                    element: <Planner />,
                },
                {
                    path: 'focus',
                    element: <Focus />,
                },
                {
                    path: 'analytics',
                    element: <Analytics />,
                },
                {
                    path: 'reminders',
                    element: <Reminders />,
                },
                {
                    path: 'notifications',
                    element: <Notifications />,
                },
                {
                    path: 'settings',
                    element: <Settings />,
                },
                {
                    path: 'subscription',
                    element: <Subscription />,
                },
                {
                    path: 'pricing',
                    element: <Pricing />,
                },
                {
                    path: 'fitness',
                    element: <Fitness />,
                },
                {
                    path: 'fitness/profile',
                    element: <FitnessProfile />,
                },
                {
                    path: 'fitness/devices',
                    element: <FitnessDevices />,
                },
                {
                    path: 'fitness/history',
                    element: <WorkoutHistory />,
                },
                {
                    path: 'fitness/workouts/:id',
                    element: <WorkoutDetail />,
                },
                {
                    path: 'gps-tracking',
                    element: <GpsTracking />,
                },
            ],
        },
        {
            path: '/dashboard',
            element: <RoleHomeRedirect />,
            errorElement: <RouteError />,
        },
        {
            path: '/404',
            element: <NotFound />,
            errorElement: <RouteError />,
        },
        {
            path: '*',
            element: <Navigate to="/404" replace />,
        },
    ],
    {
        future: {
            v7_fetcherPersist: true,
            v7_normalizeFormMethod: true,
            v7_partialHydration: true,
            v7_relativeSplatPath: true,
            v7_skipActionErrorRevalidation: true,
        },
    },
);
