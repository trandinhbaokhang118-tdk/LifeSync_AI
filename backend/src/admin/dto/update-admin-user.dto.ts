import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAdminUserDto {
    @ApiPropertyOptional({ example: 'John Doe', minLength: 2, maxLength: 120 })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    name?: string;

    @ApiPropertyOptional({ example: 'john@example.com', maxLength: 191 })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    @IsOptional()
    @IsEmail()
    @MaxLength(191)
    email?: string;

    @ApiPropertyOptional({ example: '+84901234567', maxLength: 32 })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsOptional()
    @IsString()
    @MaxLength(32)
    phone?: string;
}
