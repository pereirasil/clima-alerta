import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JobsOptions, Queue, Worker } from "bullmq";
import Redis from "ioredis";
import type { AppConfig } from "../../../config/configuration";
import { REDIS_CLIENT } from "../../../cache/cache.service";
import { StructuredLogger } from "../../../common/logging/structured-logger.service";
import {
  NotificationDeliveryService,
  type NotificationDeliveryJob,
} from "../../application/notification-delivery.service";

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnApplicationShutdown {
  private queue?: Queue<NotificationDeliveryJob>;
  private worker?: Worker<NotificationDeliveryJob>;
  private disabledForTest = false;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly deliveryService: NotificationDeliveryService,
    private readonly logger: StructuredLogger,
  ) {}

  onModuleInit(): void {
    if (this.configService.get("nodeEnv", { infer: true }) === "test") {
      this.disabledForTest = true;
      return;
    }
    const prefix = this.configService.get("notifications.queuePrefix", {
      infer: true,
    });
    const connection = this.redis.duplicate({ maxRetriesPerRequest: null });
    this.queue = new Queue<NotificationDeliveryJob>("notification-delivery", {
      connection,
      prefix,
    });
    this.worker = new Worker<NotificationDeliveryJob>(
      "notification-delivery",
      async (job) => this.deliveryService.process(job.data),
      {
        connection: this.redis.duplicate({ maxRetriesPerRequest: null }),
        prefix,
        concurrency: 5,
      },
    );
    this.worker.on("failed", (job, error) => {
      this.logger.warn(
        {
          jobId: job?.id,
          deliveryId: job?.data.deliveryId,
          message: error.message,
        },
        "notification retry",
      );
    });
  }

  async enqueue(data: NotificationDeliveryJob, idempotencyKey: string): Promise<void> {
    if (!this.queue) {
      if (this.disabledForTest) {
        return;
      }
      throw new Error("Notification queue is not initialized.");
    }
    const options: JobsOptions = {
      jobId: idempotencyKey,
      attempts: 3,
      backoff: { type: "exponential", delay: 30000 },
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: { age: 7 * 86400, count: 1000 },
    };
    await this.queue.add("deliver", data, options);
    this.logger.log(
      { deliveryId: data.deliveryId, endpointId: data.endpointId },
      "notification queued",
    );
  }

  async getStatus(): Promise<"up" | "down"> {
    try {
      if (!this.queue) {
        return this.disabledForTest ? "up" : "down";
      }
      await this.queue.getJobCounts("waiting");
      return "up";
    } catch {
      return "down";
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }
}
