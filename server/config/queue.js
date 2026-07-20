/**
 * Queue Configuration
 * 
 * BullMQ queue configuration for RAG pipeline and other async jobs
 */

import { Queue, Worker } from 'bullmq';
import { getQueueConnection } from '../services/redis.service.js';

const RAG_QUEUE_NAME = 'rag-pipeline';
const NOTIFICATION_QUEUE_NAME = 'notifications';
const EMAIL_QUEUE_NAME = 'emails';

/**
 * Get or create RAG queue instance
 */
export const getRAGQueue = () => {
  const connection = getQueueConnection();
  if (!connection) return null;
  
  return new Queue(RAG_QUEUE_NAME, { 
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  });
};

/**
 * Get or create notification queue instance
 */
export const getNotificationQueue = () => {
  const connection = getQueueConnection();
  if (!connection) return null;
  
  return new Queue(NOTIFICATION_QUEUE_NAME, { 
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    },
  });
};

/**
 * Get or create email queue instance
 */
export const getEmailQueue = () => {
  const connection = getQueueConnection();
  if (!connection) return null;
  
  return new Queue(EMAIL_QUEUE_NAME, { 
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
    },
  });
};

/**
 * Close all queue connections
 */
export const closeQueues = async () => {
  const queues = [getRAGQueue(), getNotificationQueue(), getEmailQueue()];
  await Promise.all(queues.map(async (queue) => {
    if (queue) await queue.close();
  }));
};

export default {
  getRAGQueue,
  getNotificationQueue,
  getEmailQueue,
  closeQueues,
};
