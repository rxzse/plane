import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// icons
import { Crown } from "lucide-react";
// ui
import { getButtonStyling } from "@plane/ui";
// constants
import { WORKSPACE_ACTIVE_CYCLES_DETAILS } from "constants/cycle";
// helper
import { cn } from "helpers/common.helper";
// hooks
import { useUser } from "hooks/store";

export const WorkspaceActiveCyclesUpgrade = observer(() => {
  // store hooks
  const { currentUser } = useUser();

  const isDarkMode = currentUser?.theme.theme === "dark";

  return (
    <div className="flex flex-col gap-10 pt-8 px-8 rounded-xl h-full vertical-scrollbar scrollbar-lg">
      <div
        className={cn("flex item-center justify-between rounded-xl min-h-[25rem]", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": currentUser?.theme.theme === "dark",
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": currentUser?.theme.theme === "light",
        })}
      >
        <div className="relative px-14 flex flex-col gap-7 justify-center lg:w-1/2">
          <div className="flex flex-col gap-2 max-w-64">
            <h2 className="text-2xl font-semibold">On-demand snapshots of all your cycles</h2>
            <p className="text-base font-medium text-custom-text-300">
              Monitor cycles across projects, track high-priority issues, and zoom in cycles that need attention.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              className={`${getButtonStyling("primary", "md")} cursor-pointer`}
              href="https://plane.so/pricing"
              target="_blank"
              rel="noreferrer"
            >
              <Crown className="h-3.5 w-3.5" />
              Upgrade
            </a>
          </div>
          <span className="absolute left-0 top-0">
            <Image
              src={`/workspace-active-cycles/cta-l-1-${isDarkMode ? "dark" : "light"}.webp`}
              height={125}
              width={125}
              className="rounded-xl"
              alt="l-1"
            />
          </span>
        </div>
        <div className="relative w-1/2 hidden lg:block">
          <span className="absolute right-0 bottom-0">
            <Image
              src={`/workspace-active-cycles/cta-r-1-${isDarkMode ? "dark" : "light"}.webp`}
              height={420}
              width={500}
              alt="r-1"
            />
          </span>
          <span className="absolute right-1/2 -bottom-16 rounded-xl">
            <Image
              src={`/workspace-active-cycles/cta-r-2-${isDarkMode ? "dark" : "light"}.webp`}
              height={210}
              width={280}
              alt="r-2"
            />
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 pb-8 h-full">
        {WORKSPACE_ACTIVE_CYCLES_DETAILS.map((item) => (
          <div key={item.title} className="flex flex-col gap-2 p-4 min-h-32 w-full bg-custom-background-80 rounded-md">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{item.title}</h3>
              <item.icon className="text-blue-500 h-4 w-4" />
            </div>
            <span className="text-sm text-custom-text-300">{item.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
