import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { observer } from "mobx-react";
import { MoreVertical } from "lucide-react";
// hooks
import { useGanttChart } from "components/gantt-chart/hooks";
// components
import { IssueGanttSidebarBlock } from "components/issues";
// helpers
import { cn } from "helpers/common.helper";
import { findTotalDaysInRange } from "helpers/date-time.helper";
import { useIssueDetail } from "hooks/store";
// types
// constants
import { BLOCK_HEIGHT } from "../../constants";
import { IGanttBlock } from "../../types";

type Props = {
  block: IGanttBlock;
  enableReorder: boolean;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
};

export const IssuesSidebarBlock: React.FC<Props> = observer((props) => {
  const { block, enableReorder, provided, snapshot } = props;
  // store hooks
  const { updateActiveBlockId, isBlockActive } = useGanttChart();
  const { peekIssue } = useIssueDetail();

  const duration = findTotalDaysInRange(block.start_date, block.target_date);

  return (
    <div
      className={cn({
        "rounded bg-custom-background-80": snapshot.isDragging,
        "rounded-l border border-r-0 border-custom-primary-70 hover:border-custom-primary-70":
          peekIssue?.issueId === block.data.id,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
      ref={provided.innerRef}
      {...provided.draggableProps}
    >
      <div
        className={cn("group w-full flex items-center gap-2 pl-2 pr-4", {
          "bg-custom-background-80": isBlockActive(block.id),
        })}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        {enableReorder && (
          <button
            type="button"
            className="flex flex-shrink-0 rounded p-0.5 text-custom-sidebar-text-200 opacity-0 group-hover:opacity-100"
            {...provided.dragHandleProps}
          >
            <MoreVertical className="h-3.5 w-3.5" />
            <MoreVertical className="-ml-5 h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex h-full flex-grow items-center justify-between gap-2 truncate">
          <div className="flex-grow truncate">
            <IssueGanttSidebarBlock issueId={block.data.id} />
          </div>
          {duration && (
            <div className="flex-shrink-0 text-sm text-custom-text-200">
              <span>
                {duration} day{duration > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
