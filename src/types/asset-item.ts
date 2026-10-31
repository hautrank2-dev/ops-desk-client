import { UserModel } from './user';
import { DepartmentModel } from './department';
import { LocationModel } from './location';
import { AssetModel } from './asset';

export enum ItemStatus {
  Available = "Available",
  InUse = "InUse",
  UnderMaintenance = "UnderMaintenance",
  Retired = "Retired",
}

// backward-compat alias
export const AssetItemStatus = ItemStatus;
export type AssetItemStatus = ItemStatus;

export type AssetItemModel = {
  _id: string;
  code?: string;
  assetId: AssetModel | string | null;
  serialNumber?: string;
  status: ItemStatus;
  locationId?: string | null;
  location?: LocationModel | null;
  ownerDept?: DepartmentModel | null;
  owerId?: string;
  note?: string;
  createdBy?: string | UserModel;
  updatedBy?: string | UserModel | null;
  createdAt: string;
  updatedAt?: string | null;
}

export type CreateAssetItemDto = {
  quantity: number;
  locationId?: string;
  ownerDeptId?: string;
}

export type AssetItemQueryDto = {
  page?: number;
  pageSize?: number;
  code?: string;
  serialNumber?: string;
  locationId?: string;
  assetId?: string;
  status?: ItemStatus;
  populations?: ("assetId" | "createdBy" | "updatedBy")[];
}

export type UpdateAssetItemDto = {
  assetId?: string;
  code?: string;
  status?: ItemStatus;
  locationId?: string;
  owerId?: string;
  serialNumber?: string;
  note?: string;
}
