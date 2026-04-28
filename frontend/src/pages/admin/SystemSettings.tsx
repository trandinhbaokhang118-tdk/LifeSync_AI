import { CreditCard, Database, Globe, Shield } from 'lucide-react';
import '../../admin-theme.css';
import { API_URL } from '../../lib/api-config';

const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';

export function SystemSettings() {
    const frontendOrigin = window.location.origin;
    const apiBaseUrl = API_URL;

    const runtimeCards = [
        {
            title: 'Frontend origin',
            value: frontendOrigin,
            description: 'Current host serving the admin panel.',
            icon: Globe,
            iconClassName: 'from-cyan-500 to-blue-500',
        },
        {
            title: 'API base URL',
            value: apiBaseUrl,
            description: 'Resolved from web/native environment settings for the current platform.',
            icon: Database,
            iconClassName: 'from-violet-500 to-fuchsia-600',
        },
        {
            title: 'Billing',
            value: paymentsEnabled ? 'Enabled' : 'Disabled',
            description: paymentsEnabled
                ? 'Checkout is exposed to the UI.'
                : 'Safe default for handoff until a real gateway is integrated.',
            icon: CreditCard,
            iconClassName: 'from-amber-500 to-orange-600',
        },
        {
            title: 'Admin mode',
            value: 'Read-only runbook',
            description: 'Production changes belong in .env files and hosting configuration.',
            icon: Shield,
            iconClassName: 'from-emerald-500 to-green-600',
        },
    ];

    return (
        <div className="admin-theme admin-container p-6 md:p-8">
            <div className="mb-8">
                <h1 className="admin-title mb-2">Deployment Settings</h1>
                <p className="admin-title-sub">Operational reference for the current build.</p>
            </div>

            <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Read-only</p>
                <h2 className="mt-2 text-2xl font-bold">Configuration changes are applied outside this page.</h2>
                <p className="mt-3 max-w-3xl text-sm opacity-80">
                    Update backend `.env`, frontend `.env`, or your Render environment variables, then redeploy. The
                    admin UI intentionally avoids fake save actions for production settings.
                </p>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {runtimeCards.map((card) => (
                    <div key={card.title} className="admin-glass-card p-6">
                        <div
                            className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.iconClassName} shadow-lg`}
                        >
                            <card.icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-sm opacity-70">{card.title}</p>
                        <p className="mt-2 break-all text-lg font-semibold">{card.value}</p>
                        <p className="mt-2 text-sm opacity-75">{card.description}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="admin-glass-card p-6">
                    <h2 className="mb-4 text-lg font-bold">Backend environment checklist</h2>
                    <ul className="space-y-3 text-sm opacity-85">
                        <li>`DATABASE_URL` points to production MySQL.</li>
                        <li>`JWT_SECRET` is rotated from the local example value.</li>
                        <li>`FRONTEND_URL` matches the public web domain.</li>
                        <li>`PAYMENTS_ENABLED` stays `false` until gateway integration is complete.</li>
                        <li>OAuth callback URLs match the deployed backend domain.</li>
                    </ul>
                </div>

                <div className="admin-glass-card p-6">
                    <h2 className="mb-4 text-lg font-bold">Frontend release checklist</h2>
                    <ul className="space-y-3 text-sm opacity-85">
                        <li>`VITE_WEB_API_URL` or `VITE_API_URL` points to the web backend URL.</li>
                        <li>`VITE_ANDROID_API_URL` or `VITE_NATIVE_API_URL` is set for Android devices/emulators.</li>
                        <li>`VITE_PAYMENTS_ENABLED` matches the backend billing state.</li>
                        <li>Run `npm run build` before shipping the web app.</li>
                        <li>Run `npx cap sync android` before creating an Android release.</li>
                        <li>Provide signing files only on trusted release machines.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
