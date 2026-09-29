import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Length, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeatherService } from './weather.service';
export class WeatherSearchDto { @IsString() @Length(2, 100) name: string; }
export class WeatherLocationDto {
    @Type(() => Number) @IsNumber() @Min(-90) @Max(90) latitude: number;
    @Type(() => Number) @IsNumber() @Min(-180) @Max(180) longitude: number;
}
@Controller('calendar-integrations/weather')
@UseGuards(JwtAuthGuard)
export class WeatherController {
    constructor(private weather: WeatherService) {}
    @Get('status') status() { return this.weather.status(); }
    @Get('search') search(@Query() query: WeatherSearchDto) { return this.weather.search(query.name); }
    @Get('forecast') forecast(@Query() query: WeatherLocationDto) { return this.weather.forecast(query.latitude, query.longitude); }
}
