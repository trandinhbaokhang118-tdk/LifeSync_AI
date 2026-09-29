import { IsDateString, IsString, Length, Matches } from 'class-validator';

export class CompleteCalendarDto {
    @IsString() @Length(1, 4096) code: string;
    @IsString() @Matches(/^[A-Za-z0-9_-]{43}$/) state: string;
}
export class CalendarRangeDto {
    @IsDateString() startDate: string;
    @IsDateString() endDate: string;
}
