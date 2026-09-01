import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
    Brain,
    CheckCircle2,
    Clock3,
    Coffee,
    Keyboard,
    Pause,
    Play,
    RotateCcw,
    TimerReset,
    type LucideIcon,
} from 'lucide-react';
import './focus-session.css';

type SessionType = 'focus' | 'shortBreak' | 'longBreak';

interface SessionConfig {
    seconds: number;
    label: string;
    headline: string;
    description: string;
    icon: LucideIcon;
}

const SESSION_CONFIG: Record<SessionType, SessionConfig> = {
    focus: {
        seconds: 25 * 60,
        label: 'Tập trung',
        headline: 'Dành 25 phút cho một việc.',
        description: 'Đóng các luồng không cần thiết và giữ một mục tiêu duy nhất trước mắt.',
        icon: Brain,
    },
    shortBreak: {
        seconds: 5 * 60,
        label: 'Nghỉ ngắn',
        headline: 'Rời màn hình trong 5 phút.',
        description: 'Thả lỏng mắt, đứng dậy và để nhịp tiếp theo bắt đầu nhẹ hơn.',
        icon: Coffee,
    },
    longBreak: {
        seconds: 15 * 60,
        label: 'Nghỉ dài',
        headline: 'Phục hồi trong 15 phút.',
        description: 'Kết thúc một chu kỳ bốn phiên trước khi quay lại công việc.',
        icon: Coffee,
    },
};

function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return minutes + ':' + remainingSeconds;
}

function isTypingTarget(target: EventTarget | null) {
    return target instanceof HTMLElement
        && Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"]'));
}

