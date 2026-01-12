"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FormField } from "@/server/db/schema/form-fields";

interface PublicFormFieldsProps {
  fields: FormField[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function PublicFormFields({
  fields,
  value,
  onChange,
}: PublicFormFieldsProps) {
  const handleChange = (key: string, val: unknown) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.fieldKey}>
            {field.label}
            {field.isRequired && <span className="ml-1 text-red-500">*</span>}
          </Label>

          {field.fieldType === "text" && (
            <Input
              id={field.fieldKey}
              type="text"
              placeholder={field.placeholder ?? ""}
              value={String(value[field.fieldKey] ?? "")}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              required={field.isRequired}
            />
          )}

          {field.fieldType === "email" && (
            <Input
              id={field.fieldKey}
              type="email"
              placeholder={field.placeholder ?? "example@email.com"}
              value={String(value[field.fieldKey] ?? "")}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              required={field.isRequired}
            />
          )}

          {field.fieldType === "tel" && (
            <Input
              id={field.fieldKey}
              type="tel"
              placeholder={field.placeholder ?? ""}
              value={String(value[field.fieldKey] ?? "")}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              required={field.isRequired}
            />
          )}

          {field.fieldType === "date" && (
            <Input
              id={field.fieldKey}
              type="date"
              value={String(value[field.fieldKey] ?? "")}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              required={field.isRequired}
            />
          )}

          {field.fieldType === "textarea" && (
            <Textarea
              id={field.fieldKey}
              placeholder={field.placeholder ?? ""}
              value={String(value[field.fieldKey] ?? "")}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              required={field.isRequired}
            />
          )}

          {field.fieldType === "select" && (
            <Select
              value={String(value[field.fieldKey] ?? "")}
              onValueChange={(val) => handleChange(field.fieldKey, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.fieldType === "radio" && (
            <RadioGroup
              value={String(value[field.fieldKey] ?? "")}
              onValueChange={(val) => handleChange(field.fieldKey, val)}
            >
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${field.fieldKey}-${option.value}`}
                  />
                  <Label htmlFor={`${field.fieldKey}-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {field.fieldType === "checkbox" && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.fieldKey}-${option.value}`}
                    checked={
                      Array.isArray(value[field.fieldKey])
                        ? (value[field.fieldKey] as string[]).includes(
                            option.value,
                          )
                        : false
                    }
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(value[field.fieldKey])
                        ? (value[field.fieldKey] as string[])
                        : [];
                      const updated = checked
                        ? [...current, option.value]
                        : current.filter((v) => v !== option.value);
                      handleChange(field.fieldKey, updated);
                    }}
                  />
                  <Label htmlFor={`${field.fieldKey}-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
