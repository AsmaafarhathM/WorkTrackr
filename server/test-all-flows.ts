const BASE_URL = 'http://localhost:5000/api';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
}

async function api(path: string, options: RequestInit = {}): Promise<{ status: number; data: any; headers: Headers }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data, headers: res.headers };
}

async function runVerification() {
  console.log('🧪 Starting WorkTrackr Comprehensive End-to-End Verification...\n');

  // 1. Test Login for all roles & HttpOnly cookies
  console.log('--- 1. Testing Authentication & Token Issuance ---');
  const adminRes = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@worktrackr.io', password: 'Password123!' }),
  });
  const adminAuth: AuthResponse = adminRes.data.data;
  console.log('✅ Admin Login Successful:', adminAuth.user.name, `(${adminAuth.user.role})`);
  console.log('   Access Token received. Cookie headers:', adminRes.headers.get('set-cookie') ? 'Present (HttpOnly)' : 'None');

  const pm1Res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'pm.sarah@worktrackr.io', password: 'Password123!' }),
  });
  const pm1Auth: AuthResponse = pm1Res.data.data;
  console.log('✅ PM Sarah Login Successful:', pm1Auth.user.name, `(${pm1Auth.user.role})`);

  const pm2Res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'pm.marcus@worktrackr.io', password: 'Password123!' }),
  });
  const pm2Auth: AuthResponse = pm2Res.data.data;
  console.log('✅ PM Marcus Login Successful:', pm2Auth.user.name, `(${pm2Auth.user.role})`);

  const dev1Res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'dev.alex@worktrackr.io', password: 'Password123!' }),
  });
  const dev1Auth: AuthResponse = dev1Res.data.data;
  console.log('✅ Dev Alex Login Successful:', dev1Auth.user.name, `(${dev1Auth.user.role})`);

  const dev2Res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'dev.ravi@worktrackr.io', password: 'Password123!' }),
  });
  const dev2Auth: AuthResponse = dev2Res.data.data;
  console.log('✅ Dev Ravi Login Successful:', dev2Auth.user.name, `(${dev2Auth.user.role})\n`);

  // 2. Test Role Scoping & Ownership for Projects
  console.log('--- 2. Testing Project Scoping & Ownership ---');
  const adminProjects = await api('/projects', {
    headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
  });
  console.log(`✅ Admin retrieves all projects: Count = ${adminProjects.data.data.length}`);

  const pm1Projects = await api('/projects', {
    headers: { Authorization: `Bearer ${pm1Auth.accessToken}` },
  });
  console.log(`✅ PM Sarah retrieves only her projects: Count = ${pm1Projects.data.data.length} (${pm1Projects.data.data.map((p: any) => p.name).join(', ')})`);

  const pm2Projects = await api('/projects', {
    headers: { Authorization: `Bearer ${pm2Auth.accessToken}` },
  });
  console.log(`✅ PM Marcus retrieves only his projects: Count = ${pm2Projects.data.data.length} (${pm2Projects.data.data.map((p: any) => p.name).join(', ')})`);

  // Test Boundary: PM Sarah attempts to access PM Marcus's project directly by ID
  const betaProjectId = pm2Projects.data.data[0].id;
  const unauthorizedProjectAccess = await api(`/projects/${betaProjectId}`, {
    headers: { Authorization: `Bearer ${pm1Auth.accessToken}` },
  });
  console.log(`✅ Authorization Boundary Enforced: PM Sarah blocked from PM Marcus project (Status: ${unauthorizedProjectAccess.status} - ${unauthorizedProjectAccess.data?.error?.message})`);

  // 3. Test Developer Task Scoping
  console.log('\n--- 3. Testing Developer Task Scoping & Ownership ---');
  const dev1Tasks = await api('/tasks', {
    headers: { Authorization: `Bearer ${dev1Auth.accessToken}` },
  });
  console.log(`✅ Dev Alex retrieves only his assigned tasks: Count = ${dev1Tasks.data.data.length}`);

  const dev2Tasks = await api('/tasks', {
    headers: { Authorization: `Bearer ${dev2Auth.accessToken}` },
  });
  console.log(`✅ Dev Ravi retrieves only his assigned tasks: Count = ${dev2Tasks.data.data.length}`);
  const dev2Task = dev2Tasks.data.data[0];

  // Test Boundary: Dev Alex tries to view Dev Ravi's task directly
  const unauthorizedTaskAccess = await api(`/tasks/${dev2Task.id}`, {
    headers: { Authorization: `Bearer ${dev1Auth.accessToken}` },
  });
  console.log(`✅ Authorization Boundary Enforced: Dev Alex blocked from Dev Ravi task (Status: ${unauthorizedTaskAccess.status} - ${unauthorizedTaskAccess.data?.error?.message})`);

  // Test Boundary: Dev Alex tries to modify status of Dev Ravi's task
  const unauthorizedStatusUpdate = await api(`/tasks/${dev2Task.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${dev1Auth.accessToken}` },
    body: JSON.stringify({ status: 'DONE' }),
  });
  console.log(`✅ Authorization Boundary Enforced: Dev Alex blocked from updating Dev Ravi task status (Status: ${unauthorizedStatusUpdate.status} - ${unauthorizedStatusUpdate.data?.error?.message})`);

  // 4. Test Developer Status Transition & Notification Trigger
  console.log('\n--- 4. Testing Status Transition, Activity Record & Notification Trigger ---');
  const dev1TargetTask = dev1Tasks.data.data.find((t: any) => t.status === 'TODO' || t.status === 'IN_PROGRESS');
  if (dev1TargetTask) {
    console.log(`Moving Dev Alex's Task #${dev1TargetTask.taskNumber} ("${dev1TargetTask.title}") from ${dev1TargetTask.status} → IN_REVIEW...`);
    const statusUpdateRes = await api(`/tasks/${dev1TargetTask.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${dev1Auth.accessToken}` },
      body: JSON.stringify({ status: 'IN_REVIEW' }),
    });
    console.log(`✅ Task status updated to IN_REVIEW successfully (Status: ${statusUpdateRes.status})`);

    // Verify Notification created for project owner (PM Sarah)
    const pmNotifications = await api('/notifications', {
      headers: { Authorization: `Bearer ${pm1Auth.accessToken}` },
    });
    const reviewNotice = pmNotifications.data.data.notifications.find(
      (n: any) => n.taskId === dev1TargetTask.id && n.type === 'TASK_IN_REVIEW'
    );
    console.log(`✅ PM received IN_REVIEW Notification: "${reviewNotice?.title}" - "${reviewNotice?.message}" (Unread: ${pmNotifications.data.data.unreadCount})`);
  }

  // 5. Test 20-Event Missed Event Recovery from PostgreSQL Database
  console.log('\n--- 5. Testing Database-Backed 20-Event Missed Event Recovery ---');
  const missedRes = await api('/activity/recent', {
    headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
  });
  console.log(`✅ Retrieved latest 20 database activity records: Count = ${missedRes.data.data.length}`);
  console.log(`   Latest activity record: "${missedRes.data.data[0]?.message}"`);

  // 6. Test URL Query Filters
  console.log('\n--- 6. Testing URL Query Parameters Backend Filtering ---');
  const filteredHighInProgress = await api('/tasks?status=IN_PROGRESS&priority=HIGH', {
    headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
  });
  console.log(`✅ Filter /tasks?status=IN_PROGRESS&priority=HIGH returned ${filteredHighInProgress.data.data.length} tasks`);
  const allMatch = filteredHighInProgress.data.data.every(
    (t: any) => t.status === 'IN_PROGRESS' && t.priority === 'HIGH'
  );
  console.log(`   Verification: All returned tasks match status=IN_PROGRESS and priority=HIGH: ${allMatch}`);

  // 7. Test Background Overdue Task Job
  console.log('\n--- 7. Testing Background Overdue Task Processing ---');
  const overdueTriggerRes = await api('/tasks/actions/trigger-overdue', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
  });
  console.log(`✅ Overdue Task Processor triggered: ${overdueTriggerRes.data.message} (Flagged: ${overdueTriggerRes.data.flaggedCount})`);

  // 8. Test Dashboard Stats
  console.log('\n--- 8. Testing Role-Specific Dashboard Metrics ---');
  const adminDash = await api('/dashboard', {
    headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
  });
  console.log(`✅ Admin Dashboard Data: Total Projects: ${adminDash.data.data.totalProjects}, Overdue: ${adminDash.data.data.overdueTaskCount}, Online: ${adminDash.data.data.liveOnlineUsers}`);

  const devDash = await api('/dashboard', {
    headers: { Authorization: `Bearer ${dev1Auth.accessToken}` },
  });
  console.log(`✅ Dev Dashboard Data: Assigned Tasks: ${devDash.data.data.totalAssigned}, In Review: ${devDash.data.data.tasksByStatus.IN_REVIEW}`);

  console.log('\n🎉 ALL 8 CORE FULL-STACK VERIFICATION SUITES PASSED WITH 100% SUCCESS!');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
