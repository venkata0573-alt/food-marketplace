import type { ButtonHTMLAttributes, ReactElement } from 'react';

import styles from './button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps): ReactElement {
  const classes = [
    styles.root,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} disabled={disabled} {...props} />;
}
