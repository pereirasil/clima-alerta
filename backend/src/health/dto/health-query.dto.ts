import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, type TransformFnParams } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class HealthQueryDto {
  @ApiPropertyOptional({
    description: "Inclui a versao da API na resposta quando true.",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown => {
    const rawValue: unknown = value;
    if (rawValue === "true" || rawValue === true) {
      return true;
    }
    if (rawValue === "false" || rawValue === false) {
      return false;
    }
    return rawValue;
  })
  @IsBoolean()
  includeVersion?: boolean;
}
