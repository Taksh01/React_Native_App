/**
 * EIC (Engineer In-Charge) Mock Data
 *
 * This file contains mock data specifically for EIC role functionalities
 * including stock requests, vehicle queues, alerts, etc.
 */

import { mockGetUserPermissions, mockSetUserPermissions } from "./mock";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Generate realistic timestamps
const generateTimestamp = (hoursAgo) => {
  const now = new Date();
  return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
};

const hoursFromNow = (hoursAhead) => {
  const now = new Date();
  return new Date(now.getTime() + hoursAhead * 60 * 60 * 1000).toISOString();
};

/** Mock Stock Requests Data */
const _mockStockRequests = [
  {
    id: "REQ-001",
    type: "FDODO",
    requesterId: "FDODO-001",
    requesterName: "Reliance Industries Ltd",
    station: "DBS-09",
    quantity: 2500,
    unit: "MT",
    priority: "HIGH",
    status: "PENDING",
    timestamp: generateTimestamp(1),
    estimatedDelivery: generateTimestamp(-24),
    description: "Urgent requirement for production line",
    contact: "+91 98765 43210",
    location: "Jamnagar Refinery",
  },
  {
    id: "REQ-002",
    type: "SGL",
    requesterId: "SGL-001",
    requesterName: "Indian Oil Corporation",
    station: "DBS-12",
    quantity: 1800,
    unit: "MT",
    priority: "MEDIUM",
    status: "PENDING",
    timestamp: generateTimestamp(2),
    estimatedDelivery: generateTimestamp(-18),
    description: "Regular monthly supply requirement",
    contact: "+91 98765 43211",
    location: "Gujarat Terminal",
  },
  {
    id: "REQ-003",
    type: "AI",
    requesterId: "AI-SYSTEM",
    requesterName: "AI Demand Forecasting",
    station: "DBS-05",
    quantity: 3200,
    unit: "MT",
    priority: "HIGH",
    status: "APPROVED",
    timestamp: generateTimestamp(3),
    estimatedDelivery: generateTimestamp(-12),
    description: "AI-predicted demand spike based on weather patterns",
    contact: "System Generated",
    location: "Ahmedabad Distribution Hub",
    aiConfidence: 92,
    demandFactors: ["Weather", "Historical Pattern", "Regional Events"],
  },
  {
    id: "REQ-004",
    type: "FDODO",
    requesterId: "FDODO-002",
    requesterName: "Essar Oil & Gas",
    station: "DBS-15",
    quantity: 1500,
    unit: "MT",
    priority: "LOW",
    status: "PENDING",
    timestamp: generateTimestamp(4),
    estimatedDelivery: generateTimestamp(-36),
    description: "Planned maintenance requirement",
    contact: "+91 98765 43212",
    location: "Hazira Terminal",
  },
  {
    id: "REQ-005",
    type: "SGL",
    requesterId: "SGL-002",
    requesterName: "Bharat Petroleum Corporation",
    station: "DBS-08",
    quantity: 2200,
    unit: "MT",
    priority: "MEDIUM",
    status: "REJECTED",
    timestamp: generateTimestamp(5),
    estimatedDelivery: generateTimestamp(-48),
    description: "Quality specifications not met in previous delivery",
    contact: "+91 98765 43213",
    location: "Mumbai Refinery",
    rejectionReason: "Quality parameters below threshold",
  },
  {
    id: "REQ-006",
    type: "AI",
    requesterId: "AI-SYSTEM",
    requesterName: "AI Demand Forecasting",
    station: "DBS-11",
    quantity: 2800,
    unit: "MT",
    priority: "HIGH",
    status: "PENDING",
    timestamp: generateTimestamp(6),
    estimatedDelivery: generateTimestamp(-6),
    description: "Emergency demand prediction due to supply chain disruption",
    contact: "System Generated",
    location: "Surat Industrial Area",
    aiConfidence: 88,
    demandFactors: [
      "Supply Disruption",
      "Inventory Depletion",
      "Emergency Request",
    ],
  },
  {
    id: "REQ-007",
    type: "FDODO",
    requesterId: "FDODO-003",
    requesterName: "Adani Gas Limited",
    station: "DBS-13",
    quantity: 1900,
    unit: "MT",
    priority: "MEDIUM",
    status: "APPROVED",
    timestamp: generateTimestamp(8),
    estimatedDelivery: generateTimestamp(-72),
    description: "Regular supply for city gas distribution",
    contact: "+91 98765 43214",
    location: "Ahmedabad CGD Network",
  },
  {
    id: "REQ-008",
    type: "SGL",
    requesterId: "SGL-003",
    requesterName: "Hindustan Petroleum Corporation",
    station: "DBS-07",
    quantity: 3500,
    unit: "MT",
    priority: "HIGH",
    status: "PENDING",
    timestamp: generateTimestamp(10),
    estimatedDelivery: generateTimestamp(-24),
    description: "Festival season demand increase",
    contact: "+91 98765 43215",
    location: "Vadodara Distribution Hub",
  },
  {
    id: "REQ-009",
    type: "AI",
    requesterId: "AI-SYSTEM",
    requesterName: "AI Demand Forecasting",
    station: "DBS-14",
    quantity: 2100,
    unit: "MT",
    priority: "LOW",
    status: "PENDING",
    timestamp: generateTimestamp(12),
    estimatedDelivery: generateTimestamp(-96),
    description: "Predictive stocking for upcoming industrial expansion",
    contact: "System Generated",
    location: "Bharuch Industrial Complex",
    aiConfidence: 75,
    demandFactors: [
      "Industrial Growth",
      "Infrastructure Development",
      "Population Growth",
    ],
  },
  {
    id: "REQ-010",
    type: "FDODO",
    requesterId: "FDODO-004",
    requesterName: "Gujarat Gas Limited",
    station: "DBS-06",
    quantity: 2600,
    unit: "MT",
    priority: "MEDIUM",
    status: "APPROVED",
    timestamp: generateTimestamp(14),
    estimatedDelivery: generateTimestamp(-48),
    description: "Scheduled maintenance window supply",
    contact: "+91 98765 43216",
    location: "Gandhidham Terminal",
  },
  {
    id: "REQ-011",
    type: "SGL",
    requesterId: "SGL-004",
    requesterName: "Oil India Limited",
    station: "DBS-10",
    quantity: 1700,
    unit: "MT",
    priority: "LOW",
    status: "PENDING",
    timestamp: generateTimestamp(16),
    estimatedDelivery: generateTimestamp(-120),
    description: "Exploratory drilling operations support",
    contact: "+91 98765 43217",
    location: "Mehsana Operations",
  },
  {
    id: "REQ-012",
    type: "AI",
    requesterId: "AI-SYSTEM",
    requesterName: "AI Demand Forecasting",
    station: "DBS-09",
    quantity: 4200,
    unit: "MT",
    priority: "HIGH",
    status: "PENDING",
    timestamp: generateTimestamp(18),
    estimatedDelivery: generateTimestamp(-12),
    description: "Critical shortage prediction based on consumption analytics",
    contact: "System Generated",
    location: "Rajkot Distribution Network",
    aiConfidence: 95,
    demandFactors: [
      "Consumption Spike",
      "Storage Depletion",
      "Transport Delays",
    ],
  },
  {
    id: "REQ-013",
    type: "FDODO",
    requesterId: "FDODO-005",
    requesterName: "Torrent Gas Private Limited",
    station: "DBS-12",
    quantity: 1400,
    unit: "MT",
    priority: "LOW",
    status: "REJECTED",
    timestamp: generateTimestamp(20),
    estimatedDelivery: generateTimestamp(-168),
    description: "Non-critical backup inventory request",
    contact: "+91 98765 43218",
    location: "Anand Distribution Hub",
    rejectionReason: "Sufficient inventory levels detected",
  },
  {
    id: "REQ-014",
    type: "SGL",
    requesterId: "SGL-005",
    requesterName: "Mangalore Refinery & Petrochemicals",
    station: "DBS-11",
    quantity: 3100,
    unit: "MT",
    priority: "MEDIUM",
    status: "APPROVED",
    timestamp: generateTimestamp(22),
    estimatedDelivery: generateTimestamp(-72),
    description: "Refinery expansion project requirement",
    contact: "+91 98765 43219",
    location: "Mangalore Terminal",
  },
  {
    id: "REQ-015",
    type: "AI",
    requesterId: "AI-SYSTEM",
    requesterName: "AI Demand Forecasting",
    station: "DBS-13",
    quantity: 2750,
    unit: "MT",
    priority: "MEDIUM",
    status: "PENDING",
    timestamp: generateTimestamp(24),
    estimatedDelivery: generateTimestamp(-60),
    description: "Seasonal demand adjustment based on temperature forecast",
    contact: "System Generated",
    location: "Vapi Industrial Corridor",
    aiConfidence: 82,
    demandFactors: [
      "Temperature Forecast",
      "Seasonal Pattern",
      "Industrial Activity",
    ],
  },
];

