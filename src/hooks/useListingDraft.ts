import { useCallback, useEffect, useState } from 'react';
import { emptyListingDraft, STEP_COUNT, type ListingDraft } from '../types/listing';

const STORAGE_PREFIX = 'roost.listingDraft.v1:';

interface DraftState {
  draft: ListingDraft;
  /** Backend id once the draft has been saved; later saves update it. */
  listingId: number | null;
  step: number;
}

function initialState(): DraftState {
  return { draft: emptyListingDraft(), listingId: null, step: 0 };
}

function load(key: string): DraftState {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initialState();
    const stored = JSON.parse(raw) as Partial<DraftState>;
    const empty = emptyListingDraft();
    return {
      draft: { ...empty, ...stored.draft, amenities: { ...empty.amenities, ...stored.draft?.amenities } },
      listingId: typeof stored.listingId === 'number' ? stored.listingId : null,
      step: Math.min(Math.max(Number(stored.step) || 0, 0), STEP_COUNT - 1),
    };
  } catch {
    return initialState();
  }
}

/**
 * The listing form's state, kept in this browser as you go so a refresh or a
 * closed tab doesn't lose it (uploaded photos are already on the server, only
 * their links are kept here). Private to the signed-in user.
 */
export function useListingDraft(userId: number) {
  const key = `${STORAGE_PREFIX}${userId}`;
  const [state, setState] = useState<DraftState>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage full or blocked: the form still works, it just won't survive a refresh */
    }
  }, [key, state]);

  const updateDraft = useCallback(
    (change: Partial<ListingDraft> | ((d: ListingDraft) => ListingDraft)) =>
      setState(s => ({
        ...s,
        draft: typeof change === 'function' ? change(s.draft) : { ...s.draft, ...change },
      })),
    [],
  );
  const setStep = useCallback((step: number) => setState(s => ({ ...s, step })), []);
  const setListingId = useCallback((listingId: number) => setState(s => ({ ...s, listingId })), []);
  const discard = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setState(initialState());
  }, [key]);

  return { ...state, updateDraft, setStep, setListingId, discard };
}
