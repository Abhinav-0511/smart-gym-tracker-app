import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  sanitizeDecimalString,
  sanitizeIntegerString,
} from "@/lib/input-sanitizers";

type NumericVariant = "decimal" | "integer";

export interface NumericInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "onChange" | "type" | "inputMode"
  > {
  /** Current string value (kept as a string so partial input like "12." is preserved). */
  value: string;
  /** Called with the sanitized value on every change/paste. */
  onValueChange: (value: string) => void;
  /** "decimal" allows a single decimal point; "integer" keeps whole numbers only. */
  variant?: NumericVariant;
  /** Permit a single leading minus sign (default false). */
  allowNegative?: boolean;
}

/**
 * A number field that prevents invalid input as the user types. Renders as a
 * text input (not `type="number"`, which leaks scientific notation and locale
 * quirks) with the correct mobile keyboard via `inputMode`, and sanitizes every
 * change — including pasted values — so letters, emojis, extra decimal points,
 * and disallowed signs never reach state.
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    { value, onValueChange, variant = "decimal", allowNegative = false, ...props },
    ref,
  ) => {
    const sanitize =
      variant === "integer" ? sanitizeIntegerString : sanitizeDecimalString;

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={variant === "integer" ? "numeric" : "decimal"}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(event) =>
          onValueChange(sanitize(event.target.value, { allowNegative }))
        }
        {...props}
      />
    );
  },
);

NumericInput.displayName = "NumericInput";
