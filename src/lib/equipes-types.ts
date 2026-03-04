export interface WorkerRoleFromApi {
  id: string;
  name: string;
}

export interface TeamFromApi {
  id: string;
  name: string;
  createdAt?: string;
  workerRoleIds: string[];
  workerRoles?: WorkerRoleFromApi[];
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
