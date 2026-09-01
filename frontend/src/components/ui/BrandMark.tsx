import { cn } from '../../lib/utils';

interface BrandMarkProps {
    className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
    return (
        <img
            src="/lifesync.svg"
            alt=""
            aria-hidden="true"
            draggable={false}
            className={cn('block select-none', className)}
        />
    );
}
