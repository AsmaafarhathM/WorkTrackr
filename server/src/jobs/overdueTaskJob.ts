import cron from 'node-cron';
import { TaskStatus, NotificationType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { emitActivityCreated, emitNotificationCreated, emitNotificationCount } from '../websocket/socketServer';

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Core business logic that detects overdue tasks past their due date
 * and updates them to isOverdue: true in PostgreSQL.
 */
export const runOverdueTaskCheck = async (): Promise<number> => {
  const now = new Date();

  // Find all tasks that are past due date, not DONE, and not yet flagged as overdue
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { not: TaskStatus.DONE },
      dueDate: { lt: now },
      isOverdue: false,
    },
    include: {
      project: {
        select: { id: true, name: true, ownerId: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (overdueTasks.length === 0) {
    logger.debug('Overdue check completed: No new overdue tasks detected.');
    return 0;
  }

  logger.info(`Detected ${overdueTasks.length} task(s) past due date. Flagging as overdue...`);

  let newlyFlaggedCount = 0;

  for (const task of overdueTasks) {
    try {
      // 1. Flag task as overdue in database
      await prisma.task.update({
        where: { id: task.id },
        data: { isOverdue: true },
      });

      // 2. Create an activity log record for traceability
      const systemAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (systemAdmin) {
        const activity = await prisma.activityLog.create({
          data: {
            userId: systemAdmin.id,
            taskId: task.id,
            projectId: task.projectId,
            action: 'TASK_OVERDUE',
            details: {
              taskTitle: task.title,
              dueDate: task.dueDate,
            },
            message: `Task #${task.taskNumber} ("${task.title}") was flagged as Overdue`,
          },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            task: { select: { id: true, taskNumber: true, title: true, status: true, assignedToId: true } },
            project: { select: { id: true, name: true, ownerId: true } },
          },
        });

        // Emit real-time activity to authorized listeners
        emitActivityCreated(activity, task.project.ownerId, task.assignedToId);
      }

      // 3. Create persistent notifications for Project Manager & Assigned Developer
      // Notify Project Manager
      const pmNotification = await prisma.notification.create({
        data: {
          userId: task.project.ownerId,
          taskId: task.id,
          type: NotificationType.TASK_OVERDUE,
          title: 'Task Overdue Alert',
          message: `Task #${task.taskNumber} ("${task.title}") in "${task.project.name}" is past due!`,
        },
      });
      emitNotificationCreated(task.project.ownerId, pmNotification);
      const pmUnread = await prisma.notification.count({
        where: { userId: task.project.ownerId, isRead: false },
      });
      emitNotificationCount(task.project.ownerId, pmUnread);

      // Notify Developer if assigned
      if (task.assignedToId && task.assignedToId !== task.project.ownerId) {
        const devNotification = await prisma.notification.create({
          data: {
            userId: task.assignedToId,
            taskId: task.id,
            type: NotificationType.TASK_OVERDUE,
            title: 'Task Overdue Alert',
            message: `Task #${task.taskNumber} ("${task.title}") assigned to you is past due!`,
          },
        });
        emitNotificationCreated(task.assignedToId, devNotification);
        const devUnread = await prisma.notification.count({
          where: { userId: task.assignedToId, isRead: false },
        });
        emitNotificationCount(task.assignedToId, devUnread);
      }

      newlyFlaggedCount++;
    } catch (err: any) {
      logger.error(`Failed to process overdue task ${task.id}:`, err);
    }
  }

  logger.info(`Successfully flagged ${newlyFlaggedCount} task(s) as overdue.`);
  return newlyFlaggedCount;
};

/**
 * Initializes and starts the background cron job.
 * Runs every minute to monitor overdue deadlines.
 */
export const startOverdueTaskJob = () => {
  if (scheduledTask) {
    logger.warn('Overdue task background job is already running.');
    return;
  }

  // Run every minute: "* * * * *"
  scheduledTask = cron.schedule('* * * * *', async () => {
    try {
      await runOverdueTaskCheck();
    } catch (error) {
      logger.error('Error during scheduled overdue task background processing:', error);
    }
  });

  logger.info('⏱️ Overdue task cron job scheduled (Runs every minute).');
};

export const stopOverdueTaskJob = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Overdue task cron job stopped.');
  }
};
