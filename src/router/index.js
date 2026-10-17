import { createRouter, createWebHistory } from 'vue-router';
import { pinia } from '../stores/index.js';
import { useAuthStore } from '../stores/authStore.js';
import { decideNavigation } from './guards.js';
import { recordAudit } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { ROLES } from '../domain/enums/roles.js';

import AuthLayout from '../layouts/AuthLayout.vue';
import SimulatorLayout from '../layouts/SimulatorLayout.vue';
import TrainingLayout from '../layouts/TrainingLayout.vue';

import LoginView from '../views/auth/LoginView.vue';
import AboutView from '../views/auth/AboutView.vue';
import ForbiddenView from '../views/errors/ForbiddenView.vue';
import NotFoundView from '../views/errors/NotFoundView.vue';
import DashboardView from '../views/simulator/dashboard/DashboardView.vue';
import ModuleOperationsView from '../views/simulator/ModuleOperationsView.vue';
import OperationHostView from '../views/simulator/OperationHostView.vue';
import AdminDashboardView from '../views/simulator/administration/AdminDashboardView.vue';
import CatalogueView from '../views/training/catalogue/CatalogueView.vue';
import OperationGuideView from '../views/training/operationGuide/OperationGuideView.vue';

const routes = [
  {
    path: '/',
    redirect: '/simulator',
  },
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: 'login', name: 'login', component: LoginView, meta: { public: true, title: 'Sign In' } },
      { path: 'about', name: 'about', component: AboutView, meta: { public: true, title: 'About' } },
    ],
  },
  {
    path: '/simulator',
    component: SimulatorLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
      {
        path: 'modules/:module',
        name: 'module-operations',
        component: ModuleOperationsView,
        meta: { title: 'Module Operations' },
      },
      {
        path: 'operations/:code',
        name: 'sim-operation',
        component: OperationHostView,
        meta: { title: 'Operation', dynamicOperation: true },
      },
      {
        path: 'admin',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: { title: 'Administration', roles: [ROLES.SYSTEM_ADMIN] },
      },
      { path: '403', name: 'forbidden', component: ForbiddenView, meta: { title: 'Not Authorised' } },
    ],
  },
  {
    path: '/training',
    component: TrainingLayout,
    children: [
      { path: '', name: 'training-catalogue', component: CatalogueView, meta: { title: 'Bank Operations Workbook' } },
      {
        path: 'operations/:code',
        name: 'training-operation',
        component: OperationGuideView,
        meta: { title: 'Operation Guide' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { public: true, title: 'Not Found' } },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia);
  await auth.restore();

  const decision = decideNavigation(to, auth.session);

  switch (decision.action) {
    case 'allow':
      return true;
    case 'login':
      return { name: 'login', query: { redirect: decision.redirect } };
    case 'notfound':
      return { name: 'not-found' };
    case 'forbidden':
      // Service-level denial is audited (fire-and-forget; never blocks UX).
      recordAudit({
        action: AUDIT_ACTIONS.ROUTE_DENIED,
        entityType: 'OPERATION',
        entityId: decision.operationCode ?? to.fullPath,
        performedBy: auth.username,
        performedByRole: auth.role,
        branch: auth.branch,
        result: 'FAILURE',
        details: { reason: decision.reason, path: to.fullPath },
      });
      return { name: 'forbidden', query: { from: to.fullPath } };
    default:
      return true;
  }
});

router.afterEach((to) => {
  document.title = to.meta?.title
    ? `${to.meta.title} - Core Banking Training Environment`
    : 'Core Banking Training Environment';
});
