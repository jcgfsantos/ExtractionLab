import React, { useEffect, useRef, useState } from 'react';

interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number;
  onChangeValue: (value: number) => void;
  emptyFallback?: number;
  transformValue?: (value: number) => number;
}

const VALID_DECIMAL_PATTERN = /^-?\d*([.,]\d*)?$/;

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChangeValue,
  emptyFallback = 0,
  transformValue,
  onFocus,
  onBlur,
  min: _min,
  max: _max,
  step: _step,
  ...rest
}) => {
  const [text, setText] = useState<string>(() => (Number.isFinite(value) ? String(value) : ''));
  const isFocusedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setText(Number.isFinite(value) ? String(value) : '');
    }
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    onFocus?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (!VALID_DECIMAL_PATTERN.test(raw)) {
      return;
    }

    setText(raw);

    const normalized = raw.trim().replace(',', '.');
    if (
      normalized === '' ||
      normalized === '-' ||
      normalized === '.' ||
      normalized === '-.'
    ) {
      return;
    }

    const parsed = Number(normalized);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      const next = transformValue ? transformValue(parsed) : parsed;
      onChangeValue(next);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    const normalized = text.trim().replace(',', '.');

    if (
      normalized === '' ||
      normalized === '-' ||
      normalized === '.' ||
      normalized === '-.' ||
      Number.isNaN(Number(normalized)) ||
      !Number.isFinite(Number(normalized))
    ) {
      const fallback = transformValue ? transformValue(emptyFallback) : emptyFallback;
      setText(String(fallback));
      onChangeValue(fallback);
    } else {
      const parsed = Number(normalized);
      const next = transformValue ? transformValue(parsed) : parsed;
      setText(String(next));
      onChangeValue(next);
    }

    onBlur?.(e);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      {...rest}
    />
  );
};