export function Focus() {
    const completionHandledRef = useRef(false);
    const autoStartHandledRef = useRef(false);
    const fullscreenSeenRef = useRef(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [sessionType, setSessionType] = useState<SessionType>('focus');
    const [timeLeft, setTimeLeft] = useState(SESSION_CONFIG.focus.seconds);
    const [isRunning, setIsRunning] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    const currentSession = SESSION_CONFIG[sessionType];
    const totalTime = currentSession.seconds;
    const progress = Math.min(1, Math.max(0, (totalTime - timeLeft) / totalTime));
    const progressStyle = { '--focus-progress': progress } as CSSProperties;
    const focusMinutesCompleted = sessionsCompleted * 25;
    const sessionsUntilLongBreak = 4 - (sessionsCompleted % 4);
    const SessionIcon = currentSession.icon;

    const handleComplete = useCallback(() => {
        setIsRunning(false);

        if (sessionType === 'focus') {
            const nextSessionCount = sessionsCompleted + 1;
            const nextType: SessionType = nextSessionCount % 4 === 0 ? 'longBreak' : 'shortBreak';

            setSessionsCompleted(nextSessionCount);
            setSessionType(nextType);
            setTimeLeft(SESSION_CONFIG[nextType].seconds);
            return;
        }

        setSessionType('focus');
        setTimeLeft(SESSION_CONFIG.focus.seconds);
    }, [sessionType, sessionsCompleted]);

    useEffect(() => {
        if (!isRunning) {
            return;
        }

        const intervalId = window.setInterval(() => {
            setTimeLeft((current) => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [isRunning]);

    useEffect(() => {
        if (timeLeft > 0) {
            completionHandledRef.current = false;
            return;
        }

        if (completionHandledRef.current) {
            return;
        }

        completionHandledRef.current = true;
        handleComplete();
    }, [handleComplete, timeLeft]);

    const toggleTimer = useCallback(() => {
        if (timeLeft === 0) {
            setTimeLeft(SESSION_CONFIG[sessionType].seconds);
        }
        setIsRunning((current) => !current);
    }, [sessionType, timeLeft]);

    const exitSession = useCallback(() => {
        fullscreenSeenRef.current = false;
        setIsRunning(false);
        setIsSessionActive(false);

        if (document.fullscreenElement && document.exitFullscreen) {
            void document.exitFullscreen().catch(() => undefined);
        }
    }, []);

    const startSession = useCallback(() => {
        const fullscreenTarget = document.documentElement;

        if (!document.fullscreenElement && fullscreenTarget?.requestFullscreen) {
            void fullscreenTarget.requestFullscreen()
                .then(() => {
                    fullscreenSeenRef.current = true;
                })
                .catch(() => undefined);
        } else if (document.fullscreenElement) {
            fullscreenSeenRef.current = true;
        }

        setIsSessionActive(true);
        setIsRunning(true);
    }, []);

    const resetTimer = useCallback(() => {
        setIsRunning(false);
        setTimeLeft(SESSION_CONFIG[sessionType].seconds);
    }, [sessionType]);

    const switchSession = useCallback((type: SessionType) => {
        setSessionType(type);
        setTimeLeft(SESSION_CONFIG[type].seconds);
        setIsRunning(false);
    }, []);

    useEffect(() => {
        if (autoStartHandledRef.current || searchParams.get('start') !== 'true') {
            return;
        }

        autoStartHandledRef.current = true;
        fullscreenSeenRef.current = Boolean(document.fullscreenElement);
        setIsSessionActive(true);
        setIsRunning(true);

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('start');
        setSearchParams(nextParams, { replace: true });
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (document.fullscreenElement) {
                fullscreenSeenRef.current = true;
                return;
            }

            if (isSessionActive && fullscreenSeenRef.current) {
                fullscreenSeenRef.current = false;
                setIsRunning(false);
                setIsSessionActive(false);
            }
        };

        handleFullscreenChange();
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [isSessionActive]);

    useEffect(() => {
        if (!isSessionActive) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyboard = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                exitSession();
                return;
            }

            if (event.code === 'Space' && !event.repeat && !isTypingTarget(event.target)) {
                event.preventDefault();
                toggleTimer();
            }
        };

        document.addEventListener('keydown', handleKeyboard, true);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyboard, true);
        };
    }, [exitSession, isSessionActive, toggleTimer]);

    useEffect(() => {
        return () => {
            if (document.fullscreenElement && document.exitFullscreen) {
                void document.exitFullscreen().catch(() => undefined);
            }
        };
    }, []);

    const sessionTabs = useMemo(
        () => (Object.keys(SESSION_CONFIG) as SessionType[]),
        [],
    );

    return (
        <div
            className="focus-page"
            data-session={sessionType}
            data-active={isSessionActive ? 'true' : 'false'}
        >
            {isSessionActive ? createPortal(
                <section
                    className="focus-immersive"
                    data-state={isRunning ? 'running' : 'paused'}
                    aria-label={'Phiên ' + currentSession.label}
                >
                    <header className="focus-immersive__header">
                        <div className="focus-immersive__brand">
                            <TimerReset aria-hidden="true" />
                            <span>LifeSync Focus</span>
                        </div>
                        <p className="focus-immersive__status" aria-live="polite">
                            <span aria-hidden="true" />
                            {isRunning ? 'Đang chạy' : 'Đang tạm dừng'}
                        </p>
                    </header>

                    <div className="focus-immersive__stage">
                        <div className="focus-immersive__copy">
                            <SessionIcon aria-hidden="true" />
                            <span>{currentSession.label}</span>
                        </div>
                        <p
                            className="focus-immersive__time"
                            role="timer"
                            aria-label={'Còn ' + formatTime(timeLeft)}
                        >
                            {formatTime(timeLeft)}
                        </p>
                        <h1>{currentSession.headline}</h1>
                        <div className="focus-progress" style={progressStyle} aria-hidden="true">
                            <span />
                        </div>
                    </div>

                    <footer className="focus-immersive__footer">
                        <div className="focus-keyboard-guide" aria-label="Phím điều khiển">
                            <span><kbd>Space</kbd>{isRunning ? 'Tạm dừng' : 'Tiếp tục'}</span>
                            <span><kbd>Esc</kbd>Thoát phiên</span>
                        </div>

                        <div className="focus-touch-controls" aria-label="Điều khiển cảm ứng">
                            <button type="button" className="focus-button focus-button--quiet" onClick={toggleTimer}>
                                {isRunning ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                                {isRunning ? 'Tạm dừng' : 'Tiếp tục'}
                            </button>
                            <button type="button" className="focus-button focus-button--quiet" onClick={exitSession}>
                                Thoát phiên
                            </button>
                        </div>

                        <p>Chỉ một việc cho đến khi đồng hồ kết thúc.</p>
                    </footer>
                </section>,
                document.body,
            ) : (
                <main className="focus-lobby">
                    <header className="focus-header">
                        <div>
                            <h1>Pomodoro</h1>
                            <p>Chọn một nhịp, rồi dành toàn bộ màn hình cho phiên đó.</p>
                        </div>
                        <div className="focus-cycle" aria-label={sessionsCompleted + ' phiên đã hoàn thành hôm nay'}>
                            <CheckCircle2 aria-hidden="true" />
                            <strong>{sessionsCompleted}</strong>
                            <span>phiên hôm nay</span>
                        </div>
                    </header>

                    <section className="focus-stage" aria-labelledby="focus-stage-heading">
                        <div className="focus-stage__intro">
                            <div>
                                <h2 id="focus-stage-heading">{currentSession.headline}</h2>
                                <p>{currentSession.description}</p>
                            </div>

                            <div className="focus-tabs" role="tablist" aria-label="Loại phiên">
                                {sessionTabs.map((type) => {
                                    const config = SESSION_CONFIG[type];
                                    const Icon = config.icon;

                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            role="tab"
                                            aria-selected={sessionType === type}
                                            className="focus-tab"
                                            onClick={() => switchSession(type)}
                                        >
                                            <Icon aria-hidden="true" />
                                            {config.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="focus-stage__timer">
                            <p className="focus-stage__time" role="timer" aria-label={'Còn ' + formatTime(timeLeft)}>
                                {formatTime(timeLeft)}
                            </p>
                            <div className="focus-progress" style={progressStyle} aria-hidden="true">
                                <span />
                            </div>
                        </div>

                        <div className="focus-stage__actions">
                            <button
                                type="button"
                                className="focus-button focus-button--quiet"
                                onClick={resetTimer}
                                disabled={timeLeft === totalTime && !isRunning}
                            >
                                <RotateCcw aria-hidden="true" />
                                Đặt lại
                            </button>
                            <button type="button" className="focus-button focus-button--primary" onClick={startSession}>
                                <Play aria-hidden="true" />
                                {timeLeft < totalTime ? 'Tiếp tục phiên' : 'Bắt đầu phiên'}
                            </button>
                        </div>
                    </section>

                    <section className="focus-support" aria-label="Tổng quan phiên">
                        <div className="focus-stats">
                            <div>
                                <strong>{sessionsCompleted}</strong>
                                <span>Phiên hoàn thành</span>
                            </div>
                            <div>
                                <strong>{focusMinutesCompleted}</strong>
                                <span>Phút tập trung</span>
                            </div>
                            <div>
                                <strong>{sessionsUntilLongBreak}</strong>
                                <span>Phiên đến nghỉ dài</span>
                            </div>
                        </div>

                        <div className="focus-shortcuts">
                            <Keyboard aria-hidden="true" />
                            <div>
                                <h2>Điều khiển trong phiên</h2>
                                <p><kbd>Space</kbd> tạm dừng hoặc tiếp tục · <kbd>Esc</kbd> thoát.</p>
                            </div>
                        </div>
                    </section>

                    <p className="focus-page__note">
                        <Clock3 aria-hidden="true" />
                        Đồng hồ giữ nguyên thời gian còn lại khi bạn thoát khỏi chế độ toàn màn hình.
                    </p>
                </main>
            )}
        </div>
    );
}
