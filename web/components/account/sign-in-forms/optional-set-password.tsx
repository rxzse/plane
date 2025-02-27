import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
// services
import { AuthService } from "services/auth.service";
// hooks
import { useEventTracker } from "hooks/store";
// ui
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// icons
import { Eye, EyeOff } from "lucide-react";
import { PASSWORD_CREATE_SELECTED, PASSWORD_CREATE_SKIPPED } from "constants/event-tracker";

type Props = {
  email: string;
  handleSignInRedirection: () => Promise<void>;
};

type TCreatePasswordFormValues = {
  email: string;
  password: string;
};

const defaultValues: TCreatePasswordFormValues = {
  email: "",
  password: "",
};

// services
const authService = new AuthService();

export const SignInOptionalSetPasswordForm: React.FC<Props> = (props) => {
  const { email, handleSignInRedirection } = props;
  // states
  const [isGoingToWorkspace, setIsGoingToWorkspace] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // store hooks
  const { captureEvent } = useEventTracker();
  // form info
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
  } = useForm<TCreatePasswordFormValues>({
    defaultValues: {
      ...defaultValues,
      email,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleCreatePassword = async (formData: TCreatePasswordFormValues) => {
    const payload = {
      password: formData.password,
    };

    await authService
      .setPassword(payload)
      .then(async () => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Password created successfully.",
        });
        captureEvent(PASSWORD_CREATE_SELECTED, {
          state: "SUCCESS",
          first_time: false,
        });
        await handleSignInRedirection();
      })
      .catch((err) => {
        captureEvent(PASSWORD_CREATE_SELECTED, {
          state: "FAILED",
          first_time: false,
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        });
      });
  };

  const handleGoToWorkspace = async () => {
    setIsGoingToWorkspace(true);
    await handleSignInRedirection().finally(() => {
      captureEvent(PASSWORD_CREATE_SKIPPED, {
        state: "SUCCESS",
        first_time: false,
      });
      setIsGoingToWorkspace(false);
    });
  };

  return (
    <>
      <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">Set your password</h1>
      <p className="mt-2.5 text-center text-sm text-onboarding-text-200">
        If you{"'"}d like to do away with codes, set a password here.
      </p>
      <form onSubmit={handleSubmit(handleCreatePassword)} className="mx-auto mt-5 space-y-4 sm:w-96">
        <Controller
          control={control}
          name="email"
          rules={{
            required: "Email is required",
            validate: (value) => checkEmailValidity(value) || "Email is invalid",
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id="email"
              name="email"
              type="email"
              value={value}
              onChange={onChange}
              ref={ref}
              hasError={Boolean(errors.email)}
              placeholder="name@company.com"
              className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 text-onboarding-text-400"
              disabled
            />
          )}
        />
        <div>
          <Controller
            control={control}
            name="password"
            rules={{
              required: "Password is required",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.password)}
                  placeholder="Enter password"
                  className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                  minLength={8}
                  autoFocus
                />
                {showPassword ? (
                  <EyeOff
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <Eye
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
            )}
          />
          <p className="mt-2 pb-3 text-xs text-onboarding-text-200">
            Whatever you choose now will be your account{"'"}s password until you change it.
          </p>
        </div>
        <div className="space-y-2.5">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="xl"
            disabled={!isValid}
            loading={isSubmitting}
          >
            Set password
          </Button>
          <Button
            type="button"
            variant="outline-primary"
            className="w-full"
            size="xl"
            onClick={handleGoToWorkspace}
            loading={isGoingToWorkspace}
          >
            Skip to workspace
          </Button>
        </div>
      </form>
    </>
  );
};