const _manualTokens = [
  {
    tokenId: "MAN-20251001-001",
    customerId: "FDODO-001",
    customerName: "Reliance Industries Ltd",
    msStation: "MS-12",
    msSlot: "Bay-A",
    product: "Auto LPG",
    quantity: 24,
    unit: "KL",
    validUntil: hoursFromNow(24),
    notes: "Emergency replenishment window",
    status: "ASSIGNED",
    assignedAt: generateTimestamp(6),
    assignedBy: "EIC-Admin",
  },
  {
    tokenId: "MAN-20251002-002",
    customerId: "FDODO-002",
    customerName: "Essar Oil and Gas",
    msStation: "MS-08",
    msSlot: "Bay-B",
    product: "Auto LPG",
    quantity: 18,
    unit: "KL",
    validUntil: hoursFromNow(12),
    notes: "Night shift allocation",
    status: "ASSIGNED",
    assignedAt: generateTimestamp(2),
    assignedBy: "EIC-Admin",
  },
];
const _mockClusters = [
  {
    id: "CLUSTER-001",
    name: "North Gujarat Logistics",
    msStation: {
      id: "MS-12",
      name: "Vastral Mother Station",
      capacity: 32000,
      location: "Ahmedabad",
    },
    dbsStations: [
      { id: "DBS-09", name: "Isanpur DBS", capacity: 8500 },
      { id: "DBS-14", name: "Narol DBS", capacity: 7200 },
    ],
    lastUpdated: generateTimestamp(-4),
    clusterManager: "EIC-Admin",
    notes: "Primary supply chain for Ahmedabad metro. Review weekly.",
  },
  {
    id: "CLUSTER-002",
    name: "South Gujarat Distribution",
    msStation: {
      id: "MS-07",
      name: "Surat Mother Station",
      capacity: 28000,
      location: "Surat",
    },
    dbsStations: [
      { id: "DBS-05", name: "Navsari DBS", capacity: 6400 },
      { id: "DBS-08", name: "Valsad DBS", capacity: 6100 },
      { id: "DBS-11", name: "Bharuch DBS", capacity: 7000 },
    ],
    lastUpdated: generateTimestamp(-2),
    clusterManager: "EIC-Admin",
    notes: "Monitor Navsari throughput due to planned maintenance.",
  },
];



