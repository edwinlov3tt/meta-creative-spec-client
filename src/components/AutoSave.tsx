import { useEffect } from 'react';
import { useCreativeStore } from '@/stores/creativeStore';

export const AutoSave: React.FC = () => {
  const isDirty = useCreativeStore(state => state.isDirty);
  const saveSnapshot = useCreativeStore(state => state.saveSnapshot);
  const setAutosaveState = useCreativeStore(state => state.setAutosaveState);

  useEffect(() => {
    if (!isDirty) {
      setAutosaveState({ isSaving: false });
      return undefined;
    }

    setAutosaveState({ isSaving: true, error: null });

    const timer = window.setTimeout(() => {
      try {
        const timestamp = Date.now();
        saveSnapshot(timestamp);
      } catch (error) {
        console.error('Auto-save failed', error);
        setAutosaveState({ isSaving: false, error: 'Failed to auto-save' });
      }
    }, 2000);

    return () => {
      window.clearTimeout(timer);
      setAutosaveState({ isSaving: false });
    };
  }, [isDirty, saveSnapshot, setAutosaveState]);

  return null;
};
