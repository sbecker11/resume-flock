// Core type definitions for resume-flock application
// Provides type safety for Vue 3 components and composables

export interface JobData {
  employer: string;
  role: string;
  start: string; // Date string
  end: string | 'CURRENT_DATE'; // Date string or current marker
  startDate?: string; // Alternative field name
  Description?: string;
  'job-skills'?: Record<string, string>; // skill ID -> skill name mapping
  references?: string[];
}

export interface JobPosition {
  x: number;
  y: number;
  z?: number;
}

export interface ColorPalette {
  name: string;
  colors: string[]; // Hex color strings
}

export interface FocalPointState {
  x: number;
  y: number;
  mode: 'locked' | 'following' | 'dragging';
}

export interface SortRule {
  field: 'startDate' | 'employer' | 'role';
  direction: 'asc' | 'desc';
}

export interface AppState {
  version: string;
  lastUpdated: string;
  
  // User preferences
  layout: {
    orientation: 'scene-left' | 'scene-right';
    scenePercentage: number;
    resumePercentage: number;
  };
  
  resizeHandle: {
    stepCount: number;
  };
  
  focalPoint: {
    mode: string;
  };
  
  badgeToggle: {
    mode: string; // BadgeMode enum
  };
  
  badges: {
    height: string;
    padding: string;
    verticalMargin: string;
    borderRadius: string;
    borderWidth: string;
    fontSize: string;
    fontWeight: string;
    transition: string;
    spacing: {
      vertical: number;
      horizontal: number;
    };
    states: {
      normal: BadgeStateStyle;
      hovered: BadgeStateStyle;
      selected: BadgeStateStyle;
    };
  };
  
  selectedJobNumber: number | null;
  lastVisitedJobNumber: number | null;
  
  resume: {
    sortRule: SortRule;
  };
  
  theme: {
    colorPalette: string; // filename
    brightnessFactorSelected: number;
    brightnessFactorHovered: number;
    borderSettings: {
      normal: BorderStyle;
      hovered: BorderStyle;
      selected: BorderStyle;
    };
    rDivBorderOverrideSettings: {
      normal: BorderOverrideStyle;
      hovered: BorderOverrideStyle;
      selected: BorderOverrideStyle;
    };
  };
  
  color: {
    palettes: Record<string, string[]>; // palette name -> colors
  };
  
  constants: AppConstants;
}

export interface BadgeStateStyle {
  borderWidth: string;
  transform: string;
  boxShadow: string;
}

export interface BorderStyle {
  padding: string;
  innerBorderWidth: string;
  innerBorderColor: string;
  outerBorderWidth: string;
  outerBorderColor: string;
  borderRadius: string;
}

export interface BorderOverrideStyle {
  padding: string;
  innerBorderWidth: string;
  marginTop: string;
}

export interface AppConstants {
  zIndex: {
    root: number;
    scene: number;
    sceneGradients: number;
    timeline: number;
    connectionLines: number;
    badges: number;
    backgroundMax: number;
    cardsMin: number;
    cardsMax: number;
    bullsEye: number;
    selectedCard: number;
    focalPoint: number;
    aimPoint: number;
  };
  cards: {
    meanWidth: number;
    minHeight: number;
    maxXOffset: number;
    maxWidthOffset: number;
    minZDiff: number;
  };
  timeline: {
    pixelsPerYear: number;
    paddingTop: number;
    gradientLength: string;
  };
  resizeHandle: {
    width: number;
    shadowWidth: number;
    shadowBlur: number;
    defaultWidthPercent: number;
  };
  animation: {
    durations: {
      fast: string;
      medium: string;
      slow: string;
      spinner: string;
    };
    autoScroll: {
      repeatMillis: number;
      maxVelocity: number;
      minVelocity: number;
      changeThreshold: number;
      scrollZonePercentage: number;
    };
  };
  performance: {
    thresholds: {
      resizeTime: number;
      scrollTime: number;
      memoryUsage: number;
    };
    debounceTimeout: number;
  };
  typography: {
    fontSizes: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
      xxlarge: string;
      timeline: string;
    };
    fontFamily: string;
  };
  visualEffects: {
    parallax: {
      xExaggerationFactor: number;
      yExaggerationFactor: number;
    };
    depthEffects: {
      minBrightnessPercent: number;
      blurScaleFactor: number;
      filterMultipliers: {
        brightness: { min: number; factor: number };
        blur: { min: number; factor: number };
        contrast: { min: number; factor: number };
        saturate: { min: number; factor: number };
      };
    };
  };
}

// Event types for better type safety in event handling
export interface JobSelectedEvent {
  jobNumber: number;
  dataJobObject: JobData | null;
  previousSelection: number | null;
  source: string;
}

export interface JobHoveredEvent {
  jobNumber: number;
}

export interface BullsEyeMovedEvent {
  position: { x: number; y: number };
}

export interface ColorPaletteChangedEvent {
  filename: string;
  paletteName: string;
  previousFilename: string;
}

// Composable return types for better intellisense
export interface UseJobSelectionReturn {
  selectedJobNumber: Ref<number | null>;
  selectJob: (jobNumber: number, source?: string) => void;
  clearSelection: (source?: string) => void;
  getSelectedJob: () => JobData | null;
}

export interface UseFocalPointReturn {
  position: ComputedRef<{ x: number; y: number }>;
  mode: ComputedRef<string>;
  isLocked: ComputedRef<boolean>;
  isFollowing: ComputedRef<boolean>;
  isDragging: ComputedRef<boolean>;
  setPosition: (x: number, y: number, source?: string) => void;
  setTarget: (x: number, y: number, source?: string) => void;
  cycleMode: () => void;
}

export interface UseColorPaletteReturn {
  colorPalettes: Ref<Record<string, string[]>>;
  orderedPaletteNames: Ref<string[]>;
  filenameToNameMap: Ref<Record<string, string>>;
  isLoading: Ref<boolean>;
  currentPaletteFilename: Ref<string | null>;
  currentPaletteName: ComputedRef<string | null>;
  currentPalette: ComputedRef<string[]>;
  setCurrentPalette: (filename: string) => Promise<void>;
  loadPalettes: () => Promise<void>;
}

export interface UseAppStateReturn {
  appState: DeepReadonly<Ref<AppState | null>>;
  isLoading: DeepReadonly<Ref<boolean>>;
  isLoaded: DeepReadonly<Ref<boolean>>;
  loadError: DeepReadonly<Ref<Error | null>>;
  loadAppState: () => Promise<AppState>;
  saveAppState: () => Promise<AppState>;
  updateAppState: (updates: Partial<AppState>) => Promise<AppState>;
}

// Import Vue types for composable returns
import type { Ref, ComputedRef, DeepReadonly } from 'vue';