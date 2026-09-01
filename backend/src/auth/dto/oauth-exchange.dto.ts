import { IsString, Length } from 'class-validator';

export class OAuthExchangeDto {
    @IsString()
    @Length(64, 64)
    code: string;
}
