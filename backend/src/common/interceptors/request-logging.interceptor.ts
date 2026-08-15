import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";
import { StructuredLogger } from "../logging/structured-logger.service";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            {
              method: request.method,
              path: request.path,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
            },
            "HTTP",
          );
        },
        error: () => {
          this.logger.warn(
            {
              method: request.method,
              path: request.path,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
            },
            "HTTP",
          );
        },
      }),
    );
  }
}
