import { MutableRefObject } from "react";
import { Droppable } from "@hello-pangea/dnd";
// hooks
import { useProjectState } from "hooks/store";
//components
//types
import {
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TUnGroupedIssues,
} from "@plane/types";
import { KanbanIssueBlocksList, KanBanQuickAddIssueForm } from ".";

interface IKanbanGroup {
  groupId: string;
  issuesMap: IIssueMap;
  peekIssueId?: string;
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id: string;
  isDragDisabled: boolean;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  groupByVisibilityToggle?: boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  isDragStarted?: boolean;
}

export const KanbanGroup = (props: IKanbanGroup) => {
  const {
    groupId,
    sub_group_id,
    group_by,
    sub_group_by,
    issuesMap,
    displayProperties,
    issueIds,
    peekIssueId,
    isDragDisabled,
    updateIssue,
    quickActions,
    canEditProperties,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    viewId,
    scrollableContainerRef,
    isDragStarted,
  } = props;
  // hooks
  const projectState = useProjectState();

  const prePopulateQuickAddData = (
    groupByKey: string | null,
    subGroupByKey: string | null,
    groupValue: string,
    subGroupValue: string
  ) => {
    const defaultState = projectState.projectStates?.find((state) => state.default);
    let preloadedData: object = { state_id: defaultState?.id };

    if (groupByKey) {
      if (groupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: groupValue };
      } else if (groupByKey === "priority") {
        preloadedData = { ...preloadedData, priority: groupValue };
      } else if (groupByKey === "cycle") {
        preloadedData = { ...preloadedData, cycle_id: groupValue };
      } else if (groupByKey === "module") {
        preloadedData = { ...preloadedData, module_ids: [groupValue] };
      } else if (groupByKey === "labels" && groupValue != "None") {
        preloadedData = { ...preloadedData, label_ids: [groupValue] };
      } else if (groupByKey === "assignees" && groupValue != "None") {
        preloadedData = { ...preloadedData, assignee_ids: [groupValue] };
      } else if (groupByKey === "created_by") {
        preloadedData = { ...preloadedData };
      } else {
        preloadedData = { ...preloadedData, [groupByKey]: groupValue };
      }
    }

    if (subGroupByKey) {
      if (subGroupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: subGroupValue };
      } else if (subGroupByKey === "priority") {
        preloadedData = { ...preloadedData, priority: subGroupValue };
      } else if (groupByKey === "cycle") {
        preloadedData = { ...preloadedData, cycle_id: subGroupValue };
      } else if (groupByKey === "module") {
        preloadedData = { ...preloadedData, module_ids: [subGroupValue] };
      } else if (subGroupByKey === "labels" && subGroupValue != "None") {
        preloadedData = { ...preloadedData, label_ids: [subGroupValue] };
      } else if (subGroupByKey === "assignees" && subGroupValue != "None") {
        preloadedData = { ...preloadedData, assignee_ids: [subGroupValue] };
      } else if (subGroupByKey === "created_by") {
        preloadedData = { ...preloadedData };
      } else {
        preloadedData = { ...preloadedData, [subGroupByKey]: subGroupValue };
      }
    }

    return preloadedData;
  };

  return (
    <div className={`relative w-full h-full transition-all`}>
      <Droppable droppableId={`${groupId}__${sub_group_id}`}>
        {(provided: any, snapshot: any) => (
          <div
            className={`relative h-full transition-all ${snapshot.isDraggingOver ? `bg-custom-background-80` : ``}`}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            <KanbanIssueBlocksList
              sub_group_id={sub_group_id}
              columnId={groupId}
              issuesMap={issuesMap}
              peekIssueId={peekIssueId}
              issueIds={(issueIds as TGroupedIssues)?.[groupId] || []}
              displayProperties={displayProperties}
              isDragDisabled={isDragDisabled}
              updateIssue={updateIssue}
              quickActions={quickActions}
              canEditProperties={canEditProperties}
              scrollableContainerRef={scrollableContainerRef}
              isDragStarted={isDragStarted}
            />

            {provided.placeholder}

            {enableQuickIssueCreate && !disableIssueCreation && (
              <div className="w-full bg-custom-background-90 py-0.5 sticky bottom-0">
                <KanBanQuickAddIssueForm
                  formKey="name"
                  groupId={groupId}
                  subGroupId={sub_group_id}
                  prePopulatedData={{
                    ...(group_by && prePopulateQuickAddData(group_by, sub_group_by, groupId, sub_group_id)),
                  }}
                  quickAddCallback={quickAddCallback}
                  viewId={viewId}
                />
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};
