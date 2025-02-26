import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// components
import { PageHead } from "components/core";
import { ProjectViewsHeader } from "components/headers";
import { ProjectViewsList } from "components/views";
// hooks
import { useProject } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectViewsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { projectId } = router.query;
  // store
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Views` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <ProjectViewsList />
    </>
  );
});

ProjectViewsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectViewsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectViewsPage;
