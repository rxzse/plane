import { ReactElement, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
// hooks
import { Button, Input, Spinner, TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
import { PageHead } from "components/core";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { useApplication, useUser } from "hooks/store";
// services
// components
// layout
import { ProfileSettingsLayout } from "layouts/settings-layout";
// ui
// types
import { NextPageWithLayout } from "lib/types";
import { UserService } from "services/user.service";

interface FormValues {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const defaultValues: FormValues = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

const userService = new UserService();

const ChangePasswordPage: NextPageWithLayout = observer(() => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  // hooks
  const { theme: themeStore } = useApplication();
  const { currentUser } = useUser();

  const router = useRouter();

  // use form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues });

  const handleChangePassword = async (formData: FormValues) => {
    if (formData.new_password !== formData.confirm_password) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "The new password and the confirm password don't match.",
      });
      return;
    }
    const changePasswordPromise = userService.changePassword(formData);
    setPromiseToast(changePasswordPromise, {
      loading: "Changing password...",
      success: {
        title: "Success!",
        message: () => "Password changed successfully.",
      },
      error: {
        title: "Error!",
        message: () => "Something went wrong. Please try again.",
      },
    });
  };

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.is_password_autoset) router.push("/profile");
    else setIsPageLoading(false);
  }, [currentUser, router]);

  if (isPageLoading)
    return (
      <div className="grid h-screen w-full place-items-center">
        <Spinner />
      </div>
    );

  return (
    <>
      <PageHead title="Profile - Change Password" />
      <div className="flex h-full flex-col">
        <div className="block flex-shrink-0 border-b border-custom-border-200 p-4 md:hidden">
          <SidebarHamburgerToggle onClick={() => themeStore.toggleSidebar()} />
        </div>
        <form
          onSubmit={handleSubmit(handleChangePassword)}
          className="mx-auto mt-16 flex h-full w-full flex-col gap-8 px-8 pb-8 lg:w-3/5"
        >
          <h3 className="text-xl font-medium">Change password</h3>
          <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-10 xl:grid-cols-2 2xl:grid-cols-3">
            <div className="flex flex-col gap-1 ">
              <h4 className="text-sm">Current password</h4>
              <Controller
                control={control}
                name="old_password"
                rules={{
                  required: "This field is required",
                }}
                render={({ field: { value, onChange } }) => (
                  <Input
                    id="old_password"
                    type="password"
                    value={value}
                    onChange={onChange}
                    placeholder="Old password"
                    className="w-full rounded-md font-medium"
                    hasError={Boolean(errors.old_password)}
                  />
                )}
              />
              {errors.old_password && <span className="text-xs text-red-500">{errors.old_password.message}</span>}
            </div>

            <div className="flex flex-col gap-1 ">
              <h4 className="text-sm">New password</h4>
              <Controller
                control={control}
                name="new_password"
                rules={{
                  required: "This field is required",
                }}
                render={({ field: { value, onChange } }) => (
                  <Input
                    id="new_password"
                    type="password"
                    value={value}
                    placeholder="New password"
                    onChange={onChange}
                    className="w-full"
                    hasError={Boolean(errors.new_password)}
                  />
                )}
              />
              {errors.new_password && <span className="text-xs text-red-500">{errors.new_password.message}</span>}
            </div>

            <div className="flex flex-col gap-1 ">
              <h4 className="text-sm">Confirm password</h4>
              <Controller
                control={control}
                name="confirm_password"
                rules={{
                  required: "This field is required",
                }}
                render={({ field: { value, onChange } }) => (
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm password"
                    value={value}
                    onChange={onChange}
                    className="w-full"
                    hasError={Boolean(errors.confirm_password)}
                  />
                )}
              />
              {errors.confirm_password && (
                <span className="text-xs text-red-500">{errors.confirm_password.message}</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? "Changing password..." : "Change password"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
});

ChangePasswordPage.getLayout = function getLayout(page: ReactElement) {
  return <ProfileSettingsLayout>{page}</ProfileSettingsLayout>;
};

export default ChangePasswordPage;