const _mockReconciliationReports = [
  {
    id: "REC-2025-001",
    msStation: "MS-12",
    msName: "Vastral Mother Station",
    dbsStation: "DBS-09",
    reportingPeriod: "2025-10-20",
    severity: "HIGH",
    status: "REVIEW_PENDING",
    volumeDiscrepancy: 420,
    financialImpact: 320000,
    currency: "INR",
    variancePercentage: 3.6,
    rootCauseSignals: [
      "Meter drift detected on MS loading bay 2",
      "Unreconciled driver log for TRIP-014 on Oct 19",
    ],
    recommendedAction:
      "Schedule immediate calibration and request updated delivery confirmation from DBS-09.",
    lastUpdated: generateTimestamp(6),
    correctiveActions: [],
  },
  {
    id: "REC-2025-002",
    msStation: "MS-07",
    msName: "Naroda Mother Station",
    dbsStation: "DBS-14",
    reportingPeriod: "2025-10-18",
    severity: "MEDIUM",
    status: "ACTION_PENDING",
    volumeDiscrepancy: 180,
    financialImpact: 125000,
    currency: "INR",
    variancePercentage: 1.4,
    rootCauseSignals: [
      "Late submission of DBS unloading log",
      "Minor variance in truck TRIP-011 post readings",
    ],
    recommendedAction:
      "Request DBS reconciliation sign-off and monitor next two loads.",
    lastUpdated: generateTimestamp(12),
    correctiveActions: [
      {
        actionId: "ACT-2025-1001",
        triggeredBy: "EIC-Admin",
        actionType: "FOLLOW_UP",
        notes: "Contacted DBS-14 to resubmit unloading statement",
        status: "IN_PROGRESS",
        triggeredAt: generateTimestamp(10),
      },
    ],
  },
];

