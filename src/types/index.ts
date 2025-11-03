export interface Time {
    hour: number;
    minute: number;
}

export interface TimePeriodHour {
    startHour: number;
    endHour: number;
}

export interface Schedule {
  amWindow: ScheduleWindow;
  pmWindow: ScheduleWindow;
}

export interface ScheduleWindow {
  start: Date;
  end: Date;
  prices: number[];
}

export interface PriceSlot {
  SEK_per_kWh: number;
  EUR_per_kWh: number;
  EXR: number;
  time_start: string; // e.g. "2022-11-23T23:45:00+01:00"
  time_end: string; // e.g. "2022-11-24T00:00:00+01:00"
}

export interface FoxEssScheduleModel {
  enable1: boolean;
  enable2: boolean;
  startTime1: { hour: number; minute: number };
  endTime1: { hour: number; minute: number };
  startTime2: { hour: number; minute: number };
  endTime2: { hour: number; minute: number };
}

export interface DischargePeriods {
  am: TimePeriodHour;
  pm: TimePeriodHour;
}

export interface ChargePeriods {
  am: TimePeriodHour;
  pm: TimePeriodHour;
}