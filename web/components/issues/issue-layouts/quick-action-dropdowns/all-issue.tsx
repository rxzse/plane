import { useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Copy, ExternalLink, Link, Pencil, Trash2 } from "lucide-react";
// hooks
import { ArchiveIcon, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
import { ArchiveIssueModal, CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// ui
// components
import { EIssuesStoreType } from "constants/issue";
import { STATE_GROUPS } from "constants/state";
import { copyUrlToClipboard } from "helpers/string.helper";
import { useEventTracker, useProjectState } from "hooks/store";
// components
// helpers
// types
import { TIssue } from "@plane/types";
import { IQuickActionProps } from "../list/list-view-types";
// constants

export const AllIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleArchive,
    customActionButton,
    portalElement,
    readOnly = false,
  } = props;
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { setTrackElement } = useEventTracker();
  const { getStateById } = useProjectState();
  // derived values
  const stateDetails = getStateById(issue.state_id);
  const isEditingAllowed = !readOnly;
  // auth
  const isArchivingAllowed = handleArchive && isEditingAllowed;
  const isInArchivableGroup =
    !!stateDetails && [STATE_GROUPS.completed.key, STATE_GROUPS.cancelled.key].includes(stateDetails?.group);

  const issueLink = `${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`;

  const handleOpenInNewTab = () => window.open(`/${issueLink}`, "_blank");
  const handleCopyIssueLink = () =>
    copyUrlToClipboard(issueLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
    },
    ["id"]
  );

  return (
    <>
      <ArchiveIssueModal
        data={issue}
        isOpen={archiveIssueModal}
        handleClose={() => setArchiveIssueModal(false)}
        onSubmit={handleArchive}
      />
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDelete}
      />
      <CreateUpdateIssueModal
        isOpen={createUpdateIssueModal}
        onClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(undefined);
        }}
        data={issueToEdit ?? duplicateIssuePayload}
        onSubmit={async (data) => {
          if (issueToEdit && handleUpdate) await handleUpdate(data);
        }}
        storeType={EIssuesStoreType.PROJECT}
      />
      <CustomMenu
        menuItemsClassName="z-[14]"
        placement="bottom-start"
        customButton={customActionButton}
        portalElement={portalElement}
        maxHeight="lg"
        closeOnSelect
        ellipsis
      >
        {isEditingAllowed && (
          <CustomMenu.MenuItem
            onClick={() => {
              setTrackElement("Global issues");
              setIssueToEdit(issue);
              setCreateUpdateIssueModal(true);
            }}
          >
            <div className="flex items-center gap-2">
              <Pencil className="h-3 w-3" />
              Edit
            </div>
          </CustomMenu.MenuItem>
        )}
        <CustomMenu.MenuItem onClick={handleOpenInNewTab}>
          <div className="flex items-center gap-2">
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem onClick={handleCopyIssueLink}>
          <div className="flex items-center gap-2">
            <Link className="h-3 w-3" />
            Copy link
          </div>
        </CustomMenu.MenuItem>
        {isEditingAllowed && (
          <CustomMenu.MenuItem
            onClick={() => {
              setTrackElement("Global issues");
              setCreateUpdateIssueModal(true);
            }}
          >
            <div className="flex items-center gap-2">
              <Copy className="h-3 w-3" />
              Make a copy
            </div>
          </CustomMenu.MenuItem>
        )}
        {isArchivingAllowed && (
          <CustomMenu.MenuItem onClick={() => setArchiveIssueModal(true)} disabled={!isInArchivableGroup}>
            {isInArchivableGroup ? (
              <div className="flex items-center gap-2">
                <ArchiveIcon className="h-3 w-3" />
                Archive
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <ArchiveIcon className="h-3 w-3" />
                <div className="-mt-1">
                  <p>Archive</p>
                  <p className="text-xs text-custom-text-400">
                    Only completed or canceled
                    <br />
                    issues can be archived
                  </p>
                </div>
              </div>
            )}
          </CustomMenu.MenuItem>
        )}
        {isEditingAllowed && (
          <CustomMenu.MenuItem
            onClick={() => {
              setTrackElement("Global issues");
              setDeleteIssueModal(true);
            }}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-3 w-3" />
              Delete
            </div>
          </CustomMenu.MenuItem>
        )}
      </CustomMenu>
    </>
  );
});