const _mockPendingDrivers = [
  {
    id: "DRV-2025-001",
    name: "Rahul Sharma",
    phone: "+91 98765 55001",
    licenseNumber: "GJ-13-2025-9981",
    licenseExpiry: "2027-05-18",
    trainingCompleted: false,
    preferredShift: "NIGHT",
    requestedShiftStart: "22:00",
    requestedShiftEnd: "06:00",
    submittedAt: generateTimestamp(-4),
    documents: [
      { type: "License Scan", url: "https://example.com/docs/license9981" },
      { type: "Medical Certificate", url: "https://example.com/docs/med9981" },
    ],
    remarks: "Prefers metro routes, 3 years LPG experience.",
  },
  {
    id: "DRV-2025-002",
    name: "Pooja Patel",
    phone: "+91 98765 55002",
    licenseNumber: "GJ-19-2023-4432",
    licenseExpiry: "2026-11-02",
    trainingCompleted: true,
    trainingModules: ["Hazmat Handling", "Emergency Response"],
    preferredShift: "DAY",
    requestedShiftStart: "08:00",
    requestedShiftEnd: "16:00",
    submittedAt: generateTimestamp(-2),
    documents: [
      { type: "License Scan", url: "https://example.com/docs/license4432" },
      {
        type: "Background Verification",
        url: "https://example.com/docs/bgv4432",
      },
    ],
    remarks: "Completed refresher training last month.",
  },
];

const _mockActiveDrivers = {
  "DRV-2024-010": {
    id: "DRV-2024-010",
    name: "Rakesh Patel",
    phone: "+91 98765 55000",
    licenseNumber: "GJ-11-2019-1021",
    licenseExpiry: "2025-12-31",
    shiftStart: "08:00",
    shiftEnd: "16:00",
    trainingCompleted: true,
    trainingModules: ["Hazmat Handling", "Vehicle Safety"],
    status: "ACTIVE",
    approvedAt: generateTimestamp(-72),
  },
};

const DEFAULT_EIC_USER_ID = "2";

export async function mockGetEICPermissions(userId = DEFAULT_EIC_USER_ID) {
  await sleep(150);
  const permissions = mockGetUserPermissions(userId, "EIC");
  return {
    canApproveProposals: !!permissions?.canApproveProposals,
    canTriggerCorrectiveActions: !!permissions?.canTriggerCorrectiveActions,
  };
}

export function mockSetEICApprovalPermission(
  userId = DEFAULT_EIC_USER_ID,
  canApprove = true
) {
  mockSetUserPermissions(userId, { canApproveProposals: canApprove });
}

export function mockSetEICTriggerPermission(
  userId = DEFAULT_EIC_USER_ID,
  canTrigger = true
) {
  mockSetUserPermissions(userId, {
    canTriggerCorrectiveActions: canTrigger,
  });
}

/** EIC API Functions */

/** Get all stock requests with optional filtering */
export async function mockGetStockRequests(filters = {}) {
  await sleep(300);

  let filteredRequests = [..._mockStockRequests];




  // Apply filters
  if (filters.type && filters.type !== "ALL") {
    filteredRequests = filteredRequests.filter(
      (req) => req.type === filters.type
    );
  }

  if (filters.status && filters.status !== "ALL") {
    filteredRequests = filteredRequests.filter(
      (req) => req.status === filters.status
    );
  }

  if (filters.priority && filters.priority !== "ALL") {
    filteredRequests = filteredRequests.filter(
      (req) => req.priority === filters.priority
    );
  }

  // Sort by timestamp (newest first)
  filteredRequests.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return {
    requests: filteredRequests,
    totalCount: filteredRequests.length,
    summary: {
      pending: filteredRequests.filter((r) => r.status === "PENDING").length,
      approved: filteredRequests.filter((r) => r.status === "APPROVED").length,
      rejected: filteredRequests.filter((r) => r.status === "REJECTED").length,
      totalQuantity: filteredRequests.reduce((sum, r) => sum + r.quantity, 0),
    },
  };
}

/** Get single stock request by ID */
export async function mockGetStockRequest(requestId) {
  await sleep(200);

  const request = _mockStockRequests.find((req) => req.id === requestId);
  if (!request) {
    const err = new Error("Stock request not found");
    err.status = 404;
    throw err;
  }

  return request;
}

