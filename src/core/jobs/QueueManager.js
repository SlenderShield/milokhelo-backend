/**
 * Queue Manager
 * Manages job queues with BullMQ and Redis
 * 
 * Features:
 * - Multiple named queues
 * - Retry with exponential backoff
 * - Job priorities
 * - Scheduled jobs
 * - Job progress tracking
 * - Failed job handling
 */

import { Queue, Worker, QueueEvents } from 'bullmq';

class QueueManager {
  constructor(redisConfig, logger) {
    this.redisConfig = {
      host: redisConfig.host || 'localhost',
      port: redisConfig.port || 6379,
      password: redisConfig.password,
      db: redisConfig.db || 0,
    };
    this.logger = logger;
    this.queues = new Map();
    this.workers = new Map();
    this.queueEvents = new Map();
  }

  /**
   * Create or get queue
   */
  getQueue(queueName, options = {}) {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName);
    }

    const queue = new Queue(queueName, {
      connection: this.redisConfig,
      defaultJobOptions: {
        attempts: options.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: options.backoffDelay || 1000,
        },
        removeOnComplete: options.removeOnComplete !== false,
        removeOnFail: options.removeOnFail || false,
        ...options.defaultJobOptions,
      },
    });

    this.queues.set(queueName, queue);
    this.logger.info(`Queue created: ${queueName}`);

    return queue;
  }

  /**
   * Create worker for queue
   */
  createWorker(queueName, processor, options = {}) {
    if (this.workers.has(queueName)) {
      this.logger.warn(`Worker already exists for queue: ${queueName}`);
      return this.workers.get(queueName);
    }

    const worker = new Worker(queueName, processor, {
      connection: this.redisConfig,
      concurrency: options.concurrency || 1,
      ...options,
    });

    // Event handlers
    worker.on('completed', (job) => {
      this.logger.info(`Job completed`, {
        queue: queueName,
        jobId: job.id,
        jobName: job.name,
        returnValue: job.returnvalue,
      });
    });

    worker.on('failed', (job, error) => {
      this.logger.error(`Job failed`, {
        queue: queueName,
        jobId: job?.id,
        jobName: job?.name,
        error: error.message,
        attemptsMade: job?.attemptsMade,
        attemptsTotal: job?.opts?.attempts,
      });
    });

    worker.on('error', (error) => {
      this.logger.error(`Worker error`, {
        queue: queueName,
        error: error.message,
      });
    });

    this.workers.set(queueName, worker);
    this.logger.info(`Worker created for queue: ${queueName}`);

    return worker;
  }

  /**
   * Listen to queue events
   */
  listenToQueueEvents(queueName) {
    if (this.queueEvents.has(queueName)) {
      return this.queueEvents.get(queueName);
    }

    const queueEvents = new QueueEvents(queueName, {
      connection: this.redisConfig,
    });

    queueEvents.on('waiting', ({ jobId }) => {
      this.logger.debug(`Job waiting`, { queue: queueName, jobId });
    });

    queueEvents.on('active', ({ jobId }) => {
      this.logger.debug(`Job active`, { queue: queueName, jobId });
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      this.logger.debug(`Job progress`, { queue: queueName, jobId, progress: data });
    });

    this.queueEvents.set(queueName, queueEvents);
    return queueEvents;
  }

  /**
   * Add job to queue
   */
  async addJob(queueName, jobName, data, options = {}) {
    const queue = this.getQueue(queueName);

    try {
      const job = await queue.add(jobName, data, options);

      this.logger.info(`Job added to queue`, {
        queue: queueName,
        jobId: job.id,
        jobName,
        data: Object.keys(data),
      });

      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to queue`, {
        queue: queueName,
        jobName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Add bulk jobs to queue
   */
  async addBulkJobs(queueName, jobs) {
    const queue = this.getQueue(queueName);

    try {
      const bulkJobs = jobs.map((job) => ({
        name: job.name,
        data: job.data,
        opts: job.options || {},
      }));

      const addedJobs = await queue.addBulk(bulkJobs);

      this.logger.info(`Bulk jobs added to queue`, {
        queue: queueName,
        count: addedJobs.length,
      });

      return addedJobs;
    } catch (error) {
      this.logger.error(`Failed to add bulk jobs`, {
        queue: queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Schedule job
   */
  async scheduleJob(queueName, jobName, data, delay) {
    return this.addJob(queueName, jobName, data, { delay });
  }

  /**
   * Schedule recurring job
   */
  async scheduleRecurringJob(queueName, jobName, data, cron) {
    const queue = this.getQueue(queueName);

    try {
      const job = await queue.add(jobName, data, {
        repeat: {
          pattern: cron,
        },
      });

      this.logger.info(`Recurring job scheduled`, {
        queue: queueName,
        jobName,
        cron,
      });

      return job;
    } catch (error) {
      this.logger.error(`Failed to schedule recurring job`, {
        queue: queueName,
        jobName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    const queue = this.getQueue(queueName);

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      return {
        queueName,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + delayed,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats`, {
        queue: queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    const stats = [];

    for (const [queueName] of this.queues) {
      try {
        const queueStats = await this.getQueueStats(queueName);
        stats.push(queueStats);
      } catch (error) {
        this.logger.error(`Failed to get stats for queue: ${queueName}`, {
          error: error.message,
        });
      }
    }

    return stats;
  }

  /**
   * Clean completed jobs
   */
  async cleanQueue(queueName, grace = 0, limit = 1000, type = 'completed') {
    const queue = this.getQueue(queueName);

    try {
      const jobs = await queue.clean(grace, limit, type);
      this.logger.info(`Queue cleaned`, {
        queue: queueName,
        type,
        count: jobs.length,
      });
      return jobs;
    } catch (error) {
      this.logger.error(`Failed to clean queue`, {
        queue: queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.info(`Queue paused: ${queueName}`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.info(`Queue resumed: ${queueName}`);
  }

  /**
   * Close all queues and workers
   */
  async close() {
    this.logger.info('Closing all queues and workers...');

    const closePromises = [];

    for (const [name, worker] of this.workers) {
      closePromises.push(
        worker.close().then(() => {
          this.logger.info(`Worker closed: ${name}`);
        })
      );
    }

    for (const [name, queue] of this.queues) {
      closePromises.push(
        queue.close().then(() => {
          this.logger.info(`Queue closed: ${name}`);
        })
      );
    }

    for (const [name, queueEvents] of this.queueEvents) {
      closePromises.push(
        queueEvents.close().then(() => {
          this.logger.info(`QueueEvents closed: ${name}`);
        })
      );
    }

    await Promise.all(closePromises);
    this.logger.info('All queues and workers closed');
  }
}

export default QueueManager;
