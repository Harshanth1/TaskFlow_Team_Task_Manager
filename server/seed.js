/**
 * seed.js — Populate the Team Task Manager DB with rich sample data.
 * Run: node server/seed.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User    = require('./models/User');
const Team    = require('./models/Team');
const Project = require('./models/Project');
const Task    = require('./models/Task');

// ─── Credentials ────────────────────────────────────────────────────────────
const USERS = [
  // ── ADMINS ──────────────────────────────────────────────────────────────
  {
    name: 'Alice Morgan',
    email: 'alice@taskflow.dev',
    password: 'Admin@1234',
    role: 'admin',
    avatar: '',
  },
  {
    name: 'Bob Chen',
    email: 'bob@taskflow.dev',
    password: 'Admin@1234',
    role: 'admin',
    avatar: '',
  },
  // ── MEMBERS ─────────────────────────────────────────────────────────────
  {
    name: 'Carol Smith',
    email: 'carol@taskflow.dev',
    password: 'Member@1234',
    role: 'member',
    avatar: '',
  },
  {
    name: 'David Lee',
    email: 'david@taskflow.dev',
    password: 'Member@1234',
    role: 'member',
    avatar: '',
  },
  {
    name: 'Eva Patel',
    email: 'eva@taskflow.dev',
    password: 'Member@1234',
    role: 'member',
    avatar: '',
  },
  {
    name: 'Frank Torres',
    email: 'frank@taskflow.dev',
    password: 'Member@1234',
    role: 'member',
    avatar: '',
  },
  {
    name: 'Grace Kim',
    email: 'grace@taskflow.dev',
    password: 'Member@1234',
    role: 'member',
    avatar: '',
  },
];

// ─── Helper ──────────────────────────────────────────────────────────────────
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB');

    // ── 1. Wipe existing data ──────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
    ]);
    console.log('🗑️   Cleared existing data');

    // ── 2. Create users (password hashing handled by pre-save hook) ────────
    const createdUsers = await User.create(USERS);
    const byEmail = Object.fromEntries(createdUsers.map((u) => [u.email, u]));

    const alice = byEmail['alice@taskflow.dev'];
    const bob   = byEmail['bob@taskflow.dev'];
    const carol = byEmail['carol@taskflow.dev'];
    const david = byEmail['david@taskflow.dev'];
    const eva   = byEmail['eva@taskflow.dev'];
    const frank = byEmail['frank@taskflow.dev'];
    const grace = byEmail['grace@taskflow.dev'];
    console.log(`👤  Created ${createdUsers.length} users`);

    // ── 3. Create teams ────────────────────────────────────────────────────
    const [engineeringTeam, designTeam, marketingTeam] = await Team.create([
      {
        name: 'Engineering',
        owner: alice._id,
        members: [
          { user: alice._id,  role: 'admin'  },
          { user: carol._id,  role: 'member' },
          { user: david._id,  role: 'member' },
          { user: frank._id,  role: 'member' },
        ],
      },
      {
        name: 'Design',
        owner: bob._id,
        members: [
          { user: bob._id,   role: 'admin'  },
          { user: eva._id,   role: 'member' },
          { user: grace._id, role: 'member' },
        ],
      },
      {
        name: 'Marketing',
        owner: bob._id,
        members: [
          { user: bob._id,   role: 'admin'  },
          { user: carol._id, role: 'member' },
          { user: eva._id,   role: 'member' },
        ],
      },
    ]);
    console.log('👥  Created 3 teams');

    // ── 4. Create projects ─────────────────────────────────────────────────
    const [
      projectAlpha, projectBeta, projectGamma, projectDelta, projectEpsilon,
    ] = await Project.create([
      {
        name: 'Platform Redesign',
        description: 'Full redesign of the customer-facing platform with a modern SaaS aesthetic.',
        owner: alice._id,
        team: engineeringTeam._id,
        status: 'active',
        deadline: daysFromNow(30),
        color: '#667eea',
      },
      {
        name: 'API v2 Migration',
        description: 'Migrate all internal services to the new REST/GraphQL API v2 spec.',
        owner: alice._id,
        team: engineeringTeam._id,
        status: 'active',
        deadline: daysFromNow(45),
        color: '#f093fb',
      },
      {
        name: 'Brand Identity Refresh',
        description: 'Update logo, colour palette, typography, and design system tokens.',
        owner: bob._id,
        team: designTeam._id,
        status: 'active',
        deadline: daysFromNow(20),
        color: '#4facfe',
      },
      {
        name: 'Q3 Marketing Campaign',
        description: 'Plan and execute multi-channel marketing campaign for Q3 product launch.',
        owner: bob._id,
        team: marketingTeam._id,
        status: 'active',
        deadline: daysFromNow(60),
        color: '#43e97b',
      },
      {
        name: 'Mobile App MVP',
        description: 'Build and ship the first version of the iOS/Android companion app.',
        owner: alice._id,
        team: engineeringTeam._id,
        status: 'completed',
        deadline: daysFromNow(-5),
        color: '#fa709a',
      },
    ]);
    console.log('📁  Created 5 projects');

    // ── 5. Create tasks ────────────────────────────────────────────────────
    await Task.create([
      // ── Platform Redesign ─────────────────────────────────────────────
      {
        title: 'Audit current UI components',
        description: 'Catalog all existing components and identify deprecated patterns.',
        project: projectAlpha._id,
        assignee: carol._id,
        createdBy: alice._id,
        status: 'completed',
        priority: 'high',
        dueDate: daysFromNow(-10),
        tags: ['audit', 'ui'],
      },
      {
        title: 'Design new component library',
        description: 'Create Figma frames for every reusable component (buttons, inputs, cards, modals).',
        project: projectAlpha._id,
        assignee: eva._id,
        createdBy: alice._id,
        status: 'in-progress',
        priority: 'urgent',
        dueDate: daysFromNow(5),
        tags: ['design', 'figma'],
      },
      {
        title: 'Implement dark / light theme tokens',
        description: 'Map CSS variables for both themes and verify contrast ratios meet WCAG AA.',
        project: projectAlpha._id,
        assignee: carol._id,
        createdBy: alice._id,
        status: 'in-progress',
        priority: 'high',
        dueDate: daysFromNow(8),
        tags: ['css', 'accessibility'],
      },
      {
        title: 'Refactor navigation sidebar',
        description: 'Rebuild the sidebar to support collapsible groups and role-based menu items.',
        project: projectAlpha._id,
        assignee: david._id,
        createdBy: alice._id,
        status: 'todo',
        priority: 'medium',
        dueDate: daysFromNow(15),
        tags: ['react', 'nav'],
      },
      {
        title: 'Responsive layout for dashboard',
        description: 'Ensure all dashboard widgets render correctly on mobile, tablet, and desktop.',
        project: projectAlpha._id,
        assignee: frank._id,
        createdBy: alice._id,
        status: 'todo',
        priority: 'medium',
        dueDate: daysFromNow(20),
        tags: ['responsive', 'css'],
      },
      {
        title: 'Write unit tests for new components',
        description: 'Achieve ≥80 % coverage for all new UI components using Vitest + Testing Library.',
        project: projectAlpha._id,
        assignee: carol._id,
        createdBy: alice._id,
        status: 'todo',
        priority: 'low',
        dueDate: daysFromNow(28),
        tags: ['testing', 'vitest'],
      },

      // ── API v2 Migration ──────────────────────────────────────────────
      {
        title: 'Define OpenAPI spec for v2 endpoints',
        description: 'Draft the full OpenAPI 3.1 specification covering auth, users, projects, tasks.',
        project: projectBeta._id,
        assignee: david._id,
        createdBy: alice._id,
        status: 'completed',
        priority: 'urgent',
        dueDate: daysFromNow(-3),
        tags: ['api', 'openapi'],
      },
      {
        title: 'Migrate auth endpoints',
        description: 'Move /login, /register, /refresh to v2 with JWT rotation support.',
        project: projectBeta._id,
        assignee: frank._id,
        createdBy: alice._id,
        status: 'in-progress',
        priority: 'high',
        dueDate: daysFromNow(7),
        tags: ['auth', 'jwt'],
      },
      {
        title: 'Migrate projects & tasks endpoints',
        description: 'Update CRUD routes for projects and tasks to v2 schema.',
        project: projectBeta._id,
        assignee: carol._id,
        createdBy: alice._id,
        status: 'todo',
        priority: 'high',
        dueDate: daysFromNow(14),
        tags: ['backend', 'mongoose'],
      },
      {
        title: 'Integration tests for v2 API',
        description: 'Write end-to-end tests using Supertest against a test DB.',
        project: projectBeta._id,
        assignee: david._id,
        createdBy: alice._id,
        status: 'todo',
        priority: 'medium',
        dueDate: daysFromNow(30),
        tags: ['testing', 'supertest'],
      },
      {
        title: 'Update client SDK to v2',
        description: 'Regenerate and publish the TypeScript client SDK from the new OpenAPI spec.',
        project: projectBeta._id,
        assignee: frank._id,
        createdBy: alice._id,
        status: 'todo',
        priority: 'low',
        dueDate: daysFromNow(40),
        tags: ['sdk', 'typescript'],
      },

      // ── Brand Identity Refresh ────────────────────────────────────────
      {
        title: 'Competitor brand analysis',
        description: 'Analyse top 10 competitors\' visual identities and document findings.',
        project: projectGamma._id,
        assignee: grace._id,
        createdBy: bob._id,
        status: 'completed',
        priority: 'medium',
        dueDate: daysFromNow(-7),
        tags: ['research', 'brand'],
      },
      {
        title: 'Propose new colour palette',
        description: 'Create three palette options with primary, secondary, and neutral ramps.',
        project: projectGamma._id,
        assignee: eva._id,
        createdBy: bob._id,
        status: 'in-progress',
        priority: 'high',
        dueDate: daysFromNow(4),
        tags: ['design', 'colour'],
      },
      {
        title: 'Redesign logo',
        description: 'Produce 3 logo concepts; iterate on chosen direction to final vector assets.',
        project: projectGamma._id,
        assignee: grace._id,
        createdBy: bob._id,
        status: 'review',
        priority: 'urgent',
        dueDate: daysFromNow(10),
        tags: ['logo', 'vector'],
      },
      {
        title: 'Update typography scale',
        description: 'Select a new font pair and define the full type scale with CSS variables.',
        project: projectGamma._id,
        assignee: eva._id,
        createdBy: bob._id,
        status: 'todo',
        priority: 'medium',
        dueDate: daysFromNow(18),
        tags: ['typography', 'css'],
      },

      // ── Q3 Marketing Campaign ─────────────────────────────────────────
      {
        title: 'Define target audience segments',
        description: 'Use analytics and CRM data to identify and size the three primary segments.',
        project: projectDelta._id,
        assignee: carol._id,
        createdBy: bob._id,
        status: 'completed',
        priority: 'high',
        dueDate: daysFromNow(-2),
        tags: ['analytics', 'segmentation'],
      },
      {
        title: 'Write Q3 campaign brief',
        description: 'Summarise goals, KPIs, channels, timeline, and budget in a one-pager.',
        project: projectDelta._id,
        assignee: eva._id,
        createdBy: bob._id,
        status: 'in-progress',
        priority: 'high',
        dueDate: daysFromNow(6),
        tags: ['brief', 'strategy'],
      },
      {
        title: 'Design email templates',
        description: 'Create responsive HTML email templates for onboarding and feature announcements.',
        project: projectDelta._id,
        assignee: grace._id,
        createdBy: bob._id,
        status: 'todo',
        priority: 'medium',
        dueDate: daysFromNow(20),
        tags: ['email', 'html'],
      },
      {
        title: 'Schedule social media posts',
        description: 'Prepare 30-day content calendar and queue posts across LinkedIn, Twitter, Instagram.',
        project: projectDelta._id,
        assignee: carol._id,
        createdBy: bob._id,
        status: 'todo',
        priority: 'low',
        dueDate: daysFromNow(35),
        tags: ['social', 'content'],
      },

      // ── Mobile App MVP (completed project) ────────────────────────────
      {
        title: 'Set up React Native project',
        description: 'Initialise the Expo project, configure ESLint, Prettier, and CI pipeline.',
        project: projectEpsilon._id,
        assignee: frank._id,
        createdBy: alice._id,
        status: 'completed',
        priority: 'urgent',
        dueDate: daysFromNow(-30),
        tags: ['react-native', 'expo'],
      },
      {
        title: 'Implement auth flow (login / register)',
        description: 'Build screens for login, register, and password reset with form validation.',
        project: projectEpsilon._id,
        assignee: david._id,
        createdBy: alice._id,
        status: 'completed',
        priority: 'high',
        dueDate: daysFromNow(-20),
        tags: ['auth', 'mobile'],
      },
      {
        title: 'Task list screen',
        description: 'Build the main task list with filtering by status and priority.',
        project: projectEpsilon._id,
        assignee: carol._id,
        createdBy: alice._id,
        status: 'completed',
        priority: 'high',
        dueDate: daysFromNow(-12),
        tags: ['feature', 'mobile'],
      },
      {
        title: 'Push notifications',
        description: 'Integrate Expo Notifications for due-date reminders.',
        project: projectEpsilon._id,
        assignee: frank._id,
        createdBy: alice._id,
        status: 'completed',
        priority: 'medium',
        dueDate: daysFromNow(-8),
        tags: ['notifications', 'expo'],
      },
    ]);
    console.log('✅  Created 22 tasks');

    // ── 6. Print summary ───────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════');
    console.log('  🌱  SEED COMPLETE — Login Credentials');
    console.log('══════════════════════════════════════════════════');
    console.log('\n  ADMINS');
    console.log('  ─────────────────────────────────────────────');
    console.log('  Alice Morgan  |  alice@taskflow.dev  |  Admin@1234');
    console.log('  Bob Chen      |  bob@taskflow.dev    |  Admin@1234');
    console.log('\n  MEMBERS');
    console.log('  ─────────────────────────────────────────────');
    console.log('  Carol Smith   |  carol@taskflow.dev  |  Member@1234');
    console.log('  David Lee     |  david@taskflow.dev  |  Member@1234');
    console.log('  Eva Patel     |  eva@taskflow.dev    |  Member@1234');
    console.log('  Frank Torres  |  frank@taskflow.dev  |  Member@1234');
    console.log('  Grace Kim     |  grace@taskflow.dev  |  Member@1234');
    console.log('\n══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  }
}

seed();
