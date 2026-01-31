/**
 * Tipos alinhados ao retorno da API de equipamentos (inova-api).
 * GET /equipment → { equipments: EquipmentFromApi[] }
 * GET /equipment/single/:id → { equipment: EquipmentFromApi }
 */

export type CriticalityApi = "A" | "B" | "C";

export interface SectorFromApi {
  id: string;
  name: string;
}

export interface CostCenterFromApi {
  id: string;
  name: string;
}

export interface EquipmentPhotoFromApi {
  id: string;
  url: string;
  fullUrl: string;
}

export interface CipFromApi {
  id: string;
  name: string;
  code: string;
  position: string;
  cipServices?: unknown[];
}

export interface SubsetFromApi {
  id: string;
  name: string;
  code: string;
  position: string;
  cips: CipFromApi[];
}

export interface SetFromApi {
  id: string;
  name: string;
  code: string;
  position: string;
  subsets: SubsetFromApi[];
}

export interface ManufacturerFromApi {
  id: string;
  name: string;
}

export interface EquipmentTypeFromApi {
  id: string;
  name: string;
}

/** MaterialEquipment (vínculo material-equipamento) - usado no detalhe */
export interface MaterialEquipmentFromApi {
  id: string;
  materialId: string;
  volume?: number;
  material?: { id: string; name: string };
}

export interface EquipmentFromApi {
  id: string;
  tag: string;
  name: string | null;
  model: string | null;
  year: string | null;
  description: string | null;
  position: string | null;
  sectorId: string;
  costCenterId: string | null;
  criticality: CriticalityApi | null;
  companyId: string;
  manufacturerId: string | null;
  equipmentTypeId: string | null;
  power: number | null;
  RPM: number | null;
  initialRotation: number | null;
  finalRotation: number | null;
  operationTemperature: number | null;
  innerDiameter: number | null;
  externalDiameter: number | null;
  bearingWidth: number | null;
  DN: number | null;
  physicalPosition: string | null;
  operationRegime: string | null;
  contaminationLevel: string | null;
  lubricationSystemId: string | null;
  mainComponentId: string | null;
  filterOil: string | null;
  filterPressure: string | null;
  filterSuction: string | null;
  filterReturn: string | null;
  iso4406Required: string | null;
  particleCountRequired: string | null;
  pqiRequired: string | null;
  varnishPotentialRequired: string | null;
  varnishPotentialLevel: string | null;
  concentrationPercentage: number | null;
  phLevel: number | null;
  alkalinity: number | null;
  trampOilPercentage: number | null;
  tanRequired: number | null;
  tbnRequired: number | null;
  demulsibilityRequired: number | null;
  oxidationRequired: number | null;
  rpvotRequired: number | null;
  ftirRequired: number | null;
  clayContentRequired: number | null;
  createdAt: string;
  sector?: SectorFromApi;
  costCenter?: CostCenterFromApi | null;
  manufacturer?: ManufacturerFromApi | null;
  equipmentType?: EquipmentTypeFromApi | null;
  photos?: EquipmentPhotoFromApi[];
  sets?: SetFromApi[];
  materials?: MaterialEquipmentFromApi[];
}

export interface EquipmentListResponse {
  equipments: EquipmentFromApi[];
}

export interface EquipmentDetailResponse {
  equipment: EquipmentFromApi;
}

/** Mapeamento criticidade API → label e variant para UI */
export const criticalityMap: Record<
  CriticalityApi,
  { label: string; variant: "high" | "medium" | "low" }
> = {
  A: { label: "Alta", variant: "high" },
  B: { label: "Média", variant: "medium" },
  C: { label: "Baixa", variant: "low" },
};
