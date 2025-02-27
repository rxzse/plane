import { MouseEvent } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import useSWR from "swr";
// hooks
import { useCycle, useCycleFilter, useIssues, useMember, useProject } from "hooks/store";
import { usePlatformOS } from "hooks/use-platform-os";
// ui
import { SingleProgressStats } from "components/core";
import {
  AvatarGroup,
  Loader,
  Tooltip,
  LinearProgressIndicator,
  LayersIcon,
  StateGroupIcon,
  PriorityIcon,
  Avatar,
  CycleGroupIcon,
  setPromiseToast,
  getButtonStyling,
} from "@plane/ui";
// components
import ProgressChart from "components/core/sidebar/progress-chart";
import { ActiveCycleProgressStats, UpcomingCyclesList } from "components/cycles";
import { StateDropdown } from "components/dropdowns";
import { EmptyState } from "components/empty-state";
// icons
import { ArrowRight, CalendarCheck, CalendarDays, Star, Target } from "lucide-react";
// helpers
import { renderFormattedDate, findHowManyDaysLeft, renderFormattedDateWithoutYear } from "helpers/date-time.helper";
import { truncateText } from "helpers/string.helper";
import { cn } from "helpers/common.helper";
// types
import { ICycle, TCycleGroups } from "@plane/types";
// constants
import { EIssuesStoreType } from "constants/issue";
import { CYCLE_ISSUES_WITH_PARAMS } from "constants/fetch-keys";
import { CYCLE_STATE_GROUPS_DETAILS } from "constants/cycle";
import { EmptyStateType } from "constants/empty-state";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
}

