import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
// store
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { IssueService } from "services/issue";
import { TIssue } from "@plane/types";
//services

export type IIssueStore = {
  // observables
  issuesMap: Record<string, TIssue>; // Record defines issue_id as key and TIssue as value
  // actions
  getIssues(workspaceSlug: string, projectId: string, issueIds: string[]): Promise<TIssue[]>;
  addIssue(issues: TIssue[], shouldReplace?: boolean): void;
  updateIssue(issueId: string, issue: Partial<TIssue>): void;
  removeIssue(issueId: string): void;
  // helper methods
  getIssueById(issueId: string): undefined | TIssue;
  getIssuesByIds(issueIds: string[], type: "archived" | "un-archived"): undefined | Record<string, TIssue>; // Record defines issue_id as key and TIssue as value
};

export class IssueStore implements IIssueStore {
  // observables
  issuesMap: { [issue_id: string]: TIssue } = {};
  // service
  issueService;

  constructor() {
    makeObservable(this, {
      // observable
      issuesMap: observable,
      // actions
      addIssue: action,
      updateIssue: action,
      removeIssue: action,
    });

    this.issueService = new IssueService();
  }

  // actions
  /**
   * @description This method will add issues to the issuesMap
   * @param {TIssue[]} issues
   * @returns {void}
   */
  addIssue = (issues: TIssue[], shouldReplace = false) => {
    if (issues && issues.length <= 0) return;
    runInAction(() => {
      issues.forEach((issue) => {
        if (!this.issuesMap[issue.id] || shouldReplace) set(this.issuesMap, issue.id, issue);
      });
    });
  };

  getIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    const issues = await this.issueService.retrieveIssues(workspaceSlug, projectId, issueIds);

    runInAction(() => {
      issues.forEach((issue) => {
        if (!this.issuesMap[issue.id]) set(this.issuesMap, issue.id, issue);
      });
    });

    return issues;
  };

  /**
   * @description This method will update the issue in the issuesMap
   * @param {string} issueId
   * @param {Partial<TIssue>} issue
   * @returns {void}
   */
  updateIssue = (issueId: string, issue: Partial<TIssue>) => {
    if (!issue || !issueId || isEmpty(this.issuesMap) || !this.issuesMap[issueId]) return;
    runInAction(() => {
      Object.keys(issue).forEach((key) => {
        set(this.issuesMap, [issueId, key], issue[key as keyof TIssue]);
      });
    });
  };

  /**
   * @description This method will remove the issue from the issuesMap
   * @param {string} issueId
   * @returns {void}
   */
  removeIssue = (issueId: string) => {
    if (!issueId || isEmpty(this.issuesMap) || !this.issuesMap[issueId]) return;
    runInAction(() => {
      delete this.issuesMap[issueId];
    });
  };

  // helper methods
  /**
   * @description This method will return the issue from the issuesMap
   * @param {string} issueId
   * @returns {TIssue | undefined}
   */
  getIssueById = computedFn((issueId: string) => {
    if (!issueId || isEmpty(this.issuesMap) || !this.issuesMap[issueId]) return undefined;
    return this.issuesMap[issueId];
  });

  /**
   * @description This method will return the issues from the issuesMap
   * @param {string[]} issueIds
   * @param {boolean} archivedIssues
   * @returns {Record<string, TIssue> | undefined}
   */
  getIssuesByIds = computedFn((issueIds: string[], type: "archived" | "un-archived") => {
    if (!issueIds || issueIds.length <= 0 || isEmpty(this.issuesMap)) return undefined;
    const filteredIssues: { [key: string]: TIssue } = {};
    Object.values(this.issuesMap).forEach((issue) => {
      // if type is archived then check archived_at is not null
      // if type is un-archived then check archived_at is null
      if ((type === "archived" && issue.archived_at) || (type === "un-archived" && !issue.archived_at)) {
        if (issueIds.includes(issue.id)) filteredIssues[issue.id] = issue;
      }
    });
    return isEmpty(filteredIssues) ? undefined : filteredIssues;
  });
}
