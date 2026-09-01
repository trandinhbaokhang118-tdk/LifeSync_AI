import { useState, useEffect, type ReactNode } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DateTimePickerProps {
    value?: Date;
    onChange: (date: Date) => void;
    label?: string | ReactNode;
    className?: string;
}

export function DateTimePicker({ value, onChange, label, className }: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');

    useEffect(() => {
        if (value) {
            const date = new Date(value);
            setSelectedDate(date.toISOString().split('T')[0]);
            setSelectedTime(date.toTimeString().slice(0, 5));
        } else {
            const now = new Date();
            setSelectedDate(now.toISOString().split('T')[0]);
            setSelectedTime(now.toTimeString().slice(0, 5));
        }
    }, [value]);

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate);
        updateDateTime(newDate, selectedTime);
    };

    const handleTimeChange = (newTime: string) => {
        setSelectedTime(newTime);
        updateDateTime(selectedDate, newTime);
    };

    const updateDateTime = (date: string, time: string) => {
        if (date && time) {
            const dateTime = new Date(`${date}T${time}`);
            onChange(dateTime);
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <label className="block text-sm font-medium text-[var(--text)]">
                    {label}
                </label>
            )}
            <div className="grid grid-cols-2 gap-3">
                {/* Date Picker */}
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className={cn(
                            'w-full pl-10 pr-3 py-2.5 rounded-lg',
                            'bg-[var(--input-bg)]',
                            'border border-[var(--input-border)]',
                            'text-[var(--input-text)]',
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            'transition-all duration-200',
                            'cursor-pointer'
                        )}
                    />
                </div>

                {/* Time Picker */}
                <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
                    <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className={cn(
                            'w-full pl-10 pr-3 py-2.5 rounded-lg',
                            'bg-[var(--input-bg)]',
                            'border border-[var(--input-border)]',
                            'text-[var(--input-text)]',
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            'transition-all duration-200',
                            'cursor-pointer'
                        )}
                    />
                </div>
            </div>
        </div>
    );
}