/** Approve a stock request */
export async function mockApproveStockRequest(requestId, approvalData = {}) {
  await sleep(400);

  const request = _mockStockRequests.find((req) => req.id === requestId);
  if (!request) {
    const err = new Error("Stock request not found");
    err.status = 404;
    throw err;
  }

  if (request.status !== "PENDING") {
    const err = new Error("Only pending requests can be approved");
    err.status = 409;
    throw err;
  }

  // Update request status
  request.status = "APPROVED";
  request.approvedBy = "EIC-Admin";
  request.approvedAt = new Date().toISOString();
  request.approvalNotes = approvalData.notes || "";

  return {
    ok: true,
    requestId,
    status: "APPROVED",
    approvedAt: request.approvedAt,
  };
}

/** Reject a stock request */
export async function mockRejectStockRequest(requestId, rejectionData = {}) {
  await sleep(400);

  const request = _mockStockRequests.find((req) => req.id === requestId);
  if (!request) {
    const err = new Error("Stock request not found");
    err.status = 404;
    throw err;
  }

  if (request.status !== "PENDING") {
    const err = new Error("Only pending requests can be rejected");
    err.status = 409;
    throw err;
  }

  // Update request status
  request.status = "REJECTED";
  request.rejectedBy = "EIC-Admin";
  request.rejectedAt = new Date().toISOString();
  request.rejectionReason = rejectionData.reason || "Not specified";
  request.rejectionNotes = rejectionData.notes || "";

  return {
    ok: true,
    requestId,
    status: "REJECTED",
    rejectedAt: request.rejectedAt,
    reason: request.rejectionReason,
  };
}

/** Get EIC dashboard statistics */
export async function mockGetEICDashboardStats() {
  await sleep(250);

  const requests = _mockStockRequests;
  const now = new Date();
  const todayRequests = requests.filter((req) => {
    const reqDate = new Date(req.timestamp);
    return reqDate.toDateString() === now.toDateString();
  });

  return {
    totalRequests: requests.length,
    pendingRequests: requests.filter((r) => r.status === "PENDING").length,
    approvedToday: todayRequests.filter((r) => r.status === "APPROVED").length,
    rejectedToday: todayRequests.filter((r) => r.status === "REJECTED").length,
    totalPendingQuantity: requests
      .filter((r) => r.status === "PENDING")
      .reduce((sum, r) => sum + r.quantity, 0),
    priorityBreakdown: {
      high: requests.filter(
        (r) => r.priority === "HIGH" && r.status === "PENDING"
      ).length,
      medium: requests.filter(
        (r) => r.priority === "MEDIUM" && r.status === "PENDING"
      ).length,
      low: requests.filter(
        (r) => r.priority === "LOW" && r.status === "PENDING"
      ).length,
    },
    typeBreakdown: {
      fdodo: requests.filter(
        (r) => r.type === "FDODO" && r.status === "PENDING"
      ).length,
      sgl: requests.filter((r) => r.type === "SGL" && r.status === "PENDING")
        .length,
      ai: requests.filter((r) => r.type === "AI" && r.status === "PENDING")
        .length,
    },
  };
}

export async function mockGetManualTokens() {
  await sleep(150);
  return {
    tokens: _manualTokens.map((token) => ({ ...token })),
    total: _manualTokens.length,
  };
}

export async function mockAssignManualToken(payload = {}) {
  await sleep(200);
  const token = {
    tokenId: `MAN-${Date.now()}`,
    customerId: payload.customerId || "",
    customerName: payload.customerName || "",
    msStation: payload.msStation || "",
    msSlot: payload.msSlot || "",
    product: payload.product || "LPG",
    quantity: Number(payload.quantity) || 0,
    unit: payload.unit || "KL",
    validUntil: payload.validUntil || null,
    notes: payload.notes || "",
    status: "ASSIGNED",
    assignedAt: new Date().toISOString(),
    assignedBy: "EIC-Admin",
  };

  _manualTokens.unshift(token);
  return { ok: true, token: { ...token } };
}

export async function mockGetReconciliationReports(filters = {}) {
  await sleep(220);
  let reports = _mockReconciliationReports.map((report) => ({ ...report }));

  if (filters.status && filters.status !== "ALL") {
    reports = reports.filter(
      (report) => report.status === filters.status
    );
  }
  if (filters.severity && filters.severity !== "ALL") {
    reports = reports.filter(
      (report) => report.severity === filters.severity
    );
  }

  return {
    reports,
    total: reports.length,
  };
}

