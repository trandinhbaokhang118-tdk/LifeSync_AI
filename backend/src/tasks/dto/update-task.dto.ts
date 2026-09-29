import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto, { skipNullProperties: false }) {
    @ApiPropertyOptional({ description: 'Explicit confirmation to perform overlapping tasks together.' })
    @IsOptional()
    @IsBoolean()
    allowTaskOverlap?: boolean;
}
