import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
// component
import { ArchiveRestore } from "lucide-react";
import { CustomSelect, Loader, ToggleSwitch } from "@plane/ui";
import { SelectMonthModal } from "components/automation";
// icon
// constants
import { EUserProjectRoles, PROJECT_AUTOMATION_MONTHS } from "constants/project";
import { useProject, useUser } from "hooks/store";
// types
import { IProject } from "@plane/types";

type Props = {
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

const initialValues: Partial<IProject> = { archive_in: 1 };

export const AutoArchiveAutomation: React.FC<Props> = observer((props) => {
  const { handleChange } = props;
  // states
  const [monthModal, setmonthModal] = useState(false);
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;

  return (
    <>
      <SelectMonthModal
        type="auto-archive"
        initialValues={initialValues}
        isOpen={monthModal}
        handleClose={() => setmonthModal(false)}
        handleChange={handleChange}
      />
      <div className="flex flex-col gap-4 border-b border-custom-border-100 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded bg-custom-background-90 p-3">
              <ArchiveRestore className="h-4 w-4 flex-shrink-0 text-custom-text-100" />
            </div>
            <div className="">
              <h4 className="text-sm font-medium">Auto-archive closed issues</h4>
              <p className="text-sm tracking-tight text-custom-text-200">
                Plane will auto archive issues that have been completed or canceled.
              </p>
            </div>
          </div>
          <ToggleSwitch
            value={currentProjectDetails?.archive_in !== 0}
            onChange={() =>
              currentProjectDetails?.archive_in === 0
                ? handleChange({ archive_in: 1 })
                : handleChange({ archive_in: 0 })
            }
            size="sm"
            disabled={!isAdmin}
          />
        </div>

        {currentProjectDetails ? (
          currentProjectDetails.archive_in !== 0 && (
            <div className="ml-12">
              <div className="flex w-full items-center justify-between gap-2 rounded border border-custom-border-200 bg-custom-background-90 px-5 py-4">
                <div className="w-1/2 text-sm font-medium">Auto-archive issues that are closed for</div>
                <div className="w-1/2">
                  <CustomSelect
                    value={currentProjectDetails?.archive_in}
                    label={`${currentProjectDetails?.archive_in} ${
                      currentProjectDetails?.archive_in === 1 ? "month" : "months"
                    }`}
                    onChange={(val: number) => {
                      handleChange({ archive_in: val });
                    }}
                    input
                    disabled={!isAdmin}
                  >
                    <>
                      {PROJECT_AUTOMATION_MONTHS.map((month) => (
                        <CustomSelect.Option key={month.label} value={month.value}>
                          <span className="text-sm">{month.label}</span>
                        </CustomSelect.Option>
                      ))}

                      <button
                        type="button"
                        className="flex w-full select-none items-center rounded px-1 py-1.5 text-sm text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => setmonthModal(true)}
                      >
                        Customize time range
                      </button>
                    </>
                  </CustomSelect>
                </div>
              </div>
            </div>
          )
        ) : (
          <Loader className="ml-12">
            <Loader.Item height="50px" />
          </Loader>
        )}
      </div>
    </>
  );
});
