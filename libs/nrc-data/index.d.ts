// NRC Data Types

export interface NrcType {
  id: string;
  name: {
    en: string;
    mm: string;
  };
  description: {
    en: string;
    mm: string;
  };
}

export interface NrcState {
  id: string;
  code: string;
  number: {
    en: string;
    mm: string;
  };
  name: {
    en: string;
    mm: string;
  };
}

export interface NrcTownship {
  id: string;
  stateId: string;
  name: {
    en: string;
    mm: string;
  };
  short: {
    en: string;
    mm: string;
  };
  townshipCode: string | null;
  originalId: number;
}

export declare const nrcTypes: NrcType[];
export declare const nrcStates: NrcState[];
