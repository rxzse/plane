import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { FileText, Plus } from "lucide-react";
// hooks
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// helpers
import { BreadcrumbLink } from "components/common";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
// components
import { useApplication, usePage, useProject } from "hooks/store";
import { ProjectLogo } from "components/project";

export interface IPagesHeaderProps {
  showButton?: boolean;
}

export const PageDetailsHeader: FC<IPagesHeaderProps> = observer((props) => {
  const { showButton = false } = props;

  const router = useRouter();
  const { workspaceSlug, pageId } = router.query;

  const { commandPalette: commandPaletteStore } = useApplication();
  const { currentProjectDetails } = useProject();

  const pageDetails = usePage(pageId as string);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <SidebarHamburgerToggle />
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <span>
                  <span className="hidden md:block">
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                      label={currentProjectDetails?.name ?? "Project"}
                      icon={
                        currentProjectDetails && (
                          <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                            <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
                          </span>
                        )
                      }
                    />
                  </span>
                  <span className="md:hidden">
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                      label={"..."}
                    />
                  </span>
                </span>
              }
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages`}
                  label="Pages"
                  icon={<FileText className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={pageDetails?.name ?? "Page"}
                  icon={<FileText className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
          </Breadcrumbs>
        </div>
      </div>
      {showButton && (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            prependIcon={<Plus />}
            size="sm"
            onClick={() => commandPaletteStore.toggleCreatePageModal(true)}
          >
            Create Page
          </Button>
        </div>
      )}
    </div>
  );
});
