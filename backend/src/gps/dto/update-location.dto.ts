import { IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  altitude?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  speed?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  timestamp?: string;
}
