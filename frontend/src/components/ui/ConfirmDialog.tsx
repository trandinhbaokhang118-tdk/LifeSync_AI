import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning';
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Transition show={open} as={Fragment}>
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
                    <div className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-[var(--text)] shadow-2xl backdrop-blur-xl">
                            <motion.div
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-start gap-4"
                            >
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, -5, 5, 0]
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.2
                                    }}
                                    className={`p-2 rounded-xl ${variant === 'danger' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-yellow-100 dark:bg-yellow-500/20'}`}
                                >
                                    <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                                </motion.div>
                                <div className="flex-1">
                                    <DialogTitle className="text-lg font-semibold text-[var(--text)]">
                                        {title}
                                    </DialogTitle>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="mt-2 text-sm text-[var(--text-2)]"
                                    >
                                        {message}
                                    </motion.p>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-6 flex justify-end gap-3"
                            >
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                                        {cancelText}
                                    </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="destructive" onClick={onConfirm} loading={loading}>
                                        {confirmText}
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
