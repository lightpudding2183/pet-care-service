import { useCallback, useEffect, useState } from 'react';
import {
  clearAvailabilityRequest, getAvailabilityRequest, updateAvailabilityRequest,
} from '../api/providers.api';
import { emptySchedule, scheduleToSlots, slotsToSchedule } from '../constants/availability';

interface AvailabilityDay {
  enabled: boolean;
  start: string;
  end: string;
}

type AvailabilitySchedule = Record<number, AvailabilityDay>;

interface PreservedSlot {
  [key: string]: unknown;
}

interface DayPatch {
  [key: string]: unknown;
}

export default function useAvailability(providerId: string) {
  const [schedule, setSchedule] = useState<AvailabilitySchedule>(emptySchedule);
  const [preserved, setPreserved] = useState<PreservedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = slotsToSchedule(await getAvailabilityRequest(providerId));
      setSchedule(result.schedule);
      setPreserved(result.preserved);
      setDirty(false);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => { load(); }, [load]);

  const setDay = useCallback((dow: string, patch: DayPatch) => {
    const day = Number(dow);
    setSchedule((s) => ({ ...s, [day]: { ...s[day], ...patch } }));
    setDirty(true);
  }, []);

  // save/clear throw on failure so the screen can show the message
  const save = useCallback(async () => {
    setSaving(true);
    try {
      await updateAvailabilityRequest(providerId, scheduleToSlots(schedule, preserved));
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [providerId, schedule, preserved]);

  const clear = useCallback(async () => {
    setSaving(true);
    try {
      await clearAvailabilityRequest(providerId);
      setSchedule(emptySchedule());
      setPreserved([]);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [providerId]);

  return { schedule, loading, saving, error, dirty, setDay, save, clear, reload: load };
}