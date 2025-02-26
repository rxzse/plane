import Image from "next/image";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useApplication, useEventTracker, useModule, useModuleFilter } from "hooks/store";
// components
import { ModuleCardItem, ModuleListItem, ModulePeekOverview, ModulesListGanttChartView } from "components/modules";
import { EmptyState } from "components/empty-state";
// ui
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "components/ui";
// assets
import NameFilterImage from "public/empty-state/module/name-filter.svg";
import AllFiltersImage from "public/empty-state/module/all-filters.svg";
// constants
import { EmptyStateType } from "constants/empty-state";

export const ModulesListView: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekModule } = router.query;
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const { setTrackElement } = useEventTracker();
  const { getFilteredModuleIds, loader } = useModule();
  const { currentProjectDisplayFilters: displayFilters, searchQuery } = useModuleFilter();
  // derived values
  const filteredModuleIds = projectId ? getFilteredModuleIds(projectId.toString()) : undefined;

  if (loader || !filteredModuleIds)
    return (
      <>
        {displayFilters?.layout === "list" && <CycleModuleListLayout />}
        {displayFilters?.layout === "board" && <CycleModuleBoardLayout />}
        {displayFilters?.layout === "gantt" && <GanttLayoutLoader />}
      </>
    );

  if (filteredModuleIds.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching modules"
          />
          <h5 className="text-xl font-medium mt-7 mb-1">No matching modules</h5>
          <p className="text-custom-text-400 text-base">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all modules"
              : "Remove the search criteria to see all modules"}
          </p>
        </div>
      </div>
    );

  return (
    <>
      {filteredModuleIds.length > 0 ? (
        <>
          {displayFilters?.layout === "list" && (
            <div className="h-full overflow-y-auto">
              <div className="flex h-full w-full justify-between">
                <div className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg">
                  {filteredModuleIds.map((moduleId) => (
                    <ModuleListItem key={moduleId} moduleId={moduleId} />
                  ))}
                </div>
                <ModulePeekOverview
                  projectId={projectId?.toString() ?? ""}
                  workspaceSlug={workspaceSlug?.toString() ?? ""}
                />
              </div>
            </div>
          )}
          {displayFilters?.layout === "board" && (
            <div className="h-full w-full">
              <div className="flex h-full w-full justify-between">
                <div
                  className={`grid h-full w-full grid-cols-1 gap-6 overflow-y-auto p-8 ${
                    peekModule
                      ? "lg:grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3"
                      : "lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4"
                  } auto-rows-max transition-all vertical-scrollbar scrollbar-lg`}
                >
                  {filteredModuleIds.map((moduleId) => (
                    <ModuleCardItem key={moduleId} moduleId={moduleId} />
                  ))}
                </div>
                <ModulePeekOverview
                  projectId={projectId?.toString() ?? ""}
                  workspaceSlug={workspaceSlug?.toString() ?? ""}
                />
              </div>
            </div>
          )}
          {displayFilters?.layout === "gantt" && <ModulesListGanttChartView />}
        </>
      ) : (
        <EmptyState
          type={EmptyStateType.PROJECT_MODULE}
          primaryButtonOnClick={() => {
            setTrackElement("Module empty state");
            commandPaletteStore.toggleCreateModuleModal(true);
          }}
        />
      )}
    </>
  );
});
