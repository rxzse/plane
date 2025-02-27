import pull from "lodash/pull";
import set from "lodash/set";
import { action, observable, makeObservable, computed, runInAction } from "mobx";
// base class
import { UserService } from "services/user.service";
import { TIssue, TLoader, TGroupedIssues, TSubGroupedIssues, TUnGroupedIssues, ViewFlags } from "@plane/types";
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
// types
import { IIssueRootStore } from "../root.store";

interface IProfileIssueTabTypes {
  [key: string]: string[];
}

export interface IProfileIssues {
  // observable
  loader: TLoader;
  currentView: "assigned" | "created" | "subscribed";
  issues: { [userId: string]: IProfileIssueTabTypes };
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  viewFlags: ViewFlags;
  // actions
  setViewId: (viewId: "assigned" | "created" | "subscribed") => void;
  fetchIssues: (
    workspaceSlug: string,
    projectId: string | undefined,
    loadType: TLoader,
    userId: string,
    view?: "assigned" | "created" | "subscribed"
  ) => Promise<TIssue[]>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    userId: string
  ) => Promise<TIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    userId: string
  ) => Promise<void>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string, userId: string) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string, userId: string) => Promise<void>;
  quickAddIssue: undefined;
}

export class ProfileIssues extends IssueHelperStore implements IProfileIssues {
  loader: TLoader = "init-loader";
  currentView: "assigned" | "created" | "subscribed" = "assigned";
  issues: { [userId: string]: IProfileIssueTabTypes } = {};
  quickAddIssue = undefined;
  // root store
  rootIssueStore: IIssueRootStore;
  // services
  userService;

  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);
    makeObservable(this, {
      // observable
      loader: observable.ref,
      currentView: observable.ref,
      issues: observable,
      // computed
      groupedIssueIds: computed,
      viewFlags: computed,
      // action
      setViewId: action.bound,
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      archiveIssue: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.userService = new UserService();
  }

  get groupedIssueIds() {
    const userId = this.rootIssueStore.userId;
    const workspaceSlug = this.rootIssueStore.workspaceSlug;
    const currentView = this.currentView;
    if (!userId || !currentView || !workspaceSlug) return undefined;

    const uniqueViewId = `${workspaceSlug}_${currentView}`;

    const displayFilters = this.rootIssueStore?.profileIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    const userIssueIds = this.issues[userId]?.[uniqueViewId];

    if (!userIssueIds) return;

    const _issues = this.rootStore.issues.getIssuesByIds(userIssueIds, "un-archived");
    if (!_issues) return [];

    let issues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, _issues);
      else issues = this.unGroupedIssues(orderBy, _issues);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, _issues);
      else issues = this.groupedIssues(groupBy, orderBy, _issues);
    }

    return issues;
  }

  get viewFlags() {
    if (this.currentView === "subscribed")
      return {
        enableQuickAdd: false,
        enableIssueCreation: false,
        enableInlineEditing: true,
      };
    return {
      enableQuickAdd: false,
      enableIssueCreation: true,
      enableInlineEditing: true,
    };
  }

  setViewId(viewId: "assigned" | "created" | "subscribed") {
    this.currentView = viewId;
  }

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string | undefined,
    loadType: TLoader = "init-loader",
    userId: string,
    view?: "assigned" | "created" | "subscribed"
  ) => {
    try {
      this.loader = loadType;
      if (view) this.currentView = view;

      if (!this.currentView) throw new Error("current tab view is required");

      const uniqueViewId = `${workspaceSlug}_${view}`;

      let params: any = this.rootIssueStore?.profileIssuesFilter?.appliedFilters;
      params = {
        ...params,
        assignees: undefined,
        created_by: undefined,
        subscriber: undefined,
      };
      if (this.currentView === "assigned") params = { ...params, assignees: userId };
      else if (this.currentView === "created") params = { ...params, created_by: userId };
      else if (this.currentView === "subscribed") params = { ...params, subscriber: userId };

      const response = await this.userService.getUserProfileIssues(workspaceSlug, userId, params);

      runInAction(() => {
        set(
          this.issues,
          [userId, uniqueViewId],
          response.map((issue) => issue.id)
        );
        this.loader = undefined;
      });

      this.rootIssueStore.issues.addIssue(response);

      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, userId: string) => {
    try {
      const response = await this.rootIssueStore.projectIssues.createIssue(workspaceSlug, projectId, data);

      const uniqueViewId = `${workspaceSlug}_${this.currentView}`;

      runInAction(() => {
        this.issues[userId][uniqueViewId].push(response.id);
      });

      this.rootStore.issues.addIssue([response]);

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    userId: string
  ) => {
    try {
      this.rootStore.issues.updateIssue(issueId, data);
      await this.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, data.id as keyof TIssue, data);
    } catch (error) {
      if (this.currentView) this.fetchIssues(workspaceSlug, undefined, "mutation", userId, this.currentView);
      throw error;
    }
  };

  removeIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    userId: string | undefined = undefined
  ) => {
    if (!userId) return;
    try {
      await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      const uniqueViewId = `${workspaceSlug}_${this.currentView}`;

      const issueIndex = this.issues[userId][uniqueViewId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[userId][uniqueViewId].splice(issueIndex, 1);
        });
    } catch (error) {
      throw error;
    }
  };

  archiveIssue = async (workspaceSlug: string, projectId: string, issueId: string, userId: string) => {
    try {
      await this.rootIssueStore.projectIssues.archiveIssue(workspaceSlug, projectId, issueId);

      const uniqueViewId = `${workspaceSlug}_${this.currentView}`;

      runInAction(() => {
        pull(this.issues[userId][uniqueViewId], issueId);
      });
    } catch (error) {
      throw error;
    }
  };
}
