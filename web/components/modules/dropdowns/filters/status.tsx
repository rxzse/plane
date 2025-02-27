import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// components
import { FilterHeader, FilterOption } from "components/issues";
// ui
import { ModuleStatusIcon } from "@plane/ui";
// types
import { TModuleStatus } from "@plane/types";
// constants
import { MODULE_STATUS } from "constants/module";

type Props = {
  appliedFilters: TModuleStatus[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterStatus: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filteredOptions = MODULE_STATUS.filter((p) => p.value.includes(searchQuery.toLowerCase()));

  return (
    <>
      <FilterHeader
        title={`Status${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((status) => (
              <FilterOption
                key={status.value}
                isChecked={appliedFilters?.includes(status.value) ? true : false}
                onClick={() => handleUpdate(status.value)}
                icon={<ModuleStatusIcon status={status.value} />}
                title={status.label}
              />
            ))
          ) : (
            <p className="text-xs italic text-custom-text-400">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
