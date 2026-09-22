import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/shared/lib/cn";
import { Select, type SelectOption } from "@/shared/ui/Select";

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

export type AdminFieldProps =
  AdminFieldInputProps | AdminFieldTextareaProps | AdminFieldSelectProps;

export const AdminField = ({
  className,
  description,
  label,
  ...props
}: AdminFieldProps) => (
  <label className={cn("block", className)}>
    <span className="mb-2 block text-xs font-extrabold text-gray-500">
      {label}
    </span>

    {"options" in props && props.options ? (
      <Select {...props} />
    ) : "multiline" in props && props.multiline ? (
      <textarea
        {...props}
        rows={props.rows ?? 5}
        className={cn("h-auto py-3", fieldClassName)}
      />
    ) : (
      <input {...props} className={cn("h-10", fieldClassName)} />
    )}

    {description && (
      <span className="mt-2 block text-xs leading-5 font-semibold text-gray-400">
        {description}
      </span>
    )}
  </label>
);
