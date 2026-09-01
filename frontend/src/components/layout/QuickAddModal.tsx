import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Tag, Calendar, Flag } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';
import { Button, Badge } from '../ui';
import { parseQuickAdd } from '../../lib/utils';
import { tasksService } from '../../services/tasks.service';
import { showToast } from '../ui/toast';

interface QuickAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuickAddModal({ open, onOpenChange }: QuickAddModalProps) {
    const [input, setInput] = useState('');
    const queryClient = useQueryClient();

    const parsed = parseQuickAdd(input);

    const createTask = useMutation({
        mutationFn: tasksService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast.success('Đã tạo công việc', parsed.title);
            setInput('');
            onOpenChange(false);
        },
        onError: () => {
            showToast.error('Lỗi', 'Không thể tạo công việc');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!parsed.title.trim()) return;

        // Validate required fields
        if (!parsed.dueAt) {
            showToast.error('Lỗi', 'Vui lòng nhập thời gian (ví dụ: 20:00 hôm nay)');
            return;
        }

        // Set startAt to now
        const now = new Date();

        createTask.mutate({
            title: parsed.title,
            priority: parsed.priority,
            startAt: now.toISOString(),
            dueAt: parsed.dueAt.toISOString(),
            reminderMinutes: 15,
        });
    };

    const priorityLabels = {
        HIGH: 'Cao',
        MEDIUM: 'Trung bình',
        LOW: 'Thấp',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        Thêm nhanh
                    </DialogTitle>
                    <DialogDescription>
                        Nhập nhanh công việc kèm thời gian và độ ưu tiên, ví dụ: "Họp nhóm 20:00 hôm nay !cao".
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder='Ví dụ: "Học Unity 20:00 hom nay #công-việc !cao"'
                            className="input text-base"
                            autoFocus
                        />
                        <p className="mt-2 text-xs text-[var(--text-2)]">
                            Gợi ý: dùng hôm nay/hom nay, ngày mai/ngay mai, tag có dấu (#công-việc), độ ưu tiên (!cao, !trung-binh, !thap)
                        </p>
                    </div>

                    {/* Preview */}
                    {input && (
                        <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-3">
                            <p className="text-sm font-medium text-[var(--text-2)]">
                                Xem trước:
                            </p>

                            {parsed.title && (
                                <p className="font-medium text-[var(--text)]">
                                    {parsed.title}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {parsed.dueAt && (
                                    <Badge variant="info" className="gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {parsed.dueAt.toLocaleString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Badge>
                                )}

                                {parsed.priority && (
                                    <Badge
                                        variant={
                                            parsed.priority === 'HIGH'
                                                ? 'danger'
                                                : parsed.priority === 'MEDIUM'
                                                    ? 'warning'
                                                    : 'success'
                                        }
                                        className="gap-1"
                                    >
                                        <Flag className="w-3 h-3" />
                                        {priorityLabels[parsed.priority]}
                                    </Badge>
                                )}

                                {parsed.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="gap-1">
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={!parsed.title.trim()}
                            loading={createTask.isPending}
                        >
                            Tạo công việc
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
