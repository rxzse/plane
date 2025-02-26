import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { DayPicker } from "react-day-picker";
import { Popover } from "@headlessui/react";
// icons
import { CheckCircle2, ChevronDown, ChevronUp, Clock, FileStack, Trash2, XCircle } from "lucide-react";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  AcceptIssueModal,
  DeclineIssueModal,
  DeleteInboxIssueModal,
  SelectDuplicateInboxIssueModal,
} from "components/inbox";
import { ISSUE_DELETED } from "constants/event-tracker";
import { EUserProjectRoles } from "constants/project";
// hooks
import { useUser, useInboxIssues, useIssueDetail, useWorkspace, useEventTracker } from "hooks/store";
// types
import type { TInboxDetailedStatus } from "@plane/types";

type TInboxIssueActionsHeader = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  inboxIssueId: string | undefined;
};

type TInboxIssueOperations = {
  updateInboxIssueStatus: (data: TInboxDetailedStatus) => Promise<void>;
  removeInboxIssue: () => Promise<void>;
};

export const InboxIssueActionsHeader: FC<TInboxIssueActionsHeader> = observer((props) => {
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = props;
  // router
  const router = useRouter();
  // hooks
  const { captureIssueEvent } = useEventTracker();
  const { currentWorkspace } = useWorkspace();
  const {
    issues: { getInboxIssuesByInboxId, getInboxIssueByIssueId, updateInboxIssueStatus, removeInboxIssue },
  } = useInboxIssues();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();

  // states
  const [date, setDate] = useState(new Date());
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [acceptIssueModal, setAcceptIssueModal] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  // derived values
  const inboxIssues = getInboxIssuesByInboxId(inboxId);
  const issueStatus = (inboxIssueId && inboxId && getInboxIssueByIssueId(inboxId, inboxIssueId)) || undefined;
  const issue = (inboxIssueId && getIssueById(inboxIssueId)) || undefined;

  const currentIssueIndex = inboxIssues?.findIndex((issue) => issue === inboxIssueId) ?? 0;

  const inboxIssueOperations: TInboxIssueOperations = useMemo(
    () => ({
      updateInboxIssueStatus: async (data: TInboxDetailedStatus) => {
        try {
          if (!workspaceSlug || !projectId || !inboxId || !inboxIssueId) throw new Error("Missing required parameters");
          await updateInboxIssueStatus(workspaceSlug, projectId, inboxId, inboxIssueId, data);
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Something went wrong while updating inbox status. Please try again.",
          });
        }
      },
      removeInboxIssue: async () => {
        try {
          if (!workspaceSlug || !projectId || !inboxId || !inboxIssueId || !currentWorkspace)
            throw new Error("Missing required parameters");
          await removeInboxIssue(workspaceSlug, projectId, inboxId, inboxIssueId);
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: {
              id: inboxIssueId,
              state: "SUCCESS",
              element: "Inbox page",
            },
          });
          router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Something went wrong while deleting inbox issue. Please try again.",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: {
              id: inboxIssueId,
              state: "FAILED",
              element: "Inbox page",
            },
          });
        }
      },
    }),
    [
      currentWorkspace,
      workspaceSlug,
      projectId,
      inboxId,
      inboxIssueId,
      updateInboxIssueStatus,
      removeInboxIssue,
      captureIssueEvent,
      router,
    ]
  );

  const handleInboxIssueNavigation = useCallback(
    (direction: "next" | "prev") => {
      if (!inboxIssues || !inboxIssueId) return;
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.classList.contains("tiptap") || activeElement.id === "title-input")) return;
      const nextIssueIndex =
        direction === "next"
          ? (currentIssueIndex + 1) % inboxIssues.length
          : (currentIssueIndex - 1 + inboxIssues.length) % inboxIssues.length;
      const nextIssueId = inboxIssues[nextIssueIndex];
      if (!nextIssueId) return;
      router.push({
        pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
        query: {
          inboxIssueId: nextIssueId,
        },
      });
    },
    [workspaceSlug, projectId, inboxId, inboxIssues, inboxIssueId, currentIssueIndex, router]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        handleInboxIssueNavigation("prev");
      } else if (e.key === "ArrowDown") {
        handleInboxIssueNavigation("next");
      }
    },
    [handleInboxIssueNavigation]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  useEffect(() => {
    if (!issueStatus || !issueStatus.snoozed_till) return;
    setDate(new Date(issueStatus.snoozed_till));
  }, [issueStatus]);

  if (!issueStatus || !issue || !inboxIssues) return <></>;
  return (
    <>
      {issue && (
        <>
          <SelectDuplicateInboxIssueModal
            isOpen={selectDuplicateIssue}
            onClose={() => setSelectDuplicateIssue(false)}
            value={issueStatus.duplicate_to}
            onSubmit={(dupIssueId) => {
              inboxIssueOperations
                .updateInboxIssueStatus({
                  status: 2,
                  duplicate_to: dupIssueId,
                })
                .finally(() => setSelectDuplicateIssue(false));
            }}
          />

          <AcceptIssueModal
            data={issue}
            isOpen={acceptIssueModal}
            onClose={() => setAcceptIssueModal(false)}
            onSubmit={async () => {
              await inboxIssueOperations
                .updateInboxIssueStatus({
                  status: 1,
                })
                .finally(() => setAcceptIssueModal(false));
            }}
          />

          <DeclineIssueModal
            data={issue}
            isOpen={declineIssueModal}
            onClose={() => setDeclineIssueModal(false)}
            onSubmit={async () => {
              await inboxIssueOperations
                .updateInboxIssueStatus({
                  status: -1,
                })
                .finally(() => setDeclineIssueModal(false));
            }}
          />

          <DeleteInboxIssueModal
            data={issue}
            isOpen={deleteIssueModal}
            onClose={() => setDeleteIssueModal(false)}
            onSubmit={async () => {
              await inboxIssueOperations.removeInboxIssue().finally(() => setDeclineIssueModal(false));
            }}
          />
        </>
      )}

      {inboxIssueId && (
        <div className="relative flex h-full w-full items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-x-2">
            <button
              type="button"
              className="rounded border border-custom-border-200 bg-custom-background-90 p-1.5 hover:bg-custom-background-80"
              onClick={() => handleInboxIssueNavigation("prev")}
            >
              <ChevronUp size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="rounded border border-custom-border-200 bg-custom-background-90 p-1.5 hover:bg-custom-background-80"
              onClick={() => handleInboxIssueNavigation("next")}
            >
              <ChevronDown size={14} strokeWidth={2} />
            </button>
            <div className="text-sm">
              {currentIssueIndex + 1}/{inboxIssues?.length ?? 0}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAllowed && (issueStatus.status === 0 || issueStatus.status === -2) && (
              <div className="flex-shrink-0">
                <Popover className="relative">
                  <Popover.Button as="button" type="button">
                    <Button variant="neutral-primary" prependIcon={<Clock size={14} strokeWidth={2} />} size="sm">
                      Snooze
                    </Button>
                  </Popover.Button>
                  <Popover.Panel className="absolute right-0 z-10 mt-2 w-80 rounded-md bg-custom-background-100 p-2 shadow-lg">
                    {({ close }) => (
                      <div className="flex h-full w-full flex-col gap-y-1">
                        <DayPicker
                          selected={date ? new Date(date) : undefined}
                          defaultMonth={date ? new Date(date) : undefined}
                          onSelect={(date) => {
                            if (!date) return;
                            setDate(date);
                          }}
                          mode="single"
                          className="rounded-md border border-custom-border-200 p-3"
                          disabled={[
                            {
                              before: tomorrow,
                            },
                          ]}
                        />
                        <Button
                          variant="primary"
                          onClick={() => {
                            close();
                            inboxIssueOperations.updateInboxIssueStatus({
                              status: 0,
                              snoozed_till: new Date(date),
                            });
                          }}
                        >
                          Snooze
                        </Button>
                      </div>
                    )}
                  </Popover.Panel>
                </Popover>
              </div>
            )}

            {isAllowed && issueStatus.status === -2 && (
              <div className="flex-shrink-0">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  prependIcon={<FileStack size={14} strokeWidth={2} />}
                  onClick={() => setSelectDuplicateIssue(true)}
                >
                  Mark as duplicate
                </Button>
              </div>
            )}

            {isAllowed && (issueStatus.status === 0 || issueStatus.status === -2) && (
              <div className="flex-shrink-0">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  prependIcon={<CheckCircle2 className="text-green-500" size={14} strokeWidth={2} />}
                  onClick={() => setAcceptIssueModal(true)}
                >
                  Accept
                </Button>
              </div>
            )}

            {isAllowed && issueStatus.status === -2 && (
              <div className="flex-shrink-0">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  prependIcon={<XCircle className="text-red-500" size={14} strokeWidth={2} />}
                  onClick={() => setDeclineIssueModal(true)}
                >
                  Decline
                </Button>
              </div>
            )}

            {(isAllowed || currentUser?.id === issue?.created_by) && (
              <div className="flex-shrink-0">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  prependIcon={<Trash2 className="text-red-500" size={14} strokeWidth={2} />}
                  onClick={() => setDeleteIssueModal(true)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});
