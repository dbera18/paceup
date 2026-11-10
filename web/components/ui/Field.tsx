import { ReactNode } from "react";
import { fieldError, hint as hintClass, label as labelClass } from "./styles";

type Props = {
  id: string;
  label: string;
  optional?: boolean;
  error?: string | null;
  children: ReactNode;
  aside?: ReactNode; // something on the right of the label, like a unit toggle
  footer?: ReactNode; // something under the input, like a character count
};

// Label + input + error message, always laid out the same way.
export default function Field({ id, label, optional, error, children, aside, footer }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label} {optional && <span className={hintClass}>(optional)</span>}
        </label>
        {aside}
      </div>
      {children}
      {(error || footer) && (
        <div className="flex items-start justify-between gap-3">
          <p id={`${id}-error`} className={fieldError} role={error ? "alert" : undefined}>
            {error}
          </p>
          {footer}
        </div>
      )}
    </div>
  );
}
