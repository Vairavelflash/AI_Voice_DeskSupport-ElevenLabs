export interface Company {
  name: string;
  established: string;
  branches: string[];
  employees: number;
  mission: string;
  services: string[];
}

export interface CallState {
  isOpen: boolean;
  isJoined: boolean;
  isMuted: boolean;
  isAudioChecked: boolean;
}