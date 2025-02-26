import { action, computed, observable, makeObservable, runInAction, autorun } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
// types
import { RootStore } from "store/root.store";
import { TProjectDisplayFilters, TProjectFilters } from "@plane/types";

export interface IProjectFilterStore {
  // observables
  displayFilters: Record<string, TProjectDisplayFilters>;
  filters: Record<string, TProjectFilters>;
  searchQuery: string;
  // computed
  currentWorkspaceDisplayFilters: TProjectDisplayFilters | undefined;
  currentWorkspaceFilters: TProjectFilters | undefined;
  // computed functions
  getDisplayFiltersByWorkspaceSlug: (workspaceSlug: string) => TProjectDisplayFilters | undefined;
  getFiltersByWorkspaceSlug: (workspaceSlug: string) => TProjectFilters | undefined;
  // actions
  updateDisplayFilters: (workspaceSlug: string, displayFilters: TProjectDisplayFilters) => void;
  updateFilters: (workspaceSlug: string, filters: TProjectFilters) => void;
  updateSearchQuery: (query: string) => void;
  clearAllFilters: (workspaceSlug: string) => void;
}

export class ProjectFilterStore implements IProjectFilterStore {
  // observables
  displayFilters: Record<string, TProjectDisplayFilters> = {};
  filters: Record<string, TProjectFilters> = {};
  searchQuery: string = "";
  // root store
  rootStore: RootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      searchQuery: observable.ref,
      // computed
      currentWorkspaceDisplayFilters: computed,
      currentWorkspaceFilters: computed,
      // actions
      updateDisplayFilters: action,
      updateFilters: action,
      updateSearchQuery: action,
      clearAllFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // initialize display filters of the current workspace
    autorun(() => {
      const workspaceSlug = this.rootStore.app.router.workspaceSlug;
      if (!workspaceSlug) return;
      this.initWorkspaceFilters(workspaceSlug);
    });
  }

  /**
   * @description get display filters of the current workspace
   */
  get currentWorkspaceDisplayFilters() {
    const workspaceSlug = this.rootStore.app.router.workspaceSlug;
    if (!workspaceSlug) return;
    return this.displayFilters[workspaceSlug];
  }

  /**
   * @description get filters of the current workspace
   */
  get currentWorkspaceFilters() {
    const workspaceSlug = this.rootStore.app.router.workspaceSlug;
    if (!workspaceSlug) return;
    return this.filters[workspaceSlug];
  }

  /**
   * @description get display filters of a workspace by workspaceSlug
   * @param {string} workspaceSlug
   */
  getDisplayFiltersByWorkspaceSlug = computedFn((workspaceSlug: string) => this.displayFilters[workspaceSlug]);

  /**
   * @description get filters of a workspace by workspaceSlug
   * @param {string} workspaceSlug
   */
  getFiltersByWorkspaceSlug = computedFn((workspaceSlug: string) => this.filters[workspaceSlug]);

  /**
   * @description initialize display filters and filters of a workspace
   * @param {string} workspaceSlug
   */
  initWorkspaceFilters = (workspaceSlug: string) => {
    const displayFilters = this.getDisplayFiltersByWorkspaceSlug(workspaceSlug);
    runInAction(() => {
      this.displayFilters[workspaceSlug] = {
        order_by: displayFilters?.order_by || "created_at",
      };
      this.filters[workspaceSlug] = {};
    });
  };

  /**
   * @description update display filters of a workspace
   * @param {string} workspaceSlug
   * @param {TProjectDisplayFilters} displayFilters
   */
  updateDisplayFilters = (workspaceSlug: string, displayFilters: TProjectDisplayFilters) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, [workspaceSlug, key], displayFilters[key as keyof TProjectDisplayFilters]);
      });
    });
  };

  /**
   * @description update filters of a workspace
   * @param {string} workspaceSlug
   * @param {TProjectFilters} filters
   */
  updateFilters = (workspaceSlug: string, filters: TProjectFilters) => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, [workspaceSlug, key], filters[key as keyof TProjectFilters]);
      });
    });
  };

  /**
   * @description update search query
   * @param {string} query
   */
  updateSearchQuery = (query: string) => (this.searchQuery = query);

  /**
   * @description clear all filters of a workspace
   * @param {string} workspaceSlug
   */
  clearAllFilters = (workspaceSlug: string) => {
    runInAction(() => {
      this.filters[workspaceSlug] = {};
    });
  };
}
