import {
  CONDITION_EMOJI,
  ITEM_CONDITION_LABELS,
  conditionCounts,
  totalItems,
  type MoveInInspection,
} from '../types/inspection';

/** Plain-text report, identical in layout to the app's generateReport(). */
export function generateInspectionReport(inspection: MoveInInspection): string {
  const created = new Date(inspection.createdAt);
  const dateStr = [
    created.getFullYear(),
    String(created.getMonth() + 1).padStart(2, '0'),
    String(created.getDate()).padStart(2, '0'),
  ].join('-');

  const counts = conditionCounts(inspection);
  const lines: string[] = [
    '🏠 MOVE-IN INSPECTION REPORT',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Property: ${inspection.propertyTitle}`,
    `Tenant: ${inspection.tenantName}`,
    `Date: ${dateStr}`,
    '',
  ];

  for (const room of inspection.rooms) {
    lines.push(`${room.roomIcon} ${room.roomName.toUpperCase()}`);
    for (const item of room.items) {
      const notesPart = item.notes.length > 0 ? `: ${item.notes}` : '';
      lines.push(
        `  ${CONDITION_EMOJI[item.condition]} ${item.name} — ${ITEM_CONDITION_LABELS[item.condition]}${notesPart}`,
      );
    }
    lines.push('');
  }

  lines.push(
    '📊 SUMMARY',
    `Total Items: ${totalItems(inspection)} | Good: ${counts.good} | Minor Wear: ${counts.wear} | Damaged: ${counts.damaged}`,
    `Meter Readings: Electricity: ${inspection.meterElectricity ?? 'N/A'} | Water: ${inspection.meterWater ?? 'N/A'}`,
    '',
  );

  const tenantSigned = inspection.tenantSignature !== null ? inspection.tenantName : 'Pending';
  const landlordSigned =
    inspection.landlordSignature !== null ? (inspection.landlordName ?? 'Landlord') : 'Pending';
  lines.push(`✍️ Signed by: ${tenantSigned} & ${landlordSigned}`, 'Generated via Roost App 📱');

  return lines.join('\n').trimEnd();
}
