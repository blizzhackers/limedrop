import { Checkbox } from "@/components/ui/checkbox";
import { memo } from "react";

export const ItemTypeCheckbox: React.FC<{
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = memo(
  ({ name, checked, onChange }) => (
    <label
      htmlFor={name}
      className="flex items-center gap-1 text-xs 2xl:text-base cursor-pointer select-none"
    >
      <Checkbox
        id={name}
        checked={checked}
        onCheckedChange={onChange}
        className="border-gray-600"
      />
      {name}
    </label>
  ),
  (prev, next) => prev.checked === next.checked && prev.name === next.name,
);
