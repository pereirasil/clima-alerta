import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

type ErrorResponseBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.buildResponseBody(exception, statusCode, request.url);
    response.status(statusCode).json(body);
  }

  private buildResponseBody(
    exception: unknown,
    statusCode: number,
    path: string,
  ): ErrorResponseBody {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === "object" && response !== null) {
        const responseRecord = response as Record<string, unknown>;
        return {
          statusCode,
          error: this.asString(responseRecord.error, exception.name),
          message: this.asMessage(responseRecord.message, exception.message),
          timestamp: new Date().toISOString(),
          path,
        };
      }

      return {
        statusCode,
        error: exception.name,
        message: exception.message,
        timestamp: new Date().toISOString(),
        path,
      };
    }

    return {
      statusCode,
      error: "Internal Server Error",
      message: "Unexpected error",
      timestamp: new Date().toISOString(),
      path,
    };
  }

  private asString(value: unknown, fallback: string): string {
    return typeof value === "string" ? value : fallback;
  }

  private asMessage(value: unknown, fallback: string): string | string[] {
    if (typeof value === "string") {
      return value;
    }
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      return value;
    }
    return fallback;
  }
}
