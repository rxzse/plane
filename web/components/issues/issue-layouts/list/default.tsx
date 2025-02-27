import { useRef } from "react";
// components
import { IssueBlocksList, ListQuickAddIssueForm } from "components/issues";
// hooks
import { useCycle, useLabel, useMember, useModule, useProject, useProjectState } from "hooks/store";
// constants
// types
import {
  GroupByColumnTypes,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  TIssueMap,
  TUnGroupedIssues,
  IGroupByColumn,
} from "@plane/types";
import { getGroupByColumns } from "../utils";
import { HeaderGroupByCard } from "./headers/group-by-card";
import { EIssuesStoreType } from "constants/issue";

export interface IGroupByList {
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  issuesMap: TIssueMap;
  group_by: string | null;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  showEmptyGroup?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  storeType: EIssuesStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  viewId?: string;
  isCompletedCycle?: boolean;
}

const GroupByList: React.FC<IGroupByList> = (props) => {
  const {
    issueIds,
    issuesMap,
    group_by,
    updateIssue,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    showEmptyGroup,
    canEditProperties,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    storeType,
    addIssuesToView,
    isCompletedCycle = false,
  } = props;
  // store hooks
  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const projectState = useProjectState();
  const cycle = useCycle();
  const projectModule = useModule();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const groups = getGroupByColumns(
    group_by as GroupByColumnTypes,
    project,
    cycle,
    projectModule,
    label,
    projectState,
    member,
    true,
    true
  );

  if (!groups) return null;

  const prePopulateQuickAddData = (groupByKey: string | null, value: any) => {
    const defaultState = projectState.projectStates?.find((state) => state.default);
    let preloadedData: object = { state_id: defaultState?.id };

    if (groupByKey === null) {
      preloadedData = { ...preloadedData };
    } else {
      if (groupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: value };
      } else if (groupByKey === "priority") {
        preloadedData = { ...preloadedData, priority: value };
      } else if (groupByKey === "labels" && value != "None") {
        preloadedData = { ...preloadedData, label_ids: [value] };
      } else if (groupByKey === "assignees" && value != "None") {
        preloadedData = { ...preloadedData, assignee_ids: [value] };
      } else if (groupByKey === "cycle" && value != "None") {
        preloadedData = { ...preloadedData, cycle_id: value };
      } else if (groupByKey === "module" && value != "None") {
        preloadedData = { ...preloadedData, module_ids: [value] };
      } else if (groupByKey === "created_by") {
        preloadedData = { ...preloadedData };
      } else {
        preloadedData = { ...preloadedData, [groupByKey]: value };
      }
    }

    return preloadedData;
  };

  const validateEmptyIssueGroups = (issues: TIssue[]) => {
    const issuesCount = issues?.length || 0;
    if (!showEmptyGroup && issuesCount <= 0) return false;
    return true;
  };

  const is_list = group_by === null ? true : false;

  const isGroupByCreatedBy = group_by === "created_by";

  return (
    <div
      ref={containerRef}
      className="vertical-scrollbar scrollbar-lg relative h-full w-full overflow-auto vertical-scrollbar-margin-top-md"
    >
      {groups &&
        groups.length > 0 &&
        groups.map(
          (_list: IGroupByColumn) =>
            validateEmptyIssueGroups(is_list ? issueIds : issueIds?.[_list.id]) && (
              <div key={_list.id} className={`flex flex-shrink-0 flex-col`}>
                <div className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-3 py-1">
                  <HeaderGroupByCard
                    icon={_list.icon}
                    title={_list.name || ""}
                    count={is_list ? issueIds?.length || 0 : issueIds?.[_list.id]?.length || 0}
                    issuePayload={_list.payload}
                    disableIssueCreation={disableIssueCreation || isGroupByCreatedBy || isCompletedCycle}
                    storeType={storeType}
                    addIssuesToView={addIssuesToView}
                  />
                </div>

                {issueIds && (
                  <IssueBlocksList
                    issueIds={is_list ? issueIds || 0 : issueIds?.[_list.id] || 0}
                    issuesMap={issuesMap}
                    updateIssue={updateIssue}
                    quickActions={quickActions}
                    displayProperties={displayProperties}
                    canEditProperties={canEditProperties}
                    containerRef={containerRef}
                  />
                )}

                {enableIssueQuickAdd && !disableIssueCreation && !isGroupByCreatedBy && !isCompletedCycle && (
                  <div className="sticky bottom-0 z-[1] w-full flex-shrink-0">
                    <ListQuickAddIssueForm
                      prePopulatedData={prePopulateQuickAddData(group_by, _list.id)}
                      quickAddCallback={quickAddCallback}
                      viewId={viewId}
                    />
                  </div>
                )}
              </div>
            )
        )}
    </div>
  );
};

export interface IList {
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  issuesMap: TIssueMap;
  group_by: string | null;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  showEmptyGroup: boolean;
  enableIssueQuickAdd: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  storeType: EIssuesStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  isCompletedCycle?: boolean;
}

export const List: React.FC<IList> = (props) => {
  const {
    issueIds,
    issuesMap,
    group_by,
    updateIssue,
    quickActions,
    quickAddCallback,
    viewId,
    displayProperties,
    showEmptyGroup,
    enableIssueQuickAdd,
    canEditProperties,
    disableIssueCreation,
    storeType,
    addIssuesToView,
    isCompletedCycle = false,
  } = props;

  return (
    <div className="relative h-full w-full">
      <GroupByList
        issueIds={issueIds as TUnGroupedIssues}
        issuesMap={issuesMap}
        group_by={group_by}
        updateIssue={updateIssue}
        quickActions={quickActions}
        displayProperties={displayProperties}
        enableIssueQuickAdd={enableIssueQuickAdd}
        showEmptyGroup={showEmptyGroup}
        canEditProperties={canEditProperties}
        quickAddCallback={quickAddCallback}
        viewId={viewId}
        disableIssueCreation={disableIssueCreation}
        storeType={storeType}
        addIssuesToView={addIssuesToView}
        isCompletedCycle={isCompletedCycle}
      />
    </div>
  );
};
