import {
  DEFAULT_COUNTRY,
  ELECTRICITY_LABELS,
  ELECTRICITY_TYPES,
  HOUSE_TYPES,
  HOUSE_TYPE_LABELS,
  type ListingDraft,
  type StepErrors,
} from '../../../types/listing';
import { ChipGroup, Stepper, TextField } from '../fields';
import styles from '../ListProperty.module.css';

interface BasicsStepProps {
  draft: ListingDraft;
  updateDraft: (change: Partial<ListingDraft>) => void;
  errors: StepErrors;
  clearError: (key: string) => void;
}

export function BasicsStep({ draft, updateDraft, errors, clearError }: BasicsStepProps) {
  return (
    <div className={styles.stepBody}>
      <h2 className={styles.stepTitle}>Basic Information</h2>
      <p className={styles.stepSubtitle}>Title, type, rent, and rooms</p>

      <TextField
        label="Listing title (e.g. Modern 2BR Apartment)"
        value={draft.title}
        onChange={title => {
          updateDraft({ title });
          clearError('title');
        }}
        error={errors.title}
      />
      <TextField
        label="Building / apartment name (optional)"
        value={draft.buildingName}
        onChange={buildingName => updateDraft({ buildingName })}
      />

      <ChipGroup
        label="House Type"
        options={HOUSE_TYPES.map(value => ({ value, label: HOUSE_TYPE_LABELS[value] }))}
        value={draft.houseType}
        onChange={houseType => updateDraft({ houseType })}
      />

      <div className={styles.twoCol}>
        <TextField
          label={`Monthly rent (${DEFAULT_COUNTRY.currencyCode})`}
          value={draft.price}
          onChange={price => {
            updateDraft({ price });
            clearError('price');
          }}
          error={errors.price}
          inputMode="decimal"
        />
        <TextField
          label="Deposit terms (optional)"
          value={draft.deposit}
          onChange={deposit => updateDraft({ deposit })}
        />
      </div>

      <span className={styles.sectionLabel}>Utility Breakdown &amp; Additional Fees</span>
      <div className={styles.threeCol}>
        <TextField
          label="Water fee/mo"
          value={draft.waterFee}
          onChange={waterFee => updateDraft({ waterFee })}
          inputMode="decimal"
        />
        <TextField
          label="Garbage fee/mo"
          value={draft.garbageFee}
          onChange={garbageFee => updateDraft({ garbageFee })}
          inputMode="decimal"
        />
        <TextField
          label="Service charge"
          value={draft.serviceCharge}
          onChange={serviceCharge => updateDraft({ serviceCharge })}
          inputMode="decimal"
        />
      </div>

      <ChipGroup
        label="Electricity Billing"
        options={ELECTRICITY_TYPES.map(value => ({ value, label: ELECTRICITY_LABELS[value] }))}
        value={draft.electricityType}
        onChange={electricityType => updateDraft({ electricityType })}
      />

      <span className={styles.sectionLabel}>Rooms</span>
      <div className={styles.twoCol}>
        <Stepper label="Bedrooms" value={draft.bedrooms} min={0} onChange={bedrooms => updateDraft({ bedrooms })} />
        <Stepper label="Bathrooms" value={draft.bathrooms} min={0} onChange={bathrooms => updateDraft({ bathrooms })} />
      </div>
    </div>
  );
}
