import type { InputHTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './input.module.css';

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
}

export function InputField({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: InputFieldProps): ReactElement {
  const inputId = id ?? props.name;
  return (
    <label className={styles.root} htmlFor={inputId}>
      <span className={styles.label}>{label}</span>
      <input
        id={inputId}
        className={[styles.input, className].filter(Boolean).join(' ')}
        {...props}
      />
      {hint}
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
