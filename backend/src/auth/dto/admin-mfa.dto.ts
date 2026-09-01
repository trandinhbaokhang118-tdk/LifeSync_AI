import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class AdminMfaVerifyDto {
    @ApiProperty({ description: 'Short-lived MFA challenge token returned by admin login' })
    @IsString()
    mfaToken: string;

    @ApiProperty({ example: '123456', minLength: 6, maxLength: 6 })
    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/)
    code: string;
}
