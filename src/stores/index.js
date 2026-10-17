import { createPinia } from 'pinia';

/** Shared Pinia instance so router guards can use stores outside components. */
export const pinia = createPinia();
