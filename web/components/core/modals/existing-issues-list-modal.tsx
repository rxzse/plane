import React, { useEffect, useState } from "react";
import { Combobox, Dialog, Transition } from "@headlessui/react";
import { Rocket, Search, X } from "lucide-react";
// services
import { ProjectService } from "services/project";
// hooks
import useDebounce from "hooks/use-debounce";
import { usePlatformOS } from "hooks/use-platform-os";
// components
import { IssueSearchModalEmptyState } from "./issue-search-modal-empty-state";
// ui
import { Button, Loader, ToggleSwitch, Tooltip, TOAST_TYPE, setToast } from "@plane/ui";
// types
import { ISearchIssueResponse, TProjectIssuesSearchParams } from "@plane/types";

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
  searchParams: Partial<TProjectIssuesSearchParams>;
  handleOnSubmit: (data: ISearchIssueResponse[]) => Promise<void>;
  workspaceLevelToggle?: boolean;
};

const projectService = new ProjectService();

export const ExistingIssuesListModal: React.FC<Props> = (props) => {
  const {
    workspaceSlug,
    projectId,
    isOpen,
    handleClose: onClose,
    searchParams,
    handleOnSubmit,
    workspaceLevelToggle = false,
  } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  const { isMobile } = usePlatformOS();
  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setSelectedIssues([]);
    setIsWorkspaceLevel(false);
  };

  const onSubmit = async () => {
    if (selectedIssues.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one issue.",
      });

      return;
    }

    setIsSubmitting(true);

    await handleOnSubmit(selectedIssues).finally(() => setIsSubmitting(false));

    handleClose();
  };

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId) return;

    projectService
      .projectIssuesSearch(workspaceSlug as string, projectId as string, {
        search: debouncedSearchTerm,
        ...searchParams,
        workspace_search: isWorkspaceLevel,
      })
      .then((res) => setIssues(res))
      .finally(() => setIsSearching(false));
  }, [debouncedSearchTerm, isOpen, isWorkspaceLevel, projectId, searchParams, workspaceSlug]);

  return (
    <>
      <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setSearchTerm("")} appear>
        <Dialog as="div" className="relative z-20" onClose={handleClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative mx-auto max-w-2xl transform rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
                <Combobox
                  as="div"
                  onChange={(val: ISearchIssueResponse) => {
                    if (selectedIssues.some((i) => i.id === val.id))
                      setSelectedIssues((prevData) => prevData.filter((i) => i.id !== val.id));
                    else setSelectedIssues((prevData) => [...prevData, val]);
                  }}
                >
                  <div className="relative m-1">
                    <Search
                      className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-custom-text-100 text-opacity-40"
                      aria-hidden="true"
                    />
                    <Combobox.Input
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
                      placeholder="Type to search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-4 p-2 text-[0.825rem] text-custom-text-200 sm:flex-row sm:items-center sm:justify-between">
                    {selectedIssues.length > 0 ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {selectedIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className="flex items-center gap-1 whitespace-nowrap rounded-md border border-custom-border-200 bg-custom-background-80 py-1 pl-2 text-xs text-custom-text-100"
                          >
                            {issue.project__identifier}-{issue.sequence_id}
                            <button
                              type="button"
                              className="group p-1"
                              onClick={() => setSelectedIssues((prevData) => prevData.filter((i) => i.id !== issue.id))}
                            >
                              <X className="h-3 w-3 text-custom-text-200 group-hover:text-custom-text-100" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-min whitespace-nowrap rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
                        No issues selected
                      </div>
                    )}
                    {workspaceLevelToggle && (
                      <Tooltip tooltipContent="Toggle workspace level search" isMobile={isMobile}>
                        <div
                          className={`flex flex-shrink-0 cursor-pointer items-center gap-1 text-xs ${
                            isWorkspaceLevel ? "text-custom-text-100" : "text-custom-text-200"
                          }`}
                        >
                          <ToggleSwitch
                            value={isWorkspaceLevel}
                            onChange={() => setIsWorkspaceLevel((prevData) => !prevData)}
                          />
                          <button
                            type="button"
                            onClick={() => setIsWorkspaceLevel((prevData) => !prevData)}
                            className="flex-shrink-0"
                          >
                            Workspace Level
                          </button>
                        </div>
                      </Tooltip>
                    )}
                  </div>

                  <Combobox.Options
                    static
                    className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto"
                  >
                    {searchTerm !== "" && (
                      <h5 className="mx-2 text-[0.825rem] text-custom-text-200">
                        Search results for{" "}
                        <span className="text-custom-text-100">
                          {'"'}
                          {searchTerm}
                          {'"'}
                        </span>{" "}
                        in project:
                      </h5>
                    )}

                    <IssueSearchModalEmptyState
                      debouncedSearchTerm={debouncedSearchTerm}
                      isSearching={isSearching}
                      issues={issues}
                      searchTerm={searchTerm}
                    />

                    {isSearching ? (
                      <Loader className="space-y-3 p-3">
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                      </Loader>
                    ) : (
                      <ul className={`text-sm text-custom-text-100 ${issues.length > 0 ? "p-2" : ""}`}>
                        {issues.map((issue) => {
                          const selected = selectedIssues.some((i) => i.id === issue.id);

                          return (
                            <Combobox.Option
                              key={issue.id}
                              as="label"
                              htmlFor={`issue-${issue.id}`}
                              value={issue}
                              className={({ active }) =>
                                `group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 text-custom-text-200 ${
                                  active ? "bg-custom-background-80 text-custom-text-100" : ""
                                } ${selected ? "text-custom-text-100" : ""}`
                              }
                            >
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={selected} readOnly />
                                <span
                                  className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: issue.state__color,
                                  }}
                                />
                                <span className="flex-shrink-0 text-xs">
                                  {issue.project__identifier}-{issue.sequence_id}
                                </span>
                                {issue.name}
                              </div>
                              <a
                                href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
                                target="_blank"
                                className="z-1 relative hidden text-custom-text-200 hover:text-custom-text-100 group-hover:block"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Rocket className="h-4 w-4" />
                              </a>
                            </Combobox.Option>
                          );
                        })}
                      </ul>
                    )}
                  </Combobox.Options>
                </Combobox>
                <div className="flex items-center justify-end gap-2 p-3">
                  <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  {selectedIssues.length > 0 && (
                    <Button variant="primary" size="sm" onClick={onSubmit} loading={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add selected issues"}
                    </Button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
