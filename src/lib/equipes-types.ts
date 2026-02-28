export interface TeamFromApi {
  id: string;
  name: string;
  membersCount?: number | null;
  members?: string[];
  createdAt?: string;
  workerIds: string[];
}

export interface WorkerFromApi {
  id: string;
  name: string;
  phone?: string;
  [key: string]: unknown;
}

export interface TeamListResponse {
  teams: TeamFromApi[];
}

export interface WorkerListResponse {
  workers: WorkerFromApi[];
}
