import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Dialog on desktop, bottom sheet on phones. Closes on Escape and backdrop click. */
export function Modal({ title, onClose, children, footer }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className={styles.header}>
          <h2 className={styles.title} id={titleId}>{title}</h2>
          <button className={styles.close} onClick={onClose} type="button" aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
