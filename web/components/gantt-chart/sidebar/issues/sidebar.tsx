import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
// components
// ui
import { Loader } from "@plane/ui";
// types
import { IGanttBlock, IBlockUpdateData } from "components/gantt-chart/types";
import { IssuesSidebarBlock } from "./block";

type Props = {
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blocks: IGanttBlock[] | null;
  enableReorder: boolean;
  showAllBlocks?: boolean;
};

export const IssueGanttSidebar: React.FC<Props> = (props) => {
  const { blockUpdateHandler, blocks, enableReorder, showAllBlocks = false } = props;

  const handleOrderChange = (result: DropResult) => {
    if (!blocks) return;

    const { source, destination } = result;

    // return if dropped outside the list
    if (!destination) return;

    // return if dropped on the same index
    if (source.index === destination.index) return;

    let updatedSortOrder = blocks[source.index].sort_order;

    // update the sort order to the lowest if dropped at the top
    if (destination.index === 0) updatedSortOrder = blocks[0].sort_order - 1000;
    // update the sort order to the highest if dropped at the bottom
    else if (destination.index === blocks.length - 1) updatedSortOrder = blocks[blocks.length - 1].sort_order + 1000;
    // update the sort order to the average of the two adjacent blocks if dropped in between
    else {
      const destinationSortingOrder = blocks[destination.index].sort_order;
      const relativeDestinationSortingOrder =
        source.index < destination.index
          ? blocks[destination.index + 1].sort_order
          : blocks[destination.index - 1].sort_order;

      updatedSortOrder = (destinationSortingOrder + relativeDestinationSortingOrder) / 2;
    }

    // extract the element from the source index and insert it at the destination index without updating the entire array
    const removedElement = blocks.splice(source.index, 1)[0];
    blocks.splice(destination.index, 0, removedElement);

    // call the block update handler with the updated sort order, new and old index
    blockUpdateHandler(removedElement.data, {
      sort_order: {
        destinationIndex: destination.index,
        newSortOrder: updatedSortOrder,
        sourceIndex: source.index,
      },
    });
  };

  return (
    <DragDropContext onDragEnd={handleOrderChange}>
      <Droppable droppableId="gantt-sidebar">
        {(droppableProvided) => (
          <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
            <>
              {blocks ? (
                blocks.map((block, index) => {
                  const isBlockVisibleOnSidebar = block.start_date && block.target_date;

                  // hide the block if it doesn't have start and target dates and showAllBlocks is false
                  if (!showAllBlocks && !isBlockVisibleOnSidebar) return;

                  return (
                    <Draggable
                      key={`sidebar-block-${block.id}`}
                      draggableId={`sidebar-block-${block.id}`}
                      index={index}
                      isDragDisabled={!enableReorder}
                    >
                      {(provided, snapshot) => (
                        <IssuesSidebarBlock
                          block={block}
                          enableReorder={enableReorder}
                          provided={provided}
                          snapshot={snapshot}
                        />
                      )}
                    </Draggable>
                  );
                })
              ) : (
                <Loader className="space-y-3 pr-2">
                  <Loader.Item height="34px" />
                  <Loader.Item height="34px" />
                  <Loader.Item height="34px" />
                  <Loader.Item height="34px" />
                </Loader>
              )}
              {droppableProvided.placeholder}
            </>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
