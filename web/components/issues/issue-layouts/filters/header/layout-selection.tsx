import React from "react";

// ui
import { Tooltip } from "@plane/ui";
// types
import { ISSUE_LAYOUTS } from "constants/issue";
import { TIssueLayouts } from "@plane/types";
// hooks
import { usePlatformOS } from "hooks/use-platform-os";

type Props = {
  layouts: TIssueLayouts[];
  onChange: (layout: TIssueLayouts) => void;
  selectedLayout: TIssueLayouts | undefined;
};

export const LayoutSelection: React.FC<Props> = (props) => {
  const { layouts, onChange, selectedLayout } = props;
  const { isMobile } = usePlatformOS();

  return (
    <div className="flex items-center gap-1 rounded bg-custom-background-80 p-1">
      {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout) => (
        <Tooltip key={layout.key} tooltipContent={layout.title} isMobile={isMobile}>
          <button
            type="button"
            className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded transition-all hover:bg-custom-background-100 ${
              selectedLayout == layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
            }`}
            onClick={() => onChange(layout.key)}
          >
            <layout.icon
              size={14}
              strokeWidth={2}
              className={`h-3.5 w-3.5 ${
                selectedLayout == layout.key ? "text-custom-text-100" : "text-custom-text-200"
              }`}
            />
          </button>
        </Tooltip>
      ))}
    </div>
  );
};
