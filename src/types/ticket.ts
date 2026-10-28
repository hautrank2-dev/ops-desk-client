import { UserModel } from './user';

export enum TicketType {
  Repair = "Repair",
  Maintenance = "Maintenance",
  Request = "Request",
  Incident = "Incident",
}

export enum TicketPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Urgent = "Urgent",
}

export enum TicketStatus {
  New = "New",
  Assigned = "Assigned",
  Doing = "Doing",
  Waiting = "Waiting",
  Done = "Done",
  Cancelled = "Cancelled",
}

export type TicketModel = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  assetItemIds: string[];
  cause?: string;
  note?: string;
  locationId?: string;
  assigneeId?: string | UserModel | null;
  teamId?: string;
  dueAt?: string;
  closedAt?: string;
  images: string[];
  imageUrls: string[];
  createdBy?: string | UserModel;
  updatedBy?: string | UserModel | null;
  createdAt: string;
  updatedAt?: string | null;
}
