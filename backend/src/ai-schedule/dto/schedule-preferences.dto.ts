import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    id?: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    address: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    longitude?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    placeId?: string;
}

class TimeSlotDto {
    @ApiProperty()
    @IsString()
    start: string;

    @ApiProperty()
    @IsString()
    end: string;

    @ApiProperty()
    @IsString()
    activity: string;

    @ApiPropertyOptional({ type: LocationDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;
}

class DailyScheduleDto {
    @ApiProperty({ enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] })
    @IsEnum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    day: string;

    @ApiProperty({ type: [TimeSlotDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TimeSlotDto)
    slots: TimeSlotDto[];
}

class FixedActivityDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    day: string[];

    @ApiProperty()
    @IsString()
    start: string;

    @ApiProperty()
    @IsString()
    end: string;

    @ApiPropertyOptional({ type: LocationDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;

    @ApiProperty()
    recurring: boolean;
}

export class SaveSchedulePreferencesDto {
    @ApiProperty({ example: '06:00' })
    @IsString()
    wakeUpTime: string;

    @ApiProperty({ example: '23:00' })
    @IsString()
    sleepTime: string;

    @ApiPropertyOptional({ example: '07:00' })
    @IsOptional()
    @IsString()
    breakfastTime?: string;

    @ApiPropertyOptional({ example: '12:00' })
    @IsOptional()
    @IsString()
    lunchTime?: string;

    @ApiPropertyOptional({ example: '19:00' })
    @IsOptional()
    @IsString()
    dinnerTime?: string;

    @ApiProperty({ type: [DailyScheduleDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DailyScheduleDto)
    weeklySchedule: DailyScheduleDto[];

    @ApiProperty({ type: [FixedActivityDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FixedActivityDto)
    fixedActivities: FixedActivityDto[];

    @ApiProperty({ enum: ['morning', 'afternoon', 'evening', 'night'] })
    @IsEnum(['morning', 'afternoon', 'evening', 'night'])
    bestFocusTime: string;

    @ApiProperty({ example: 15 })
    @IsNumber()
    @Min(5)
    @Max(60)
    breakDuration: number;

    @ApiProperty({ example: 15 })
    @IsNumber()
    @Min(0)
    @Max(60)
    travelBuffer: number;

    @ApiPropertyOptional({ type: LocationDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    homeLocation?: LocationDto;

    @ApiPropertyOptional({ type: LocationDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    workLocation?: LocationDto;
}
