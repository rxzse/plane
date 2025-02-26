import pull from "lodash/pull";
import set from "lodash/set";
import { action, observable, makeObservable, computed, runInAction } from "mobx";
// base class
import { IssueService, IssueArchiveService } from "services/issue";
import { WorkspaceService } from "services/workspace.service";
import { TIssue, TLoader, TUnGroupedIssues, ViewFlags } from "@plane/types";
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
// types
import { IIssueRootStore } from "../root.store";

export interface IWorkspaceIssues {
  // observable
  loader: TLoader;
  issues: { [viewId: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: { dataViewId: string; issueIds: TUnGroupedIssues | undefined };
  // actions
  fetchIssues: (workspaceSlug: string, viewId: string, loadType: TLoader) => Promise<TIssue[]>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    viewId: string
  ) => Promise<TIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    viewId: string
  ) => Promise<void>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string, viewId: string) => Promise<void>;
  archiveIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    viewId?: string | undefined
  ) => Promise<void>;
  quickAddIssue: undefined;
}

export class WorkspaceIssues extends IssueHelperStore implements IWorkspaceIssues {
  loader: TLoader = "init-loader";
  issues: { [viewId: string]: string[] } = {};
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // root store
  rootIssueStore: IIssueRootStore;
  // service
  workspaceService;
  issueService;
  issueArchiveService;

  quickAddIssue = undefined;

  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable,
      // computed
      groupedIssueIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      archiveIssue: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.workspaceService = new WorkspaceService();
    this.issueService = new IssueService();
    this.issueArchiveService = new IssueArchiveService();
  }

  get groupedIssueIds() {
    const viewId = this.rootIssueStore.globalViewId;
    const workspaceSlug = this.rootIssueStore.workspaceSlug;
    if (!workspaceSlug || !viewId) return { dataViewId: "", issueIds: undefined };

    const uniqueViewId = `${workspaceSlug}_${viewId}`;

    const displayFilters = this.rootIssueStore?.workspaceIssuesFilter?.filters?.[viewId]?.displayFilters;
    if (!displayFilters) return { dataViewId: viewId, issueIds: undefined };

    const orderBy = displayFilters?.order_by;

    const viewIssueIds = this.issues[uniqueViewId];

    if (!viewIssueIds) return { dataViewId: viewId, issueIds: undefined };

    const _issues = this.rootStore.issues.getIssuesByIds(viewIssueIds, "un-archived");
    if (!_issues) return { dataViewId: viewId, issueIds: [] };

    let issueIds: TIssue | TUnGroupedIssues | undefined = undefined;

    issueIds = this.unGroupedIssues(orderBy ?? "-created_at", _issues);

    return { dataViewId: viewId, issueIds };
  }

  fetchIssues = async (workspaceSlug: string, viewId: string, loadType: TLoader = "init-loader") => {
    try {
      this.loader = loadType;

      const uniqueViewId = `${workspaceSlug}_${viewId}`;

      const params = this.rootIssueStore?.workspaceIssuesFilter?.getAppliedFilters(viewId);
      const response = await this.workspaceService.getViewIssues(workspaceSlug, params);

      runInAction(() => {
        set(
          this.issues,
          [uniqueViewId],
          response.map((issue) => issue.id)
        );
        this.loader = undefined;
      });

      this.rootIssueStore.issues.addIssue(response);

      return response;
    } catch (error) {
      console.error(error);
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, viewId: string) => {
    try {
      const uniqueViewId = `${workspaceSlug}_${viewId}`;

      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

      runInAction(() => {
        this.issues[uniqueViewId].push(response.id);
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
    viewId: string
  ) => {
    try {
      this.rootStore.issues.updateIssue(issueId, data);
      await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);
    } catch (error) {
      if (viewId) this.fetchIssues(workspaceSlug, viewId, "mutation");
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string, viewId: string) => {
    try {
      const uniqueViewId = `${workspaceSlug}_${viewId}`;

      await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[uniqueViewId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[uniqueViewId].splice(issueIndex, 1);
        });

      this.rootStore.issues.removeIssue(issueId);
    } catch (error) {
      throw error;
    }
  };

  archiveIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    viewId: string | undefined = undefined
  ) => {
    try {
      if (!viewId) throw new Error("View id is required");

      const uniqueViewId = `${workspaceSlug}_${viewId}`;

      const response = await this.issueArchiveService.archiveIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.rootStore.issues.updateIssue(issueId, {
          archived_at: response.archived_at,
        });
        pull(this.issues[uniqueViewId], issueId);
      });
    } catch (error) {
      throw error;
    }
  };
}
