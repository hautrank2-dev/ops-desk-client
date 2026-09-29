"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";

const schema = z.object({
  quantity: z.number({ error: "Must be a number" }).int().min(1, "At least 1"),
  locationId: z.string().optional(),
  ownerDeptId: z.string().optional(),
});

export type AssetItemFormValues = z.infer<typeof schema>;

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMutation: UseMutationResult<any, Error, Record<string, unknown>>;
  onCancel: () => void;
};

export function AssetItemForm({ createMutation, onCancel }: Props) {
  const { locations, departments } = useApp();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AssetItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, locationId: "", ownerDeptId: "" },
  });

  const onSubmit = (values: AssetItemFormValues) => {
    const body: Record<string, unknown> = { quantity: values.quantity };
    if (values.locationId) body.locationId = values.locationId;
    if (values.ownerDeptId) body.ownerDeptId = values.ownerDeptId;
    createMutation.mutate(body, {
      onSuccess: () => reset({ quantity: 1, locationId: "", ownerDeptId: "" }),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field data-invalid={!!errors.quantity || undefined}>
        <FieldLabel>Quantity</FieldLabel>
        <Controller
          control={control}
          name="quantity"
          render={({ field }) => (
            <Input
              type="number"
              min={1}
              aria-invalid={!!errors.quantity}
              {...field}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
          )}
        />
        <FieldError errors={[errors.quantity]} />
      </Field>

      <Field data-invalid={!!errors.locationId || undefined}>
        <FieldLabel>Location <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
        <Controller
          control={control}
          name="locationId"
          render={({ field }) => (
            <Select
              value={field.value ?? ""}
              onValueChange={field.onChange}
              items={locations.map((l) => ({ value: l._id, label: l.name }))}
            >
              <SelectTrigger aria-invalid={!!errors.locationId}>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError errors={[errors.locationId]} />
      </Field>

      <Field data-invalid={!!errors.ownerDeptId || undefined}>
        <FieldLabel>Owner Department <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
        <Controller
          control={control}
          name="ownerDeptId"
          render={({ field }) => (
            <Select
              value={field.value ?? ""}
              onValueChange={field.onChange}
              items={departments.map((d) => ({ value: d._id, label: d.name }))}
            >
              <SelectTrigger aria-invalid={!!errors.ownerDeptId}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError errors={[errors.ownerDeptId]} />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Add Items
        </Button>
      </DialogFooter>
    </form>
  );
}
