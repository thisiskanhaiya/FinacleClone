<template>
  <div v-if="operation">
    <component :is="screenComponent" v-if="screenComponent" :operation="operation" />
    <OperationPlaceholder v-else :operation="operation" />
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { getOperation } from '../../data/operationSpecifications/operations.js';
import { useOperationStore } from '../../stores/operationStore.js';
import { useEnvironmentStore } from '../../stores/environmentStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { recordAudit } from '../../services/auditService.js';
import { AUDIT_ACTIONS } from '../../domain/enums/auditActions.js';
import OperationPlaceholder from '../../components/operation/OperationPlaceholder.vue';
import AuditInquiryView from './enquiries/AuditInquiryView.vue';
import AuthorisationQueueView from './authorisation/AuthorisationQueueView.vue';
import DemoUsersView from './administration/DemoUsersView.vue';
import ResetDataView from './administration/ResetDataView.vue';
import CreateCifView from './customer/CreateCifView.vue';
import ModifyCustomerView from './customer/ModifyCustomerView.vue';
import Customer360View from './customer/Customer360View.vue';
import OpenAccountView from './accounts/OpenAccountView.vue';
import AccountInquiryView from './accounts/AccountInquiryView.vue';

/**
 * OperationHostView - single entry point for every registry operation.
 * Route guards have already enforced role permission before this renders.
 * Phase 1 maps the operations whose screens exist; all others render an
 * honest placeholder carrying the operation's identity and delivery phase.
 */
const OPERATION_SCREENS = {
  'ENQ-AUDIT-001': AuditInquiryView,
  'AUT-QUEUE-001': AuthorisationQueueView,
  'ADMIN-USERS-001': DemoUsersView,
  'ADMIN-RESET-001': ResetDataView,
  'CIF-CREATE-001': CreateCifView,
  'CIF-CORP-001': CreateCifView,
  'CIF-MODIFY-001': ModifyCustomerView,
  'CIF-INQUIRY-001': Customer360View,
  'ACCT-SAV-OPEN-001': OpenAccountView,
  'ACCT-CUR-OPEN-001': OpenAccountView,
  'ACCT-INQUIRY-001': AccountInquiryView,
};

const route = useRoute();
const operationStore = useOperationStore();
const environment = useEnvironmentStore();
const auth = useAuthStore();

const operation = computed(() => getOperation(String(route.params.code ?? '').toUpperCase()));
const screenComponent = computed(() =>
  operation.value ? OPERATION_SCREENS[operation.value.code] ?? null : null,
);

watchEffect(() => {
  if (!operation.value) return;
  environment.setCurrentOperation(operation.value.code);
  operationStore.recordLaunch(operation.value.code);
  recordAudit({
    action: AUDIT_ACTIONS.OPERATION_LAUNCH,
    entityType: 'OPERATION',
    entityId: operation.value.code,
    performedBy: auth.username ?? 'UNKNOWN',
    performedByRole: auth.role,
    branch: auth.branch,
    details: { module: operation.value.module, implemented: Boolean(screenComponent.value) },
  });
});
</script>
