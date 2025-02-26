import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
// components
import { GanttChartRoot, IBlockUpdateData, ModuleGanttSidebar } from "components/gantt-chart";
import { ModuleGanttBlock } from "components/modules";
import { useModule, useProject } from "hooks/store";
// types
import { IModule } from "@plane/types";

export const ModulesListGanttChartView: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const { currentProjectDetails } = useProject();
  const { getFilteredModuleIds, moduleMap, updateModuleDetails } = useModule();
  // derived values
  const filteredModuleIds = projectId ? getFilteredModuleIds(projectId.toString()) : undefined;

  const handleModuleUpdate = async (module: IModule, data: IBlockUpdateData) => {
    if (!workspaceSlug || !module) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    await updateModuleDetails(workspaceSlug.toString(), module.project_id, module.id, payload);
  };

  const blockFormat = (blocks: string[]) =>
    blocks?.map((blockId) => {
      const block = moduleMap[blockId];
      return {
        data: block,
        id: block.id,
        sort_order: block.sort_order,
        start_date: block.start_date ? new Date(block.start_date) : null,
        target_date: block.target_date ? new Date(block.target_date) : null,
      };
    });

  const isAllowed = currentProjectDetails?.member_role === 20 || currentProjectDetails?.member_role === 15;

  return (
    <div className="h-full w-full overflow-y-auto">
      <GanttChartRoot
        title="Modules"
        loaderTitle="Modules"
        blocks={filteredModuleIds ? blockFormat(filteredModuleIds) : null}
        sidebarToRender={(props) => <ModuleGanttSidebar {...props} />}
        blockUpdateHandler={(block, payload) => handleModuleUpdate(block, payload)}
        blockToRender={(data: IModule) => <ModuleGanttBlock moduleId={data.id} />}
        enableBlockLeftResize={isAllowed}
        enableBlockRightResize={isAllowed}
        enableBlockMove={isAllowed}
        enableReorder={isAllowed}
        enableAddBlock={isAllowed}
        showAllBlocks
      />
    </div>
  );
});
