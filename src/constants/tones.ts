import type { Tone } from "@/components/ui/status-pill";
import { TicketPriority, TicketStatus } from "@/types/ticket";
import { ItemStatus } from "@/types/asset-item";

// Visual tone for each domain status — presentation only

export const TICKET_STATUS_TONE: Record<TicketStatus, Tone> = {
  [TicketStatus.New]: "gray",
  [TicketStatus.Assigned]: "blue",
  [TicketStatus.Doing]: "indigo",
  [TicketStatus.Waiting]: "amber",
  [TicketStatus.Done]: "green",
  [TicketStatus.Cancelled]: "red",
};

export const TICKET_PRIORITY_TONE: Record<TicketPriority, Tone> = {
  [TicketPriority.Low]: "gray",
  [TicketPriority.Medium]: "teal",
  [TicketPriority.High]: "amber",
  [TicketPriority.Urgent]: "red",
};

export const ITEM_STATUS_TONE: Record<ItemStatus, Tone> = {
  [ItemStatus.Available]: "green",
  [ItemStatus.InUse]: "blue",
  [ItemStatus.UnderMaintenance]: "amber",
  [ItemStatus.Retired]: "gray",
};

export const USER_ROLE_TONE: Record<string, Tone> = {
  admin: "purple",
  manager: "blue",
  user: "gray",
};

export const USER_STATUS_TONE: Record<string, Tone> = {
  active: "green",
  blocked: "red",
};
