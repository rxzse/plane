# Django imports
from django.db.models import (
    Q,
    Count,
)
from django.db.models.functions import Cast
from django.db.models import CharField

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import (
    WorkSpaceMemberSerializer,
    TeamSerializer,
    UserLiteSerializer,
    WorkspaceMemberAdminSerializer,
    WorkspaceMemberMeSerializer,
    ProjectMemberRoleSerializer,
)
from plane.app.views.base import BaseAPIView
from .. import BaseViewSet
from plane.db.models import (
    User,
    Workspace,
    Team,
    ProjectMember,
    Project,
    WorkspaceMember,
)
from plane.app.permissions import (
    WorkSpaceAdminPermission,
    WorkspaceEntityPermission,
    WorkspaceUserPermission,
)
from plane.utils.cache import cache_response, invalidate_cache


class WorkSpaceMemberViewSet(BaseViewSet):
    serializer_class = WorkspaceMemberAdminSerializer
    model = WorkspaceMember

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get_permissions(self):
        if self.action == "leave":
            self.permission_classes = [
                WorkspaceUserPermission,
            ]
        else:
            self.permission_classes = [
                WorkspaceEntityPermission,
            ]

        return super(WorkSpaceMemberViewSet, self).get_permissions()

    search_fields = [
        "member__display_name",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                is_active=True,
            )
            .select_related("workspace", "workspace__owner")
            .select_related("member")
        )

    @cache_response(60 * 60 * 2)
    def list(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            member=request.user,
            workspace__slug=slug,
            is_active=True,
        )

        # Get all active workspace members
        workspace_members = self.get_queryset()

        if workspace_member.role > 10:
            serializer = WorkspaceMemberAdminSerializer(
                workspace_members,
                fields=("id", "member", "role"),
                many=True,
            )
        else:
            serializer = WorkSpaceMemberSerializer(
                workspace_members,
                fields=("id", "member", "role"),
                many=True,
            )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(
        path="/api/workspaces/:slug/members/", url_params=True, user=False
    )
    def partial_update(self, request, slug, pk):
        workspace_member = WorkspaceMember.objects.get(
            pk=pk,
            workspace__slug=slug,
            member__is_bot=False,
            is_active=True,
        )
        if request.user.id == workspace_member.member_id:
            return Response(
                {"error": "You cannot update your own role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the requested user role
        requested_workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )
        # Check if role is being updated
        # One cannot update role higher than his own role
        if (
            "role" in request.data
            and int(request.data.get("role", workspace_member.role))
            > requested_workspace_member.role
        ):
            return Response(
                {
                    "error": "You cannot update a role that is higher than your own role"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = WorkSpaceMemberSerializer(
            workspace_member, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @invalidate_cache(
        path="/api/workspaces/:slug/members/", url_params=True, user=False
    )
    def destroy(self, request, slug, pk):
        # Check the user role who is deleting the user
        workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            pk=pk,
            member__is_bot=False,
            is_active=True,
        )

        # check requesting user role
        requesting_workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )

        if str(workspace_member.id) == str(requesting_workspace_member.id):
            return Response(
                {
                    "error": "You cannot remove yourself from the workspace. Please use leave workspace"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if requesting_workspace_member.role < workspace_member.role:
            return Response(
                {
                    "error": "You cannot remove a user having role higher than you"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            Project.objects.annotate(
                total_members=Count("project_projectmember"),
                member_with_role=Count(
                    "project_projectmember",
                    filter=Q(
                        project_projectmember__member_id=workspace_member.id,
                        project_projectmember__role=20,
                    ),
                ),
            )
            .filter(total_members=1, member_with_role=1, workspace__slug=slug)
            .exists()
        ):
            return Response(
                {
                    "error": "User is a part of some projects where they are the only admin, they should either leave that project or promote another user to admin."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deactivate the users from the projects where the user is part of
        _ = ProjectMember.objects.filter(
            workspace__slug=slug,
            member_id=workspace_member.member_id,
            is_active=True,
        ).update(is_active=False)

        workspace_member.is_active = False
        workspace_member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @invalidate_cache(
        path="/api/workspaces/:slug/members/", url_params=True, user=False
    )
    def leave(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )

        # Check if the leaving user is the only admin of the workspace
        if (
            workspace_member.role == 20
            and not WorkspaceMember.objects.filter(
                workspace__slug=slug,
                role=20,
                is_active=True,
            ).count()
            > 1
        ):
            return Response(
                {
                    "error": "You cannot leave the workspace as you are the only admin of the workspace you will have to either delete the workspace or promote another user to admin."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            Project.objects.annotate(
                total_members=Count("project_projectmember"),
                member_with_role=Count(
                    "project_projectmember",
                    filter=Q(
                        project_projectmember__member_id=request.user.id,
                        project_projectmember__role=20,
                    ),
                ),
            )
            .filter(total_members=1, member_with_role=1, workspace__slug=slug)
            .exists()
        ):
            return Response(
                {
                    "error": "You are a part of some projects where you are the only admin, you should either leave the project or promote another user to admin."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # # Deactivate the users from the projects where the user is part of
        _ = ProjectMember.objects.filter(
            workspace__slug=slug,
            member_id=workspace_member.member_id,
            is_active=True,
        ).update(is_active=False)

        # # Deactivate the user
        workspace_member.is_active = False
        workspace_member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceMemberUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )
        workspace_member.view_props = request.data.get("view_props", {})
        workspace_member.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceMemberUserEndpoint(BaseAPIView):
    def get(self, request, slug):
        workspace_member = WorkspaceMember.objects.get(
            member=request.user,
            workspace__slug=slug,
            is_active=True,
        )
        serializer = WorkspaceMemberMeSerializer(workspace_member)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceProjectMemberEndpoint(BaseAPIView):
    serializer_class = ProjectMemberRoleSerializer
    model = ProjectMember

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug):
        # Fetch all project IDs where the user is involved
        project_ids = (
            ProjectMember.objects.filter(
                member=request.user,
                is_active=True,
            )
            .values_list("project_id", flat=True)
            .distinct()
        )

        # Get all the project members in which the user is involved
        project_members = ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id__in=project_ids,
            is_active=True,
        ).select_related("project", "member", "workspace")
        project_members = ProjectMemberRoleSerializer(
            project_members, many=True
        ).data

        project_members_dict = dict()

        # Construct a dictionary with project_id as key and project_members as value
        for project_member in project_members:
            project_id = project_member.pop("project")
            if str(project_id) not in project_members_dict:
                project_members_dict[str(project_id)] = []
            project_members_dict[str(project_id)].append(project_member)

        return Response(project_members_dict, status=status.HTTP_200_OK)


class TeamMemberViewSet(BaseViewSet):
    serializer_class = TeamSerializer
    model = Team
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    search_fields = [
        "member__display_name",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "workspace__owner")
            .prefetch_related("members")
        )

    def create(self, request, slug):
        members = list(
            WorkspaceMember.objects.filter(
                workspace__slug=slug,
                member__id__in=request.data.get("members", []),
                is_active=True,
            )
            .annotate(member_str_id=Cast("member", output_field=CharField()))
            .distinct()
            .values_list("member_str_id", flat=True)
        )

        if len(members) != len(request.data.get("members", [])):
            users = list(
                set(request.data.get("members", [])).difference(members)
            )
            users = User.objects.filter(pk__in=users)

            serializer = UserLiteSerializer(users, many=True)
            return Response(
                {
                    "error": f"{len(users)} of the member(s) are not a part of the workspace",
                    "members": serializer.data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)

        serializer = TeamSerializer(
            data=request.data, context={"workspace": workspace}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
