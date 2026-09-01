import { Fragment, type ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-[100]">
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 z-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel
                            className={clsx(
                                'w-full rounded-2xl p-6',
                                'bg-[var(--surface-2)]',
                                'border border-[color:var(--border)]',
                                'backdrop-blur-xl',
                                'shadow-[var(--shadow-lg)]',
                                sizes[size]
                            )}
                        >
                            {/* Header */}
                            {title && (
                                <div className="flex items-center justify-between mb-4">
                                    <DialogTitle className="text-lg font-semibold text-[var(--text)]">
                                        {title}
                                    </DialogTitle>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl p-2 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-all duration-200"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            )}

                            {/* Content */}
                            {children}

                            {/* Close button if no title */}
                            {!title && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="absolute right-4 top-4 rounded-xl p-2 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-all duration-200"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