export async function mockTriggerReconciliationAction(
  reportId,
  payload = {}
) {
  await sleep(250);
  const report = _mockReconciliationReports.find(
    (item) => item.id === reportId
  );
  if (!report) {
    const err = new Error("Reconciliation report not found");
    err.status = 404;
    throw err;
  }

  const notes = (payload.notes || "").trim();
  if (!notes) {
    const err = new Error("notes is required");
    err.status = 400;
    throw err;
  }

  const action = {
    actionId: `ACT-${Date.now()}`,
    triggeredBy: payload.userId || "EIC-Admin",
    actionType: (payload.actionType || "GENERAL").toUpperCase(),
    notes,
    status: "IN_PROGRESS",
    triggeredAt: new Date().toISOString(),
  };

  report.correctiveActions = report.correctiveActions || [];
  report.correctiveActions.unshift(action);

  if (payload.nextStatus) {
    report.status = payload.nextStatus;
  } else {
    report.status = "ACTION_TRIGGERED";
  }
  report.lastUpdated = new Date().toISOString();

  return {
    ok: true,
    report: { ...report },
    action,
  };
}

export async function mockGetPendingDrivers() {
  await sleep(200);
  return {
    pending: _mockPendingDrivers.map((driver) => ({ ...driver })),
    total: _mockPendingDrivers.length,
  };
}

export async function mockApproveDriver(driverId, payload = {}) {
  await sleep(250);
  const index = _mockPendingDrivers.findIndex((drv) => drv.id === driverId);
  if (index === -1) {
    const err = new Error("Pending driver not found");
    err.status = 404;
    throw err;
  }

  const base = _mockPendingDrivers[index];
  const approvedDriver = {
    ...base,
    status: "ACTIVE",
    approvedAt: new Date().toISOString(),
    approvedBy: payload.userId || "EIC-Admin",
    shiftStart:
      payload.shiftStart || base.requestedShiftStart || "08:00",
    shiftEnd: payload.shiftEnd || base.requestedShiftEnd || "16:00",
    trainingCompleted:
      payload.trainingCompleted ?? base.trainingCompleted ?? false,
    trainingModules:
      payload.trainingModules || base.trainingModules || [],
    validation: {
      licenseVerified:
        payload.licenseVerified ?? true,
      trainingVerified:
        payload.trainingVerified ?? !!(payload.trainingCompleted ?? base.trainingCompleted),
      shiftAssigned: payload.shiftAssigned ?? true,
    },
    notes: payload.notes || "",
  };

  _mockPendingDrivers.splice(index, 1);
  _mockActiveDrivers[driverId] = approvedDriver;

  return {
    ok: true,
    driver: { ...approvedDriver },
  };
}

export async function mockRejectDriver(driverId, payload = {}) {
  await sleep(250);
  const index = _mockPendingDrivers.findIndex((drv) => drv.id === driverId);
  if (index === -1) {
    const err = new Error("Pending driver not found");
    err.status = 404;
    throw err;
  }

  const reason = (payload.reason || "").trim();
  if (!reason) {
    const err = new Error("reason is required");
    err.status = 400;
    throw err;
  }

  const base = _mockPendingDrivers[index];
  _mockPendingDrivers.splice(index, 1);

  return {
    ok: true,
    driver: {
      ...base,
      status: "REJECTED",
      rejectedAt: new Date().toISOString(),
      rejectedBy: payload.userId || "EIC-Admin",
      rejectionReason: reason,
      notes: payload.notes || "",
    },
  };
}

export async function mockGetClusters() {
  await sleep(200);
  return {
    clusters: _mockClusters.map((cluster) => ({ ...cluster })),
    total: _mockClusters.length,
  };
}

export async function mockUpdateCluster(clusterId, payload = {}) {
  await sleep(250);
  const index = _mockClusters.findIndex((cluster) => cluster.id === clusterId);
  if (index === -1) {
    const err = new Error('Cluster not found');
    err.status = 404;
    throw err;
  }

  const cluster = _mockClusters[index];
  const updated = { ...cluster };

  if (Array.isArray(payload.dbsStations)) {
    updated.dbsStations = payload.dbsStations.map((item) => ({ ...item }));
  }
  if (typeof payload.notes === 'string') {
    updated.notes = payload.notes;
  }
  if (typeof payload.name === 'string' && payload.name.trim()) {
    updated.name = payload.name.trim();
  }
  if (payload.msStation && typeof payload.msStation === 'object') {
    updated.msStation = { ...updated.msStation, ...payload.msStation };
  }

  updated.lastUpdated = new Date().toISOString();
  updated.clusterManager = payload.userId || updated.clusterManager;

  _mockClusters[index] = updated;

  return { ok: true, cluster: { ...updated } };
}
