import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fitnessService } from '../services/fitness.service';
import type { FitnessProfile } from '../types';

export function FitnessProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Partial<FitnessProfile>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await fitnessService.getProfile();
            setProfile(data);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fitnessService.updateProfile(profile);
            alert('Profile updated successfully!');
            navigate('/app/fitness');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
                        Fitness Profile
                    </h1>
                    <p className="text-[var(--text-2)]">
                        Customize your fitness goals
                    </p>
                </div>
                <button
                    onClick={() => navigate('/app/fitness')}
                    className="px-4 py-2 text-[var(--text-2)] hover:text-[var(--text)]"
                >
                    Back
                </button>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
                <div className="space-y-6">
                    {/* Body Measurements */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
                            Body Measurements
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                                    Height (cm)
                                </label>
                                <input
                                    type="number"
                                    value={profile.height || ''}
                                    onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2 text-[var(--input-text)] placeholder:text-[var(--input-placeholder)]"
                                    placeholder="170"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                                    Current Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    value={profile.weight || ''}
                                    onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2 text-[var(--input-text)] placeholder:text-[var(--input-placeholder)]"
                                    placeholder="70"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                                    Goal Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    value={profile.goalWeight || ''}
                                    onChange={(e) => setProfile({ ...profile, goalWeight: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2 text-[var(--input-text)] placeholder:text-[var(--input-placeholder)]"
                                    placeholder="65"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Activity Level */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
                            Activity Level
                        </h3>
                        <div className="space-y-2">
                            {[
                                { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                                { value: 'light', label: 'Light', desc: 'Light exercise 1-3 days/week' },
                                { value: 'moderate', label: 'Moderate', desc: 'Moderate exercise 3-5 days/week' },
                                { value: 'active', label: 'Active', desc: 'Hard exercise 6-7 days/week' },
                                { value: 'very_active', label: 'Very Active', desc: 'Intense exercise daily' },
                            ].map((level) => (
                                <label
                                    key={level.value}
                                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                                        profile.activityLevel === level.value
                                            ? 'border-[var(--primary)] bg-[var(--surface-highlight)]'
                                            : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="activityLevel"
                                        value={level.value}
                                        checked={profile.activityLevel === level.value}
                                        onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
                                        className="sr-only"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-[var(--text)]">{level.label}</p>
                                        <p className="text-sm text-[var(--text-2)]">{level.desc}</p>
                                    </div>
                                    {profile.activityLevel === level.value && (
                                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Daily Goals */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
                            Daily Goals
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                                    Daily Step Goal
                                </label>
                                <input
                                    type="number"
                                    value={profile.stepGoal || 10000}
                                    onChange={(e) => setProfile({ ...profile, stepGoal: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2 text-[var(--input-text)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                                    Daily Calorie Goal
                                </label>
                                <input
                                    type="number"
                                    value={profile.calorieGoal || 500}
                                    onChange={(e) => setProfile({ ...profile, calorieGoal: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2 text-[var(--input-text)]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
