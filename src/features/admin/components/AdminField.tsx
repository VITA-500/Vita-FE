"use client";

import type {
  ChangeEvent,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useState } from "react";
import { FilterDropdown } from "@/features/admin/components/FilterDropdown";
import { cn } from "@/shared/lib/cn";
import type { SelectOption } from "@/shared/ui/Select";

const fieldClassName =
  "border-border focus:border-brand focus:ring-brand/10 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-gray-700 transition outline-none placeholder:font-medium placeholder:text-gray-400 focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-gray-100";

type AdminFieldBaseProps = {
  className?: string;
  description?: string;
  label: string;
};

type AdminFieldInputProps = AdminFieldBaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    multiline?: false;
    options?: never;
  };

type AdminFieldTextareaProps = AdminFieldBaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true;
    options?: never;
  };

type AdminFieldSelectProps = AdminFieldBaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
    multiline?: false;
    options: readonly SelectOption[];
    placeholder?: string;
  };
type AdminSelectFieldProps = Omit<
  AdminFieldSelectProps,
  keyof AdminFieldBaseProps
>;

export type AdminFieldProps =
  AdminFieldInputProps | AdminFieldTextareaProps | AdminFieldSelectProps;

export const AdminField = ({
  className,
  description,
  label,
  ...props
}: AdminFieldProps) => {
  const isRequired = Boolean(props.required);
  let field;

  if ("options" in props && props.options) {
    field = <AdminSelectField {...props} />;
  } else if ("multiline" in props && props.multiline) {
    const { multiline, ...textareaProps } = props;
    void multiline;
    field = (
      <textarea
        {...textareaProps}
        rows={textareaProps.rows ?? 5}
        className={cn("h-auto py-3", fieldClassName)}
      />
    );
  } else {
    const { multiline, ...inputProps } = props;
    void multiline;
    field = <input {...inputProps} className={cn("h-10", fieldClassName)} />;
  }

  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-xs font-extrabold text-gray-500">
        {label}
        {isRequired && (
          <span className="ml-1 text-[11px] font-extrabold text-red-500">
            필수
          </span>
        )}
      </span>

      {field}

      {description && (
        <span className="mt-2 block text-xs leading-5 font-semibold text-gray-400">
          {description}
        </span>
      )}
    </label>
  );
};

const normalizeSelectValue = (value: AdminSelectFieldProps["defaultValue"]) => {
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (value === undefined) return "";
  return String(value);
};

const AdminSelectField = ({
  defaultValue,
  disabled,
  name,
  onChange,
  options,
  placeholder,
  required,
  value: controlledValue,
  ...props
}: AdminSelectFieldProps) => {
  const initialValue = normalizeSelectValue(defaultValue);
  const normalizedControlledValue =
    controlledValue === undefined ? undefined : String(controlledValue);
  const [value, setValue] = useState(normalizedControlledValue ?? initialValue);
  const currentValue = normalizedControlledValue ?? value;
  const dropdownOptions = placeholder
    ? [{ label: placeholder, value: "" }, ...options]
    : options;

  const handleChange = (nextValue: string) => {
    if (normalizedControlledValue === undefined) {
      setValue(nextValue);
    }

    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
    } as ChangeEvent<HTMLSelectElement>);
  };

  return (
    <>
      <FilterDropdown
        aria-label={props["aria-label"] ?? placeholder ?? name}
        className="w-full"
        options={dropdownOptions}
        value={currentValue}
        onChange={handleChange}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          disabled={disabled}
          required={required}
        />
      )}
    </>
  );
};
