import { useNavigate } from 'react-router-dom';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '../ui/command';
import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    Timer,
    BarChart3,
    Bell,
    Settings,
    Plus,
    Moon,
    Sun,
    LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const runCommand = (command: () => void) => {
        onOpenChange(false);
        command();
    };

    const toggleDarkMode = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', String(isDark));
    };

    return (
        <div className='bg-blue'>
            <CommandDialog open={open} onOpenChange={onOpenChange}>
                <CommandInput placeholder="Nhập lệnh hoặc tìm kiếm..." />
                <CommandList>
                    <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>

                    <CommandGroup heading="Tạo mới">
                        <CommandItem onSelect={() => runCommand(() => navigate('/app/tasks?new=true'))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Tạo công việc mới</span>
                            <CommandShortcut>⌘N</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/app/calendar?new=true'))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Tạo sự kiện mới</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/app/focus'))}>
                            <Timer className="mr-2 h-4 w-4" />
                            <span>Bắt đầu Focus</span>
                            <CommandShortcut>⌘F</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Điều hướng">
                        <CommandItem onSelect={() => runCommand(() => navigate('/app'))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                            <CommandShortcut>⌘1</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/app/tasks'))}>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            <span>Công việc</span>
                            <CommandShortcut>⌘2</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/app/calendar'))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Lịch</span>
                            <CommandShortcut>⌘3</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/app/focus'))}>
                            <Timer className="mr-2 h-4 w-4" />
                            <span>Focus</span>
                            <CommandShortcut>⌘4</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/app/analytics'))}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>Thống kê</span>
                            <CommandShortcut>⌘5</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/app/notifications'))}>
                            <Bell className="mr-2 h-4 w-4" />
                            <span>Thông báo</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/app/settings'))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Cài đặt</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Cài đặt">
                        <CommandItem onSelect={() => runCommand(toggleDarkMode)}>
                            <Sun className="mr-2 h-4 w-4 dark:hidden" />
                            <Moon className="mr-2 h-4 w-4 hidden dark:block" />
                            <span>Chuyển đổi Dark Mode</span>
                            <CommandShortcut>⌘D</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => { void logout().finally(() => navigate('/login')); })}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Đăng xuất</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </div>
    );
}
