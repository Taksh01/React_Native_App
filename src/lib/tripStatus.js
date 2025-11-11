export const STATUS_GROUPS = {
  DISPATCHED: [
    "PENDING",
    "SCHEDULED",
    "SCHEDULE",
    "ON_HOLD",
    "ON-HOLD",
    "ON HOLD",
    "DELAYED",
    "QUEUE",
    "QUEUED",
    "DISPATCHED",
    "CREATED",
    "PLANNED",
    "REQUESTED",
    "ASSIGNED",
    "READY",
  ],
  FILLING: [
    "IN_PROGRESS",
    "IN PROGRESS",
    "FILLING",
    "LOADING",
    "ARRIVED",
    "EN_ROUTE",
    "EN ROUTE",
    "BOARDING",
    "STARTED",
    "LOADED",
  ],
  COMPLETED: [
    "COMPLETED",
    "DELIVERED",
    "CONFIRMED",
    "CLOSED",
    "FINISHED",
    "ENDED",
  ],
};

export const STATUS_LABELS = {
  DISPATCHED: "Dispatched",
  FILLING: "Filling",
  COMPLETED: "Completed",
};

const normalizeStatus = (status) => String(status || "").toUpperCase();

export const deriveStatusCategory = (status) => {
  const normalized = normalizeStatus(status);
  if (STATUS_GROUPS.COMPLETED.some((value) => normalized.includes(value))) {
    return "COMPLETED";
  }
  if (STATUS_GROUPS.FILLING.some((value) => normalized.includes(value))) {
    return "FILLING";
  }
  return "DISPATCHED";
};

export const formatStatusLabel = (
  status,
  { fallbackToCategory = true } = {}
) => {
  const category = deriveStatusCategory(status);
  const label = STATUS_LABELS[category];
  if (label) {
    return label;
  }
  if (!fallbackToCategory) {
    return "";
  }
  return STATUS_LABELS.DISPATCHED;
};
