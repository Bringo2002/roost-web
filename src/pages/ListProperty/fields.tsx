import { useId, type ReactNode } from 'react';
import { Icon } from '../../components/Icon/Icon';
import styles from './ListProperty.module.css';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel';
  autoComplete?: string;
  /** Short text shown inside the field's left edge, e.g. a currency code. */
  prefix?: ReactNode;
  maxLength?: number;
}

export function TextField({ label, value, onChange, error, inputMode, autoComplete, prefix, maxLength }: TextFieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={`${styles.inputWrap} ${error ? styles.inputWrapError : ''}`}>
        {prefix && <span className={styles.inputPrefix}>{prefix}</span>}
        <input
          id={id}
          className={styles.input}
          value={value}
          onChange={e => onChange(e.target.value)}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error && <p className={styles.fieldError} id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

interface ChipGroupProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** One-of-many choice shown as buttons. */
export function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  const labelId = useId();
  return (
    <div className={styles.field}>
      <span className={styles.sectionLabel} id={labelId}>{label}</span>
      <div className={styles.chips} role="group" aria-labelledby={labelId}>
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            className={`${styles.chip} ${value === option.value ? styles.chipOn : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface StepperProps {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, min, onChange }: StepperProps) {
  return (
    <div className={styles.stepper}>
      <span className={styles.stepperLabel}>{label}</span>
      <div className={styles.stepperRow}>
        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Icon name="minus" size={16} />
        </button>
        <span className={styles.stepperValue} aria-live="polite">{value}</span>
        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() => onChange(value + 1)}
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  );
}