export const ActiveCycleRoot: React.FC<IActiveCycleDetails> = observer((props) => {
  // props
  const { workspaceSlug, projectId } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const {
    issues: { fetchActiveCycleIssues },
  } = useIssues(EIssuesStoreType.CYCLE);
  const {
    currentProjectActiveCycleId,
    currentProjectUpcomingCycleIds,
    fetchActiveCycle,
    getActiveCycleById,
    addCycleToFavorites,
    removeCycleFromFavorites,
  } = useCycle();
  const { currentProjectDetails } = useProject();
  const { getUserDetails } = useMember();
  // cycle filters hook
  const { updateDisplayFilters } = useCycleFilter();
  // derived values
  const activeCycle = currentProjectActiveCycleId ? getActiveCycleById(currentProjectActiveCycleId) : null;
  const cycleOwnerDetails = activeCycle ? getUserDetails(activeCycle.owned_by_id) : undefined;
  // fetch active cycle details
  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ACTIVE_CYCLE_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchActiveCycle(workspaceSlug, projectId) : null
  );
  // fetch active cycle issues
  const { data: activeCycleIssues } = useSWR(
    workspaceSlug && projectId && currentProjectActiveCycleId
      ? CYCLE_ISSUES_WITH_PARAMS(currentProjectActiveCycleId, { priority: "urgent,high" })
      : null,
    workspaceSlug && projectId && currentProjectActiveCycleId
      ? () => fetchActiveCycleIssues(workspaceSlug, projectId, currentProjectActiveCycleId)
      : null
  );
  // show loader if active cycle is loading
  if (!activeCycle && isLoading)
    return (
      <Loader>
        <Loader.Item height="250px" />
      </Loader>
    );

  if (!activeCycle) {
    // show empty state if no active cycle is present
    if (currentProjectUpcomingCycleIds?.length === 0)
      return <EmptyState type={EmptyStateType.PROJECT_CYCLE_ACTIVE} size="sm" />;
    // show upcoming cycles list, if present
    else
      return (
        <>
          <div className="h-52 w-full grid place-items-center mb-6">
            <div className="text-center">
              <h5 className="text-xl font-medium mb-1">No active cycle</h5>
              <p className="text-custom-text-400 text-base">
                Create new cycles to find them here or check
                <br />
                {"'"}All{"'"} cycles tab to see all cycles or{" "}
                <button
                  type="button"
                  className="text-custom-primary-100 font-medium"
                  onClick={() =>
                    updateDisplayFilters(projectId, {
                      active_tab: "all",
                    })
                  }
                >
                  click here
                </button>
              </p>
            </div>
          </div>
          <UpcomingCyclesList />
        </>
      );
  }

  const endDate = new Date(activeCycle.end_date ?? "");
  const startDate = new Date(activeCycle.start_date ?? "");
  const daysLeft = findHowManyDaysLeft(activeCycle.end_date) ?? 0;
  const cycleStatus = activeCycle.status.toLowerCase() as TCycleGroups;

  const groupedIssues: any = {
    backlog: activeCycle.backlog_issues,
    unstarted: activeCycle.unstarted_issues,
    started: activeCycle.started_issues,
    completed: activeCycle.completed_issues,
    cancelled: activeCycle.cancelled_issues,
  };

  const handleAddToFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const addToFavoritePromise = addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), activeCycle.id);

    setPromiseToast(addToFavoritePromise, {
      loading: "Adding cycle to favorites...",
      success: {
        title: "Success!",
        message: () => "Cycle added to favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the cycle to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const removeFromFavoritePromise = removeCycleFromFavorites(
      workspaceSlug?.toString(),
      projectId.toString(),
      activeCycle.id
    );

    setPromiseToast(removeFromFavoritePromise, {
      loading: "Removing cycle from favorites...",
      success: {
        title: "Success!",
        message: () => "Cycle removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the cycle from favorites. Please try again.",
      },
    });
  };

  const progressIndicatorData = CYCLE_STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value:
      activeCycle.total_issues > 0
        ? ((activeCycle[group.key as keyof ICycle] as number) / activeCycle.total_issues) * 100
        : 0,
    color: group.color,
  }));

  return (
    <div className="grid-row-2 grid divide-y rounded-[10px] border border-custom-border-200 bg-custom-background-100 shadow">
      <div className="grid grid-cols-1 divide-y border-custom-border-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="flex flex-col text-xs">
          <div className="h-full w-full">
            <div className="flex h-60 flex-col justify-between gap-5 rounded-b-[10px] p-4">
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1">
                  <span className="h-5 w-5">
                    <CycleGroupIcon cycleGroup={cycleStatus} className="h-4 w-4" />
                  </span>
                  <Tooltip tooltipContent={activeCycle.name} position="top-left" isMobile={isMobile}>
                    <h3 className="break-words text-lg font-semibold">{truncateText(activeCycle.name, 70)}</h3>
                  </Tooltip>
                </span>
                <span className="flex items-center gap-1">
                  <span className="flex gap-1 whitespace-nowrap rounded-sm bg-amber-500/10 px-3 py-0.5 text-sm text-amber-500">
                    {`${daysLeft} ${daysLeft > 1 ? "days" : "day"} left`}
                  </span>
                  {activeCycle.is_favorite ? (
                    <button
                      onClick={(e) => {
                        handleRemoveFromFavorites(e);
                      }}
                    >
                      <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        handleAddToFavorites(e);
                      }}
                    >
                      <Star className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                    </button>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-start gap-5 text-custom-text-200">
                <div className="flex items-start gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>{renderFormattedDate(startDate)}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-custom-text-200" />
                <div className="flex items-start gap-1">
                  <Target className="h-4 w-4" />
                  <span>{renderFormattedDate(endDate)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 text-custom-text-200">
                  <Avatar src={cycleOwnerDetails?.avatar} name={cycleOwnerDetails?.display_name} />
                  <span className="text-custom-text-200">{cycleOwnerDetails?.display_name}</span>
                </div>

                {activeCycle.assignee_ids.length > 0 && (
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <AvatarGroup>
                      {activeCycle.assignee_ids.map((assignee_id) => {
                        const member = getUserDetails(assignee_id);
                        return <Avatar key={member?.id} name={member?.display_name} src={member?.avatar} />;
                      })}
                    </AvatarGroup>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-custom-text-200">
                <div className="flex gap-2">
                  <LayersIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  {activeCycle.total_issues} issues
                </div>
                <div className="flex items-center gap-2">
                  <StateGroupIcon stateGroup="completed" height="14px" width="14px" />
                  {activeCycle.completed_issues} issues
                </div>
              </div>

              <Link
                href={`/${workspaceSlug}/projects/${projectId}/cycles/${activeCycle.id}`}
                className={cn(getButtonStyling("primary", "lg"), "w-min whitespace-nowrap")}
              >
                View cycle
              </Link>
            </div>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-1 divide-y border-custom-border-200 md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="flex h-60 flex-col border-custom-border-200">
            <div className="flex h-full w-full flex-col p-4 text-custom-text-200">
              <div className="flex w-full items-center gap-2 py-1">
                <span>Progress</span>
                <LinearProgressIndicator size="md" data={progressIndicatorData} inPercentage />
              </div>
              <div className="mt-2 flex flex-col items-center gap-1">
                {Object.keys(groupedIssues).map((group, index) => (
                  <SingleProgressStats
                    key={index}
                    title={
                      <div className="flex items-center gap-2">
                        <span
                          className="block h-3 w-3 rounded-full "
                          style={{
                            backgroundColor: CYCLE_STATE_GROUPS_DETAILS[index].color,
                          }}
                        />
                        <span className="text-xs capitalize">{group}</span>
                      </div>
                    }
                    completed={groupedIssues[group]}
                    total={activeCycle.total_issues}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="h-60 overflow-y-scroll border-custom-border-200">
            <ActiveCycleProgressStats cycle={activeCycle} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y border-custom-border-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="flex max-h-60 flex-col gap-3 overflow-hidden p-4">
          <div className="text-custom-primary">High priority issues</div>
          <div className="flex h-full flex-col gap-2.5 overflow-y-scroll rounded-md">
            {activeCycleIssues ? (
              activeCycleIssues.length > 0 ? (
                activeCycleIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-md border border-custom-border-200  px-3 py-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <PriorityIcon priority={issue.priority} withContainer size={12} />

                      <Tooltip
                        isMobile={isMobile}
                        tooltipHeading="Issue ID"
                        tooltipContent={`${currentProjectDetails?.identifier}-${issue.sequence_id}`}
                      >
                        <span className="flex-shrink-0 text-xs text-custom-text-200">
                          {currentProjectDetails?.identifier}-{issue.sequence_id}
                        </span>
                      </Tooltip>
                      <Tooltip position="top-left" tooltipContent={issue.name} isMobile={isMobile}>
                        <span className="text-[0.825rem] text-custom-text-100">{truncateText(issue.name, 30)}</span>
                      </Tooltip>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <StateDropdown
                        value={issue.state_id}
                        onChange={() => {}}
                        projectId={projectId}
                        disabled
                        buttonVariant="background-with-text"
                      />
                      {issue.target_date && (
                        <Tooltip tooltipHeading="Target Date" tooltipContent={renderFormattedDate(issue.target_date)} isMobile={isMobile}>
                          <div className="flex h-full cursor-not-allowed items-center gap-1.5 rounded bg-custom-background-80 px-2 py-0.5 text-xs">
                            <CalendarCheck className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs">{renderFormattedDateWithoutYear(issue.target_date)}</span>
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-custom-text-200">
                  There are no high priority issues present in this cycle.
                </div>
              )
            ) : (
              <Loader className="space-y-3">
                <Loader.Item height="50px" />
                <Loader.Item height="50px" />
                <Loader.Item height="50px" />
              </Loader>
            )}
          </div>
        </div>
        <div className="flex max-h-60  flex-col border-custom-border-200 p-4">
          <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
            <div className="flex items-center gap-3 text-custom-text-100">
              <div className="flex items-center justify-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#a9bbd0]" />
                <span>Ideal</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4c8fff]" />
                <span>Current</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span>
                <LayersIcon className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-200" />
              </span>
              <span>
                Pending issues-{" "}
                {activeCycle.total_issues - (activeCycle.completed_issues + activeCycle.cancelled_issues)}
              </span>
            </div>
          </div>
          <div className="relative h-full">
            <ProgressChart
              distribution={activeCycle.distribution?.completion_chart ?? {}}
              startDate={activeCycle.start_date ?? ""}
              endDate={activeCycle.end_date ?? ""}
              totalIssues={activeCycle.total_issues}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
