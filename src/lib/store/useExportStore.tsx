import { create } from 'zustand';
import { ExportConfig } from '@/components/studio/studio.types';

type ExportStoreState = {
  settings: ExportConfig;
  doExport: boolean;
};

type Actions = {
  setSettings: (settings: ExportConfig) => void;
  updateSettings: (settings: Partial<ExportConfig>) => void;
  setDoExport: (doExport: boolean) => void;
};

const initialState: ExportStoreState = {
  settings: {
    resolution: 'fhd_1080',
    frameRate: 30,
    bitRates: 10,
  },
  doExport: false,
};

const useExportStore = create<ExportStoreState & Actions>((set, get) => {
  return {
    ...initialState,
    setSettings: (settings: ExportConfig) => {
      set({ settings });
    },
    updateSettings: (_settings: Partial<ExportConfig>) => {
      set({ settings: { ...get().settings, ..._settings } });
    },
    setDoExport: (doExport: boolean) => {
      set({ doExport });
    },
  };
});

export default useExportStore;
