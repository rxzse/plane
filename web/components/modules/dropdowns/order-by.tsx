import { ArrowDownWideNarrow, Check, ChevronDown } from "lucide-react";
// ui
import { CustomMenu, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TModuleOrderByOptions } from "@plane/types";
// constants
import { MODULE_ORDER_BY_OPTIONS } from "constants/module";

type Props = {
  onChange: (value: TModuleOrderByOptions) => void;
  value: TModuleOrderByOptions | undefined;
};

export const ModuleOrderByDropdown: React.FC<Props> = (props) => {
  const { onChange, value } = props;

  const orderByDetails = MODULE_ORDER_BY_OPTIONS.find((option) => value?.includes(option.key));

  const isDescending = value?.[0] === "-";

  return (
    <CustomMenu
      customButton={
        <div className={cn(getButtonStyling("neutral-primary", "sm"), "px-2 text-custom-text-300")}>
          <ArrowDownWideNarrow className="h-3 w-3" />
          {orderByDetails?.label}
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        </div>
      }
      placement="bottom-end"
      maxHeight="lg"
      closeOnSelect
    >
      {MODULE_ORDER_BY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() => {
            if (isDescending) onChange(`-${option.key}` as TModuleOrderByOptions);
            else onChange(option.key);
          }}
        >
          {option.label}
          {value?.includes(option.key) && <Check className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2" />
      <CustomMenu.MenuItem
        className="flex items-center justify-between gap-2"
        onClick={() => {
          if (isDescending) onChange(value.slice(1) as TModuleOrderByOptions);
        }}
      >
        Ascending
        {!isDescending && <Check className="h-3 w-3" />}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem
        className="flex items-center justify-between gap-2"
        onClick={() => {
          if (!isDescending) onChange(`-${value}` as TModuleOrderByOptions);
        }}
      >
        Descending
        {isDescending && <Check className="h-3 w-3" />}
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
};
