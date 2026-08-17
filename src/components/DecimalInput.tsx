"use client";

import { useEffect, useState } from "react";
import { parseMoney } from "@/lib/money";

function toDisplay(value: number, emptyIfZero: boolean, integer?: boolean) {
  if (emptyIfZero && !value) return "";
  if (integer || Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(".", ",");
}

export function DecimalInput({
  value,
  onChange,
  ariaLabel,
  className,
  integer,
  emptyIfZero = true,
  disabled,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  ariaLabel: string;
  className?: string;
  integer?: boolean;
  emptyIfZero?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(toDisplay(value, emptyIfZero, integer));

  useEffect(() => {
    if (!focused) setText(toDisplay(value, emptyIfZero, integer));
  }, [value, focused, emptyIfZero, integer]);

  return (
    <input
      className={className}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      value={focused ? text : toDisplay(value, emptyIfZero, integer)}
      placeholder={placeholder || (integer ? "1" : "0,00")}
      onFocus={(e) => {
        setFocused(true);
        setText(toDisplay(value, emptyIfZero, integer));
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/\s/g, "");
        const allowed = integer ? /^\d*$/ : /^\d*[.,]?\d*$/;
        if (raw !== "" && !allowed.test(raw)) return;
        setText(raw);
        if (integer) onChange(raw === "" ? 0 : parseInt(raw, 10) || 0);
        else onChange(parseMoney(raw));
      }}
      onBlur={() => setFocused(false)}
    />
  );
}
