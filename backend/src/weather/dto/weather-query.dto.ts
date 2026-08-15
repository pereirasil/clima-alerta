import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsLatitude, IsLongitude, IsNumber } from "class-validator";

function parseCoordinate(value: unknown): unknown {
  if (typeof value !== "string" && typeof value !== "number") {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export class WeatherQueryDto {
  @ApiProperty({ example: -22.9068, minimum: -90, maximum: 90 })
  @Transform(({ value }) => parseCoordinate(value))
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: -43.1729, minimum: -180, maximum: 180 })
  @Transform(({ value }) => parseCoordinate(value))
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsLongitude()
  longitude!: number;
}
