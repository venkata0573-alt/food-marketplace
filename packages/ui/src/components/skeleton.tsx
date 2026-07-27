import type { HTMLAttributes, ReactElement } from 'react';

import styles from './skeleton.module.css';

export function SkeletonLine({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div aria-hidden className={[styles.line, className].filter(Boolean).join(' ')} {...props} />
  );
}

export function SkeletonStack({ lines = 3 }: { lines?: number }): ReactElement {
  return (
    <div className={styles.stack} aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLine key={index} />
      ))}
    </div>
  );
}
