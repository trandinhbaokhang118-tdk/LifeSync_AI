// User types
export type SubscriptionTier = 'FREE' | 'PRO' | 'PLUS';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
export type PaymentProvider = 'STRIPE' | 'SEPAY' | 'VNPAY' | 'MOMO' | 'ZALOPAY';
export type HealthProvider = 'apple_health' | 'google_fit';
export type HealthConnectionMode = 'native' | 'preview';
export type HealthPlatform = 'ios' | 'android' | 'web';
export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';
export type AuthPortal = 'user' | 'admin';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    phone?: string;
    role: UserRole;
    portal?: AuthPortal;
    createdAt: string;
    updatedAt: string;
    subscription?: Subscription;
}

// Auth types
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
    access?: {
        portal: AuthPortal;
        defaultRoute: string;
        allowedRoutePrefixes: string[];
        restrictedRoutePrefixes: string[];
        description: string;
    };
}

// Task types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
    id: string;
    userId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    startAt: string;
    dueAt: string;
    reminderMinutes?: number;
    createdAt: string;
    updatedAt: string;
    tags?: Tag[];
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    startAt: string;
    dueAt: string;
    reminderMinutes?: number;
    tagIds?: string[];
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;

// Tag types
export interface Tag {
    id: string;
    userId: string;
    name: string;
    color: string;
    createdAt: string;
}

export interface CreateTagRequest {
    name: string;
    color?: string;
}

// Time Block types
export interface TimeBlock {
    id: string;
    userId: string;
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTimeBlockRequest {
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
}

// Reminder types
export interface Reminder {
    id: string;
    userId: string;
    message: string;
    triggerAt: string;
    triggered: boolean;
    createdAt: string;
}

export interface CreateReminderRequest {
    message: string;
    triggerAt: string;
}

// Notification types
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    readAt?: string;
    createdAt: string;
}

// Dashboard types
export interface DashboardStats {
    tasksDueToday: number;
    tasksOverdue: number;
    tasksCompletedThisWeek: number;
}

export interface FocusTimeStats {
    totalMinutes: number;
    totalHours: number;
}

// API Response types
export interface ApiResponse<T> {
    data: T;
    meta?: PaginationMeta;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiError {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}

// Query params
export interface TaskQueryParams {
    page?: number;
    limit?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'dueAt' | 'createdAt' | 'priority';
    sortOrder?: 'asc' | 'desc';
}

export interface TimeBlockQueryParams {
    startDate: string;
    endDate: string;
}

// Subscription types
export interface Subscription {
    id?: string;
    userId?: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    provider?: PaymentProvider;
    providerSubId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    canceledAt?: string;
    trialUsed?: boolean;
}

export interface SubscriptionPlan {
    id: string;
    tier: SubscriptionTier;
    name: string;
    description?: string;
    priceVND: number;
    priceUSD: number;
    interval: string;
    features: string[];
    isActive: boolean;
    sortOrder: number;
}

export interface CreateCheckoutRequest {
    tier: SubscriptionTier;
    provider?: PaymentProvider;
}

export interface CheckoutResponse {
    provider: PaymentProvider;
    checkoutUrl: string;
    checkoutFields?: Record<string, string>;
    sessionId?: string;
    paymentId?: string;
    receiver?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    };
}

// Fitness types
export interface FitnessProfile {
    id: string;
    userId: string;
    height?: number;
    weight?: number;
    goalWeight?: number;
    activityLevel: string;
    stepGoal: number;
    calorieGoal: number;
    healthConnect: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface HealthDeviceConnection {
    provider: HealthProvider;
    label: string;
    platform: HealthPlatform;
    connectionMode: HealthConnectionMode;
    connectedAt: string;
    lastSyncedAt?: string;
    syncCount: number;
    metrics: string[];
    note: string;
}

export interface ExerciseRoutePoint {
    lat: number;
    lng: number;
}

export interface ExerciseRoutePayload {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    totalDistance: number;
    duration: number;
    elevationGain?: number;
    path?: ExerciseRoutePoint[];
}

export interface Exercise {
    id: string;
    userId: string;
    name: string;
    category: string;
    subCategory?: string;
    duration: number;
    distance?: number;
    steps?: number;
    caloriesBurned?: number;
    avgHeartRate?: number;
    avgPace?: number;
    intensity: string;
    notes?: string;
    performedAt: string;
    route?: GpsRoute;
}

export interface DailyActivity {
    id: string;
    userId: string;
    date: string;
    steps: number;
    distance: number;
    calories: number;
    activeMinutes: number;
    sleepMinutes?: number;
    heartRateAvg?: number;
    syncedAt?: string;
    source?: string;
}

export interface WeeklyStats {
    totalSteps: number;
    totalDistance: number;
    totalCalories: number;
    totalActiveMinutes: number;
    avgHeartRate: number;
    days: Array<{
        date: string;
        steps: number;
        distance: number;
        calories: number;
        activeMinutes: number;
    }>;
}

// GPS types
export interface GpsRoute {
    id: string;
    exerciseId: string;
    name?: string;
    category?: string;
    distance?: number | null;
    caloriesBurned?: number | null;
    avgPace?: number | null;
    performedAt?: string;
    polyline?: string;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    totalDistance: number;
    elevationGain?: number;
    duration?: number;
    path?: Array<{ lat: number; lng: number }>;
}

export interface TrackingSession {
    sessionId: string;
    status: string;
    startLocation?: { lat: number; lng: number };
    locationCount?: number;
    totalDistance?: number;
    ignored?: boolean;
    reason?: string;
    summary?: {
        duration: number;
        distance: number;
        caloriesBurned: number;
        avgPace: number;
        startLocation: { lat: number; lng: number };
        endLocation: { lat: number; lng: number };
    };
}
