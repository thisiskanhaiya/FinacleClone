import { defineStore } from 'pinia';
import { OPERATIONS } from '../data/operationSpecifications/operations.js';
import { searchOperations } from '../services/operationSearchService.js';
import { localStorageAdapter } from '../repositories/index.js';

const RECENTS_KEY = 'ui:recentOperations';
const FAVOURITES_KEY = 'ui:favouriteOperations';
const MAX_RECENTS = 8;

function readList(key) {
  return localStorageAdapter.get(key) ?? [];
}

export const useOperationStore = defineStore('operations', {
  state: () => ({
    registry: OPERATIONS,
    recentCodes: readList(RECENTS_KEY),
    favouriteCodes: readList(FAVOURITES_KEY),
  }),
  getters: {
    recentOperations: (state) =>
      state.recentCodes.map((c) => state.registry.find((o) => o.code === c)).filter(Boolean),
    favouriteOperations: (state) =>
      state.favouriteCodes.map((c) => state.registry.find((o) => o.code === c)).filter(Boolean),
  },
  actions: {
    search(query, role, options) {
      return searchOperations(query, role, options);
    },
    recordLaunch(code) {
      this.recentCodes = [code, ...this.recentCodes.filter((c) => c !== code)].slice(0, MAX_RECENTS);
      localStorageAdapter.set(RECENTS_KEY, this.recentCodes);
    },
    toggleFavourite(code) {
      if (this.favouriteCodes.includes(code)) {
        this.favouriteCodes = this.favouriteCodes.filter((c) => c !== code);
      } else {
        this.favouriteCodes = [code, ...this.favouriteCodes];
      }
      localStorageAdapter.set(FAVOURITES_KEY, this.favouriteCodes);
    },
  },
});
