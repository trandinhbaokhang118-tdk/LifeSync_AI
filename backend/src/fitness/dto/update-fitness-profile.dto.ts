import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFitnessProfileDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  goalWeight?: number;

  @ApiProperty({ required: false, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] })
  @IsString()
  @IsOptional()
  activityLevel?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  stepGoal?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  calorieGoal?: number;
}
