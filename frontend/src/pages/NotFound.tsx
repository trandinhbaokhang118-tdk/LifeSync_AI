import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui';
import { getDefaultRouteForUser } from '../lib/auth';
import { useAuthStore } from '../store/auth.store';

export function NotFound() {
    const { user, isAuthenticated } = useAuthStore();
    const homePath = isAuthenticated ? getDefaultRouteForUser(user) : '/';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">404</h1>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-4">
                    Page not found
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                </p>
                <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                        variant="secondary"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go back
                    </Button>
                    <Link to={homePath}>
                        <Button>
                            <Home className="w-4 h-4" />
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
