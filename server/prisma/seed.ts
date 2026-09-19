import { PrismaClient, Role, TaskStatus, TaskPriority, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users (1 Admin, 2 PMs, 4 Developers)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@worktrackr.io',
      name: 'Arthur Admin',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const pmSarah = await prisma.user.create({
    data: {
      email: 'pm.sarah@worktrackr.io',
      name: 'Sarah Jenkins',
      password: passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const pmMarcus = await prisma.user.create({
    data: {
      email: 'pm.marcus@worktrackr.io',
      name: 'Marcus Vance',
      password: passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const devAlex = await prisma.user.create({
    data: {
      email: 'dev.alex@worktrackr.io',
      name: 'Alex Rivera',
      password: passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const devElena = await prisma.user.create({
    data: {
      email: 'dev.elena@worktrackr.io',
      name: 'Elena Rostova',
      password: passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const devRavi = await prisma.user.create({
    data: {
      email: 'dev.ravi@worktrackr.io',
      name: 'Ravi Patel',
      password: passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const devPriya = await prisma.user.create({
    data: {
      email: 'dev.priya@worktrackr.io',
      name: 'Priya Sharma',
      password: passwordHash,
      role: Role.DEVELOPER,
    },
  });

  console.log('✅ Users seeded successfully');

  // 2. Seed Clients
  const clientAcme = await prisma.client.create({
    data: {
      name: 'Acme Corporation',
      email: 'contact@acmecorp.com',
      company: 'Acme Enterprise Solutions',
    },
  });

  const clientGlobex = await prisma.client.create({
    data: {
      name: 'Globex Robotics',
      email: 'ops@globexrobotics.com',
      company: 'Globex Heavy Industries',
    },
  });

  const clientStark = await prisma.client.create({
    data: {
      name: 'Stark Media Group',
      email: 'digital@starkmedia.io',
      company: 'Stark Digital Innovations',
    },
  });

  console.log('✅ Clients seeded successfully');

  // 3. Seed Projects (3 projects: Project Alpha & Gamma for PM Sarah, Project Beta for PM Marcus)
  const projectAlpha = await prisma.project.create({
    data: {
      name: 'Fintech Cloud Migration',
      description: 'Migrating monolithic core banking services to cloud-native microservices.',
      clientId: clientAcme.id,
      ownerId: pmSarah.id,
    },
  });

  const projectBeta = await prisma.project.create({
    data: {
      name: 'Automated Logistics Platform',
      description: 'Real-time telemetry and warehouse autonomous drone fleet coordination portal.',
      clientId: clientGlobex.id,
      ownerId: pmMarcus.id,
    },
  });

  const projectGamma = await prisma.project.create({
    data: {
      name: 'OmniChannel Streaming Hub',
      description: 'Next-gen dynamic ad insertion and 4K ultra-low-latency streaming engine.',
      clientId: clientStark.id,
      ownerId: pmSarah.id,
    },
  });

  console.log('✅ Projects seeded successfully');

  const now = new Date();
  const past5Days = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const past2Days = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const future2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const future5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const future10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // 4. Seed Tasks (5+ tasks per project = 18 total tasks)
  // Project Alpha (Fintech Cloud Migration - PM Sarah)
  const taskA1 = await prisma.task.create({
    data: {
      title: 'Database Schema Partitioning & Sharding',
      description: 'Configure Citus postgres partition tables for high-frequency ledger events.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: past5Days,
      isOverdue: true, // OVERDUE TASK #1
      projectId: projectAlpha.id,
      assignedToId: devAlex.id,
    },
  });

  const taskA2 = await prisma.task.create({
    data: {
      title: 'OAuth2 & OIDC Security Audit',
      description: 'Verify token expiration, PKCE code challenge flow, and key rotation.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: future2Days,
      isOverdue: false,
      projectId: projectAlpha.id,
      assignedToId: devRavi.id,
    },
  });

  const taskA3 = await prisma.task.create({
    data: {
      title: 'Setup Kubernetes Ingress & TLS Termination',
      description: 'Deploy Cert-Manager with Let\'s Encrypt automatic TLS renewal for staging cluster.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: past2Days,
      isOverdue: false,
      projectId: projectAlpha.id,
      assignedToId: devElena.id,
    },
  });

  const taskA4 = await prisma.task.create({
    data: {
      title: 'Kafka Event Streaming Consumer Deadlock Fix',
      description: 'Resolve consumer group partition rebalance deadlocks during node restarts.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: future5Days,
      isOverdue: false,
      projectId: projectAlpha.id,
      assignedToId: devAlex.id,
    },
  });

  const taskA5 = await prisma.task.create({
    data: {
      title: 'Payment Gateway Webhook Idempotency Layer',
      description: 'Add Redis distributed lock and idempotency keys on Stripe webhook listeners.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: future10Days,
      isOverdue: false,
      projectId: projectAlpha.id,
      assignedToId: devPriya.id,
    },
  });

  const taskA6 = await prisma.task.create({
    data: {
      title: 'Load Testing with k6 (10,000 req/sec)',
      description: 'Benchmark checkout and transaction endpoints under heavy stress.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.LOW,
      dueDate: future5Days,
      isOverdue: false,
      projectId: projectAlpha.id,
      assignedToId: devRavi.id,
    },
  });

  // Project Beta (Automated Logistics Platform - PM Marcus)
  const taskB1 = await prisma.task.create({
    data: {
      title: 'Drone Telemetry MQTT Broker Optimization',
      description: 'Scale EMQX broker cluster to sustain 50,000 concurrent ping packets.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: past2Days,
      isOverdue: true, // OVERDUE TASK #2
      projectId: projectBeta.id,
      assignedToId: devElena.id,
    },
  });

  const taskB2 = await prisma.task.create({
    data: {
      title: 'Warehouse Geofencing Boundary Engine',
      description: 'Implement Turf.js ray-casting algorithm to detect zone violations in <5ms.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: future2Days,
      isOverdue: false,
      projectId: projectBeta.id,
      assignedToId: devPriya.id,
    },
  });

  const taskB3 = await prisma.task.create({
    data: {
      title: 'Battery Health Predictive Diagnostics ML Pipeline',
      description: 'Train regression model on drone LiPo voltage drop curve over 200 cycles.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: future5Days,
      isOverdue: false,
      projectId: projectBeta.id,
      assignedToId: devElena.id,
    },
  });

  const taskB4 = await prisma.task.create({
    data: {
      title: 'Barcode Scanner Handheld BLE Integration',
      description: 'WebBluetooth API client interface for Zebra ruggedized scanners.',
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: past5Days,
      isOverdue: false,
      projectId: projectBeta.id,
      assignedToId: devAlex.id,
    },
  });

  const taskB5 = await prisma.task.create({
    data: {
      title: 'Emergency Flight Termination Subsystem',
      description: 'Failsafe hardware cut-off trigger protocol validation and watchdog.',
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      dueDate: future10Days,
      isOverdue: false,
      projectId: projectBeta.id,
      assignedToId: devPriya.id,
    },
  });

  const taskB6 = await prisma.task.create({
    data: {
      title: 'Fleet Dispatch Routing Optimization Algorithm',
      description: 'A* pathfinding with collision avoidance on 3D warehouse airspace.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: future2Days,
      isOverdue: false,
      projectId: projectBeta.id,
      assignedToId: devRavi.id,
    },
  });

  // Project Gamma (OmniChannel Streaming Hub - PM Sarah)
  const taskG1 = await prisma.task.create({
    data: {
      title: 'HLS / MPEG-DASH Transmuxing Worker',
      description: 'FFmpeg pipeline for dynamic ABR (Adaptive Bitrate) packaging.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: future5Days,
      isOverdue: false,
      projectId: projectGamma.id,
      assignedToId: devRavi.id,
    },
  });

  const taskG2 = await prisma.task.create({
    data: {
      title: 'Server-Side Dynamic Ad Insertion (SSAI)',
      description: 'SCTE-35 cue marker detection and seamless VAST/VMAP ad stitcher.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: future2Days,
      isOverdue: false,
      projectId: projectGamma.id,
      assignedToId: devElena.id,
    },
  });

  const taskG3 = await prisma.task.create({
    data: {
      title: 'Edge CDN Tokenized URL Signing',
      description: 'HMAC-SHA256 authenticated short-lived playback URLs via Cloudflare Workers.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: past5Days,
      isOverdue: false,
      projectId: projectGamma.id,
      assignedToId: devPriya.id,
    },
  });

  const taskG4 = await prisma.task.create({
    data: {
      title: 'Live Chat Anti-Spam Machine Learning Filter',
      description: 'Real-time text moderation model with sentiment analysis and rate-limiting.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: future10Days,
      isOverdue: false,
      projectId: projectGamma.id,
      assignedToId: devAlex.id,
    },
  });

  const taskG5 = await prisma.task.create({
    data: {
      title: 'QoE Telemetry Collector & Buffering Heatmap',
      description: 'Collect bitrates, frame drops, and re-buffering metrics from player clients.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: future5Days,
      isOverdue: false,
      projectId: projectGamma.id,
      assignedToId: devElena.id,
    },
  });

  const taskG6 = await prisma.task.create({
    data: {
      title: 'Subtitles & Closed Captions WebVTT Sync Engine',
      description: 'Multi-lingual live speech-to-text transcript alignment with audio drift compensation.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: future2Days,
      isOverdue: false,
      projectId: projectGamma.id,
      assignedToId: devPriya.id,
    },
  });

  console.log('✅ Tasks seeded successfully (18 tasks across 3 projects, 2 overdue)');

  // 5. Seed Pre-existing Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: devElena.id,
        taskId: taskA3.id,
        projectId: projectAlpha.id,
        action: 'STATUS_CHANGE',
        details: { fromStatus: 'IN_REVIEW', toStatus: 'DONE', taskTitle: taskA3.title },
        message: `${devElena.name} moved Task #${taskA3.taskNumber} from In Review → Done`,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        userId: devRavi.id,
        taskId: taskA2.id,
        projectId: projectAlpha.id,
        action: 'STATUS_CHANGE',
        details: { fromStatus: 'IN_PROGRESS', toStatus: 'IN_REVIEW', taskTitle: taskA2.title },
        message: `${devRavi.name} moved Task #${taskA2.taskNumber} from In Progress → In Review`,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userId: devElena.id,
        taskId: taskB1.id,
        projectId: projectBeta.id,
        action: 'STATUS_CHANGE',
        details: { fromStatus: 'TODO', toStatus: 'IN_PROGRESS', taskTitle: taskB1.title },
        message: `${devElena.name} moved Task #${taskB1.taskNumber} from Todo → In Progress`,
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        userId: devPriya.id,
        taskId: taskB2.id,
        projectId: projectBeta.id,
        action: 'STATUS_CHANGE',
        details: { fromStatus: 'IN_PROGRESS', toStatus: 'IN_REVIEW', taskTitle: taskB2.title },
        message: `${devPriya.name} moved Task #${taskB2.taskNumber} from In Progress → In Review`,
        createdAt: new Date(now.getTime() - 90 * 60 * 1000),
      },
      {
        userId: devAlex.id,
        taskId: taskB4.id,
        projectId: projectBeta.id,
        action: 'STATUS_CHANGE',
        details: { fromStatus: 'IN_REVIEW', toStatus: 'DONE', taskTitle: taskB4.title },
        message: `${devAlex.name} moved Task #${taskB4.taskNumber} from In Review → Done`,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        userId: devElena.id,
        taskId: taskG2.id,
        projectId: projectGamma.id,
        action: 'STATUS_CHANGE',
        details: { fromStatus: 'IN_PROGRESS', toStatus: 'IN_REVIEW', taskTitle: taskG2.title },
        message: `${devElena.name} moved Task #${taskG2.taskNumber} from In Progress → In Review`,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        userId: devAlex.id,
        taskId: taskA1.id,
        projectId: projectAlpha.id,
        action: 'STATUS_CHANGE',
        details: { fromStatus: 'TODO', toStatus: 'IN_PROGRESS', taskTitle: taskA1.title },
        message: `${devAlex.name} moved Task #${taskA1.taskNumber} from Todo → In Progress`,
        createdAt: new Date(now.getTime() - 10 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Activity logs seeded successfully');

  // 6. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: devRavi.id,
        taskId: taskA2.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: `You have been assigned to "${taskA2.title}" in Fintech Cloud Migration.`,
        isRead: false,
        createdAt: new Date(now.getTime() - 120 * 60 * 1000),
      },
      {
        userId: pmSarah.id,
        taskId: taskA2.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: 'Task Submitted for Review',
        message: `Ravi Patel moved "${taskA2.title}" to IN_REVIEW.`,
        isRead: false,
        createdAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
      {
        userId: pmMarcus.id,
        taskId: taskB2.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: 'Task Submitted for Review',
        message: `Priya Sharma moved "${taskB2.title}" to IN_REVIEW.`,
        isRead: false,
        createdAt: new Date(now.getTime() - 90 * 60 * 1000),
      },
      {
        userId: devElena.id,
        taskId: taskB1.id,
        type: NotificationType.TASK_OVERDUE,
        title: 'Task Overdue Alert',
        message: `Task "${taskB1.title}" is past due date!`,
        isRead: true,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Notifications seeded successfully');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
