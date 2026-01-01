"use client";
import { useForm, useStore } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Cancel01Icon,
  Delete02Icon,
  PlusSignIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/file-upload";

import {
  roleSchema,
  typeSchema,
  workPreferenceSchema,
  normalizeString,
  OnboardingFormData,
} from "./schema";
import {
  POPULAR_ROLES,
  EMPLOYMENT_TYPES,
  WORK_MODES,
} from "@/constants/onboarding";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { Spinner } from "../ui/spinner";
import { useRouter } from "next/navigation";

export const OnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [roleInput, setRoleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const response = await client.onboarding.post(data);
      if (response.error) {
        throw response.error;
      }
    },
    onSuccess: () => {
      toast.success("Onboarding completed successfully!");
      router.push("/dashboard");
    },
    onError: () => {
      toast.error("Failed to complete onboarding. Please try again.");
    },
  });

  const form = useForm({
    defaultValues: {
      role: [] as string[],
      type: "" as "full-time" | "part-time" | "internship",
      mode: "" as "remote" | "hybrid" | "on-site",
      location: [] as string[],
      resume: null as File | null,
    },
    onSubmit: async ({ value }) => {
      console.log("Form submitted:", value);
      mutate({
        ...value,
        resume: value.resume!,
      });
    },
  });

  const validateStep = (stepIndex: number): boolean => {
    if (stepIndex === 0) {
      return roleSchema.safeParse({ role: values.role }).success;
    }
    if (stepIndex === 1) {
      return typeSchema.safeParse({ type: values.type }).success;
    }
    if (stepIndex === 2) {
      return workPreferenceSchema.safeParse({
        mode: values.mode,
        location: values.location,
      }).success;
    }
    if (stepIndex === 3) {
      // Resume is now required
      return values.resume !== null && values.resume !== undefined;
    }
    return false;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    } else {
      toast.error("Please complete all required fields");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const roleExists = (roleName: string, roles: string[]) => {
    const normalized = normalizeString(roleName);
    return roles.some(
      (role) => role.trim() && normalizeString(role) === normalized,
    );
  };

  type RolesArrayField = {
    state: {
      value: Array<string>;
      meta?: { isTouched?: boolean; isValid?: boolean; errors?: unknown };
    };
    handleChange: (v: Array<string>) => void;
  };

  const addRoleFromInput = (field: RolesArrayField) => {
    const trimmed = roleInput.trim();
    const currentRoles = field.state.value;
    if (!trimmed) {
      toast.error("Role cannot be empty");
      return;
    }
    if (roleExists(trimmed, currentRoles)) {
      toast.error("This role already exists");
      return;
    }
    if (currentRoles.length >= 2) {
      toast.error("Maximum 2 roles allowed");
      return;
    }
    field.handleChange([...currentRoles, trimmed]);
    setRoleInput("");
  };

  const addPopularRole = (roleName: string, field: RolesArrayField) => {
    const currentRoles = field.state.value;
    if (roleExists(roleName, currentRoles)) {
      toast.error("This role already exists");
      return;
    }
    if (currentRoles.length >= 2) {
      toast.error("Maximum 2 roles allowed");
      return;
    }
    field.handleChange([...currentRoles, roleName]);
  };

  const removeRole = (index: number, field: RolesArrayField) => {
    const currentRoles = field.state.value;
    field.handleChange(currentRoles.filter((_, i: number) => i !== index));
  };

  const addLocation = (field: RolesArrayField) => {
    const trimmed = locationInput.trim();
    const current = field.state.value;
    if (!trimmed) {
      toast.error("Location cannot be empty");
      return;
    }
    if (current.includes(trimmed)) {
      toast.error("This location already exists");
      return;
    }
    if (current.length >= 2) {
      toast.error("Maximum 2 locations allowed");
      return;
    }
    field.handleChange([...current, trimmed]);
    setLocationInput("");
  };

  const removeLocation = (index: number, field: RolesArrayField) => {
    const current = field.state.value;
    field.handleChange(current.filter((_, i) => i !== index));
  };

  const isLastStep = currentStep === 3;
  const isFirstStep = currentStep === 0;

  const values = useStore(form.store, (state) => state.values);

  return (
    <div>
      <div>
        {isLastStep ? (
          <>
            <h1 className="text-xl font-bold">
              Personalize your career experience
            </h1>
            <p className="text-muted-foreground text-sm">
              Add your resume to get started.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">Preferences</h1>
            <p className="text-muted-foreground text-sm">
              Select your preferences to get started.
            </p>
          </>
        )}

        {/* STEP INDICATOR */}
        <div className="my-5">
          <div className="mb-2 flex justify-between">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`mx-1 h-2 flex-1 rounded-full transition-all duration-300 ${
                  index <= currentStep ? "bg-primary" : "bg-accent"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">
            Step {currentStep + 1} of 4
          </p>
        </div>

        {/* FORM INPUTS */}
        <div className="relative min-h-[40vh] overflow-hidden sm:min-h-[60vh]">
          {/* ROLES */}
          <FieldGroup
            className={`transition-all duration-300 ease-in-out ${
              currentStep === 0
                ? "translate-x-0 opacity-100"
                : currentStep > 0
                  ? "pointer-events-none absolute inset-0 -translate-x-full opacity-0"
                  : "pointer-events-none absolute inset-0 translate-x-full opacity-0"
            }`}
          >
            <form.Field name="role">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                const currentRoles = field.state.value;
                const availablePopularRoles = POPULAR_ROLES.filter(
                  (role) => !roleExists(role, currentRoles),
                );
                return (
                  <FieldSet className="gap-4">
                    <FieldLegend>
                      What job roles are you looking for?
                    </FieldLegend>
                    <FieldDescription>
                      Add up to 2 roles (e.g., Software Engineer, Product
                      Manager)
                    </FieldDescription>
                    <FieldGroup className="gap-4">
                      <div className="flex gap-2">
                        <div className="flex w-full space-x-1">
                          <Input
                            placeholder="e.g. Backend Developer"
                            value={roleInput}
                            className="flex-1"
                            onChange={(e) => setRoleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addRoleFromInput(field);
                              }
                            }}
                            disabled={field.state.value.length >= 2}
                          />
                          <Button
                            type="button"
                            onClick={() => addRoleFromInput(field)}
                            variant="default"
                            className="mr-1"
                            disabled={
                              !roleInput.trim() || currentRoles.length >= 2
                            }
                          >
                            <HugeiconsIcon icon={PlusSignIcon} />
                            Add
                          </Button>
                        </div>
                      </div>
                      {availablePopularRoles.length > 0 &&
                        currentRoles.length < 2 && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm">
                              Popular Roles
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {availablePopularRoles.map((role) => (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                                  onClick={() => addPopularRole(role, field)}
                                >
                                  <HugeiconsIcon
                                    icon={PlusSignIcon}
                                    className="mr-1 h-3 w-3"
                                  />
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">
                          Selected Roles ({currentRoles.length}/2)
                        </Label>
                        {currentRoles.length === 0 ? (
                          <div className="rounded-sm border-2 border-dashed p-2 text-center">
                            <p className="text-muted-foreground text-sm">
                              No roles added yet. Start typing or select from
                              popular roles.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-muted flex flex-wrap gap-2 rounded-sm border p-2">
                            {currentRoles.map((role, index) => (
                              <Badge key={index} variant="default">
                                {role}
                                <button
                                  type="button"
                                  onClick={() => removeRole(index, field)}
                                  className="hover:text-destructive ml-1 transition-colors"
                                  aria-label={`Remove ${role}`}
                                >
                                  <HugeiconsIcon
                                    icon={Cancel01Icon}
                                    className="h-4 w-4"
                                  />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </FieldGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </FieldSet>
                );
              }}
            </form.Field>
          </FieldGroup>

          {/* EMPLOYMENT TYPE */}
          <FieldGroup
            className={`transition-all duration-300 ease-in-out ${
              currentStep === 1
                ? "translate-x-0 opacity-100"
                : currentStep > 1
                  ? "pointer-events-none absolute inset-0 -translate-x-full opacity-0"
                  : "pointer-events-none absolute inset-0 translate-x-full opacity-0"
            }`}
          >
            <form.Field name="type">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <FieldSet className="gap-4">
                    <FieldLegend>What type of employment?</FieldLegend>
                    <FieldDescription>
                      Select the job type you prefer
                    </FieldDescription>
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(
                          value as "full-time" | "part-time" | "internship",
                        )
                      }
                    >
                      {EMPLOYMENT_TYPES.map((type) => (
                        <FieldLabel
                          className="hover:bg-muted cursor-pointer"
                          key={type.value}
                          htmlFor={type.value}
                        >
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              value={type.value}
                              id={type.value}
                              aria-label={type.label}
                            />
                            <FieldContent>
                              <FieldTitle>{type.label}</FieldTitle>
                              <FieldDescription>
                                {type.description}
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </FieldSet>
                );
              }}
            </form.Field>
          </FieldGroup>

          {/* WORK MODE & LOCATION */}
          <FieldGroup
            className={`transition-all duration-300 ease-in-out ${
              currentStep === 2
                ? "translate-x-0 opacity-100"
                : currentStep > 2
                  ? "pointer-events-none absolute inset-0 -translate-x-full opacity-0"
                  : "pointer-events-none absolute inset-0 translate-x-full opacity-0"
            }`}
          >
            <form.Field name="mode">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                const currentMode = values.mode;
                return (
                  <FieldSet className="gap-4">
                    <FieldLegend>Where do you want to work?</FieldLegend>
                    <FieldDescription>
                      Select your preferred work mode
                    </FieldDescription>
                    <RadioGroup
                      value={currentMode}
                      onValueChange={(value) => {
                        field.handleChange(
                          value as "on-site" | "remote" | "hybrid",
                        );
                        form.setFieldValue("location", []);
                        setLocationInput("");
                      }}
                    >
                      {WORK_MODES.map((work) => (
                        <FieldLabel
                          className="hover:bg-muted cursor-pointer"
                          key={work.value}
                          htmlFor={work.value}
                        >
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              value={work.value}
                              id={work.value}
                              aria-label={work.label}
                            />
                            <FieldContent>
                              <FieldTitle>{work.label}</FieldTitle>
                              <FieldDescription>
                                {work.description}
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </FieldSet>
                );
              }}
            </form.Field>

            <form.Field name="location">
              {(field) => {
                const currentMode = form.getFieldValue("mode");
                return (
                  <FieldSet className="gap-4">
                    <FieldLegend>
                      {currentMode === "remote"
                        ? "Which countries are you open to?"
                        : "Which cities are you targeting?"}
                    </FieldLegend>
                    <FieldDescription>
                      {currentMode === "remote"
                        ? "Add up to 2 countries (e.g., 'United States', 'Canada')"
                        : "Add up to 2 cities with country (e.g., 'San Francisco, USA')"}
                    </FieldDescription>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addLocation(field);
                            }
                          }}
                          placeholder={
                            currentMode === "remote"
                              ? "Enter country"
                              : "Enter city, country"
                          }
                          className="flex-1"
                          disabled={field.state.value.length >= 2}
                        />
                        <Button
                          type="button"
                          onClick={() => addLocation(field)}
                          disabled={
                            !locationInput.trim() ||
                            field.state.value.length >= 2
                          }
                        >
                          <HugeiconsIcon icon={PlusSignIcon} />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">
                          Selected Locations ({field.state.value.length}/2)
                        </Label>
                        {field.state.value.length === 0 ? (
                          <div className="rounded border-2 border-dashed p-4 text-center">
                            <p className="text-muted-foreground text-sm">
                              No locations added yet
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {field.state.value.map((location, index) => (
                              <div
                                key={index}
                                className="bg-muted flex items-center justify-between rounded border px-3 py-2"
                              >
                                <span className="font-medium">{location}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLocation(index, field)}
                                >
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                    className="h-4 w-4"
                                  />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </FieldSet>
                );
              }}
            </form.Field>
          </FieldGroup>

          {/* RESUME UPLOAD */}
          <FieldGroup
            className={`transition-all duration-300 ease-in-out ${
              currentStep === 3
                ? "translate-x-0 opacity-100"
                : currentStep > 3
                  ? "pointer-events-none absolute inset-0 -translate-x-full opacity-0"
                  : "pointer-events-none absolute inset-0 translate-x-full opacity-0"
            }`}
          >
            <form.Field name="resume">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && field.state.value === null;
                return (
                  <FieldSet className="gap-4">
                    <FieldLegend>Resume</FieldLegend>
                    <FieldDescription>
                      Upload your resume to personalize your experience.
                      (Required)
                    </FieldDescription>
                    <FileUpload
                      accept=".pdf"
                      maxSize={5 * 1024 * 1024}
                      onFileSelect={(file) => field.handleChange(file)}
                      value={field.state.value as File | null}
                      label="Add your resume"
                      description="Drag and drop your resume here, or click to browse. Accepted format: PDF. Max size: 5MB."
                      showPreview
                    />
                    {isInvalid && (
                      <p className="text-destructive text-sm">
                        Resume is required
                      </p>
                    )}
                  </FieldSet>
                );
              }}
            </form.Field>
          </FieldGroup>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-5 flex justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep}
          className="flex-1 items-center gap-2 font-bold"
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={3}
            className="h-4 w-4"
          />
          Back
        </Button>
        {!isLastStep ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!validateStep(currentStep)}
            className="flex-1 items-center gap-2 font-bold"
          >
            Next
            <HugeiconsIcon
              icon={ArrowRight02Icon}
              strokeWidth={3}
              className="h-4 w-4"
            />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => {
              if (validateStep(currentStep)) {
                form.handleSubmit();
              }
            }}
            disabled={!validateStep(currentStep) || isPending}
            className="flex-1 items-center gap-2 font-bold"
          >
            {isPending ? (
              <>
                Submitting...
                <Spinner />
              </>
            ) : (
              <>
                Submit
                <HugeiconsIcon
                  icon={Tick01Icon}
                  strokeWidth={3}
                  className="h-4 w-4"
                />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
