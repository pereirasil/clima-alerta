import { Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { HealthQueryDto } from "./dto/health-query.dto";
import { HealthService, type HealthStatus } from "./health.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Retorna o status operacional honesto da API." })
  @ApiOkResponse({
    description: "API respondendo com status de aplicacao, banco e Redis.",
  })
  async getHealth(
    @Query() query: HealthQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthStatus> {
    const status = await this.healthService.getStatus(query.includeVersion);
    if (status.status !== "ok") {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return status;
  }

  @Get("live")
  @ApiOperation({ summary: "Verifica se o processo da API esta vivo." })
  getLiveness(@Query() query: HealthQueryDto): Omit<HealthStatus, "services"> {
    return this.healthService.getLiveness(query.includeVersion);
  }

  @Get("ready")
  @ApiOperation({
    summary: "Verifica se a API esta pronta para dependencias de infraestrutura.",
  })
  async getReadiness(
    @Query() query: HealthQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthStatus> {
    const status = await this.healthService.getStatus(query.includeVersion);
    if (status.status !== "ok") {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return status;
  }
}
