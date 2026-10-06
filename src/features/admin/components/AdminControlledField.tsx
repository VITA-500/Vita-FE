"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  AdminField,
  type AdminFieldProps,
} from "@/features/admin/components/AdminField";

type AdminControlledFieldProps<TFieldValues extends FieldValues> = Omit<
  AdminFieldProps,
  "name" | "onChange" | "value"
> & {
  control: Control<TFieldValues>;
  formatValue?: (value: unknown) => string;
  name: FieldPath<TFieldValues>;
  value?: string;
} & Record<string, unknown>;

export const AdminControlledField = <TFieldValues extends FieldValues>({
  control,
  formatValue,
  name,
  value,
  ...props
}: AdminControlledFieldProps<TFieldValues>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => {
      const fieldProps = {
        ...props,
        name: field.name,
        value: value ?? formatValue?.(field.value) ?? field.value ?? "",
        onChange: field.onChange,
      } as AdminFieldProps;

      return <AdminField {...fieldProps} />;
    }}
  />
);
