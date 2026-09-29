import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Min, Max, MaxLength, Matches, IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class ExerciseRoutePointDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;
}

class CreateExerciseRouteDto {
  @ApiProperty()
  @IsNumber()
  startLat: number;

  @ApiProperty()
  @IsNumber()
  startLng: number;

  @ApiProperty()
  @IsNumber()
  endLat: number;

  @ApiProperty()
  @IsNumber()
  endLng: number;

  @ApiProperty()
  @IsNumber()
  totalDistance: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(86400)
  duration: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  elevationGain?: number;

  @ApiProperty({ required: false, type: [ExerciseRoutePointDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseRoutePointDto)
  @IsOptional()
  path?: ExerciseRoutePointDto[];
}

export class CreateExerciseDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  @Matches(/\S/)
  name: string;

  @ApiProperty({ enum: ['cardio', 'strength', 'flexibility', 'balance', 'endurance'] })
  @IsString()
  category: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  subCategory?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(86400)
  duration: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  distance?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  steps?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(20000)
  caloriesBurned?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  avgHeartRate?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  avgPace?: number;

  @ApiProperty({ required: false, enum: ['low', 'moderate', 'high'], default: 'moderate' })
  @IsString()
  @IsOptional()
  intensity?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  performedAt?: string;

  @ApiProperty({ required: false, type: CreateExerciseRouteDto })
  @ValidateNested()
  @Type(() => CreateExerciseRouteDto)
  @IsOptional()
  route?: CreateExerciseRouteDto;
}
