import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './card.module.css';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  heading?: ReactNode;
  children: ReactNode;
}

export function Card({ heading, children, className, ...props }: CardProps): ReactElement {
  return (
    <section className={[styles.root, className].filter(Boolean).join(' ')} {...props}>
      {heading ? <h2 className={styles.title}>{heading}</h2> : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
