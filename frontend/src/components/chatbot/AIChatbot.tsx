import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, MessageCircle, Mail, Phone } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { aiChatService, type ChatAction } from '../../services/ai-chat.service';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [showContactMenu, setShowContactMenu] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            loadInitialSuggestions();
            addWelcomeMessage();
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const addWelcomeMessage = () => {
        const welcomeMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content:
                'Xin chào! Tôi là trợ lý AI của Time Manager. Tôi có thể giúp bạn quản lý công việc, lên lịch và tối ưu thời gian. Bạn cần tôi giúp gì?',
            timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
    };

    const loadInitialSuggestions = async () => {
        try {
            const suggestionsData = await aiChatService.getSuggestions();
            setSuggestions(suggestionsData.suggestions || []);
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const chatData = await aiChatService.sendMessage(
                {
                    message: text,
                    context: messages.slice(-5).map((message) => ({
                        role: message.role,
                        content: message.content,
                    })),
                },
            );

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: chatData.message || 'Xin lỗi, tôi không thể trả lời lúc này.',
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            if (chatData.suggestions) {
                setSuggestions(chatData.suggestions);
            }

            if (chatData.actions && chatData.actions.length > 0) {
                handleActions(chatData.actions);
            }
        } catch {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActions = (actions: ChatAction[]) => {
        actions.forEach(() => {
            // Reserved for future UI-side automation hooks.
        });
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const contactMethods = [
        {
            icon: MessageCircle,
            label: 'AI Chat',
            color: 'from-blue-500 to-cyan-500',
            action: () => {
                setIsOpen(true);
                setShowContactMenu(false);
            },
        },
        {
            icon: () => (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
            label: 'Facebook',
            color: 'from-blue-600 to-blue-700',
            action: () => window.open('https://facebook.com/timemanager', '_blank'),
        },
        {
            icon: Mail,
            label: 'Email',
            color: 'from-red-500 to-pink-500',
            action: () => {
                window.location.href = 'mailto:support@timemanager.com';
            },
        },
        {
            icon: Phone,
            label: 'Hotline',
            color: 'from-green-500 to-emerald-500',
            action: () => {
                window.location.href = 'tel:+84123456789';
            },
        },
    ];

    return (
        <>
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50">
                    {showContactMenu && (
                        <div className="absolute bottom-20 right-0 mb-2 flex flex-col gap-3">
                            {contactMethods.map((method, index) => {
                                const IconComponent = method.icon;
                                return (
                                    <button
                                        key={index}
                                        onClick={method.action}
                                        className="group flex items-center gap-3 transition-all duration-300 hover:scale-105"
                                        style={{
                                            animation: `slideUp 0.3s ease-out ${index * 0.1}s both`,
                                        }}
                                    >
                                        <span
                                            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                                            style={{
                                                background: 'var(--surface-2)',
                                                color: 'var(--text)',
                                                border: '1px solid var(--border)',
                                            }}
                                        >
                                            {method.label}
                                        </span>
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${method.color} shadow-lg transition-shadow hover:shadow-2xl`}
                                        >
                                            <IconComponent className="h-6 w-6 text-white" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <button
                        onClick={() => setShowContactMenu(!showContactMenu)}
                        className="group relative flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:shadow-3xl"
                        style={{
                            background: 'var(--primary-gradient)',
                            boxShadow: '0 8px 32px rgba(18, 194, 255, 0.4)',
                        }}
                    >
                        <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">
                            {showContactMenu ? (
                                <X className="h-7 w-7 text-white" />
                            ) : (
                                <MessageCircle className="h-7 w-7 text-white" />
                            )}
                        </div>
                        {!showContactMenu && (
                            <>
                                <div className="absolute inset-0 animate-ping rounded-full bg-white/20" />
                                <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-red-500">
                                    <span className="absolute inset-0 animate-ping rounded-full bg-red-500" />
                                </div>
                            </>
                        )}
                    </button>
                </div>
            )}

            {isOpen && (
                <div
                    className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-3xl"
                    style={{
                        width: '400px',
                        height: '600px',
                        maxHeight: 'calc(100vh - 100px)',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(20px)',
                        animation: 'slideUp 0.3s ease-out',
                    }}
                >
                    <div
                        className="relative flex items-center justify-between overflow-hidden p-4"
                        style={{
                            background: 'var(--primary-gradient)',
                            color: 'white',
                        }}
                    >
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="relative">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/50 bg-white/30 backdrop-blur-sm">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-400">
                                    <span className="absolute inset-0 animate-ping rounded-full bg-green-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold">AI Assistant</h3>
                                <p className="flex items-center gap-1 text-xs opacity-90">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                                    Đang hoạt động
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all hover:rotate-90 hover:bg-white/20"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div
                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full shadow-md"
                                    style={{
                                        background:
                                            message.role === 'user'
                                                ? 'var(--primary-gradient)'
                                                : 'var(--surface-3)',
                                    }}
                                >
                                    {message.role === 'user' ? (
                                        <User className="h-5 w-5 text-white" />
                                    ) : (
                                        <Bot className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                                    )}
                                </div>
                                <div
                                    className={`flex-1 rounded-2xl p-3 shadow-sm ${
                                        message.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                                    }`}
                                    style={{
                                        background:
                                            message.role === 'user' ? 'var(--primary)' : 'var(--surface-3)',
                                        color: message.role === 'user' ? 'white' : 'var(--text)',
                                    }}
                                >
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {message.content}
                                    </p>
                                    <span
                                        className="mt-1 block text-xs"
                                        style={{
                                            opacity: 0.7,
                                            color:
                                                message.role === 'user' ? 'white' : 'var(--text-3)',
                                        }}
                                    >
                                        {message.timestamp.toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-full shadow-md"
                                    style={{ background: 'var(--surface-3)' }}
                                >
                                    <Bot className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                                </div>
                                <div
                                    className="rounded-2xl rounded-tl-sm p-3 shadow-sm"
                                    style={{ background: 'var(--surface-3)' }}
                                >
                                    <Loader2
                                        className="h-5 w-5 animate-spin"
                                        style={{ color: 'var(--primary)' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {suggestions.length > 0 && (
                        <div className="px-4 pb-2">
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="rounded-full px-3 py-1.5 text-xs shadow-sm transition-all hover:scale-105"
                                        style={{
                                            background: 'var(--surface-3)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-2)',
                                        }}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="border-t p-4"
                        style={{ borderColor: 'var(--border)' }}
                    >
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Nhập tin nhắn..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="px-4"
                                style={{
                                    background: input.trim()
                                        ? 'var(--primary-gradient)'
                                        : 'var(--surface-3)',
                                    color: 'white',
                                }}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
}
