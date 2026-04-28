import { useState } from 'react';
import { Database, Download, RefreshCw, Shield, TerminalSquare, Upload } from 'lucide-react';
import { Button } from '../../components/ui';
import { showToast } from '../../components/ui/toast';
import api from '../../services/api';
import '../../admin-theme.css';

interface BackupGuideResponse {
    status: string;
    message: string;
    backupCommand: string;
    restoreCommand: string;
    timestamp: string;
}

const fallbackBackupCommand =
    'docker exec time_manager_mysql mysqldump -u tm_user -ptm_password time_manager > backup.sql';
const fallbackRestoreCommand =
    'docker exec -i time_manager_mysql mysql -u tm_user -ptm_password time_manager < backup.sql';

export function DatabaseManagement() {
    const [checking, setChecking] = useState(false);
    const [guide, setGuide] = useState<BackupGuideResponse | null>(null);

    const handleValidateBackupGuide = async () => {
        setChecking(true);

        try {
            const response = await api.post('/admin/backup');
            setGuide(response.data.data);
            showToast.info('Manual backup flow', response.data.data.message);
        } catch {
            showToast.error('Request failed', 'Could not validate the backup runbook.');
        } finally {
            setChecking(false);
        }
    };

    const backupCommand = guide?.backupCommand ?? fallbackBackupCommand;
    const restoreCommand = guide?.restoreCommand ?? fallbackRestoreCommand;

    return (
        <div className="admin-theme admin-container p-6 md:p-8">
            <div className="mb-8">
                <h1 className="admin-title mb-2">Database Operations</h1>
                <p className="admin-title-sub">Production-safe runbook for backup, restore and maintenance.</p>
            </div>

            <div className="admin-glass-card mb-6 p-6">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Production note</h2>
                        <p className="text-sm opacity-80">
                            Automated SQL dumps are intentionally not exposed from the API. Database export and restore
                            remain manual operations to avoid accidental destructive actions from the admin panel.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm opacity-80">
                        {guide
                            ? `Last validation: ${new Date(guide.timestamp).toLocaleString()}`
                            : 'Validate the runbook endpoint once after deployment.'}
                    </div>
                    <Button
                        size="lg"
                        onClick={() => void handleValidateBackupGuide()}
                        className="admin-btn admin-btn-primary"
                        disabled={checking}
                    >
                        <RefreshCw className={`mr-2 h-5 w-5 ${checking ? 'animate-spin' : ''}`} />
                        {checking ? 'Checking...' : 'Validate backup runbook'}
                    </Button>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="admin-glass-card p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                            <Download className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Backup command</h2>
                            <p className="text-sm opacity-70">Run from an operator shell with database access.</p>
                        </div>
                    </div>
                    <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-cyan-200">
                        <code>{backupCommand}</code>
                    </pre>
                </div>

                <div className="admin-glass-card p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                            <Upload className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Restore command</h2>
                            <p className="text-sm opacity-70">Use only after confirming the target database.</p>
                        </div>
                    </div>
                    <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-amber-200">
                        <code>{restoreCommand}</code>
                    </pre>
                </div>
            </div>

            <div className="admin-glass-card p-6">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg">
                        <Database className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Maintenance checklist</h2>
                        <p className="text-sm opacity-70">Recommended steps before and after every production change.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                            <TerminalSquare className="h-4 w-4" />
                            Before deploy
                        </div>
                        <ul className="space-y-2 text-sm opacity-80">
                            <li>1. Run a fresh SQL backup.</li>
                            <li>2. Verify `npx prisma migrate deploy` succeeds in staging.</li>
                            <li>3. Confirm `/health` returns `ok: true`.</li>
                        </ul>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                            <RefreshCw className="h-4 w-4" />
                            After deploy
                        </div>
                        <ul className="space-y-2 text-sm opacity-80">
                            <li>1. Open the web app and verify login, tasks and admin routes.</li>
                            <li>2. Run Android smoke tests against the production API.</li>
                            <li>3. Keep the latest backup file with the release notes.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
