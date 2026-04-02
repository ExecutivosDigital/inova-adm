export type ServiceRequestStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export const SERVICE_REQUEST_STATUS_LABELS: Record<
  ServiceRequestStatus,
  string
> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export type ServiceRequestStatusVariant =
  | "warning"
  | "default"
  | "success"
  | "destructive";

export const SERVICE_REQUEST_STATUS_VARIANT: Record<
  ServiceRequestStatus,
  ServiceRequestStatusVariant
> = {
  pending: "warning",
  in_progress: "default",
  completed: "success",
  cancelled: "destructive",
};

export function getServiceRequestStatusLabel(status: string): string {
  return (
    SERVICE_REQUEST_STATUS_LABELS[status as ServiceRequestStatus] ?? status
  );
}

export function getServiceRequestStatusVariant(
  status: string,
): ServiceRequestStatusVariant {
  return (
    SERVICE_REQUEST_STATUS_VARIANT[status as ServiceRequestStatus] ?? "warning"
  );
}

export interface ServiceRequestFromApi {
  id: string;
  code: number;
  status: ServiceRequestStatus;
  description: string | null;
  resolution: string | null;
  workOrderId: string;
  cipServiceId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  workOrderCipService: {
    cancellationReason: string | null;
    cancellationReasonId: string | null;
    cancellationReasonRef: {
      id: string;
      name: string;
    } | null;
    workOrder: {
      id: string;
      code: number;
      status: string;
      scheduledAt: string | null;
      workOrderWorkers: Array<{
        worker: { id: string; name: string };
      }>;
    };
    cipService: {
      serviceModel: { id: string; name: string } | null;
      cip: {
        subset: {
          set: {
            equipment: {
              id: string;
              tag: string;
              name: string | null;
              sector: { id: string; name: string } | null;
            };
          };
        };
      };
    };
  };
}

export interface ServiceRequestStats {
  totalThisMonth: number;
  pending: number;
  inProgress: number;
  completedThisMonth: number;
  topReasons: Array<{ reason: string; count: number }>;
}
