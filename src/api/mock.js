/**
 * Mock API layer for GTS Mobile
 *
 * Replace these functions with real HTTP calls later.
 * For now we simulate latency and return deterministic data you can render today.
 *
 * Endpoints mirrored:
 * - POST /auth/login
 * - GET  /dbs/decant/{tripId}/pre
 * - POST /dbs/decant/{tripId}/start
 * - POST /dbs/decant/{tripId}/end
 * - GET  /dbs/decant/{tripId}/end
 * - POST /dbs/decant/{tripId}/confirm
 */

// amazonq-ignore-next-line
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const PRODUCT_FIELDS = [
  "product",
  "productName",
  "productType",
  "cargoType",
  "fuelType",
];

function enforceCngOnly(value) {
  if (Array.isArray(value)) {
    return value.map(enforceCngOnly);
  }
  if (value && typeof value === "object") {
    PRODUCT_FIELDS.forEach((field) => {
      if (typeof value[field] === "string") {
        value[field] = "CNG";
      }
    });
    Object.keys(value).forEach((key) => {
      if (key === "__visited") return;
      const child = value[key];
      if (child && typeof child === "object") {
        enforceCngOnly(child);
      }
    });
  }
  return value;
}

// Force one MS everywhere for DBS dashboard
const ONE_MS = "Vastral MS"; // 👈 change this name to whatever single MS you want

/** In-memory mock DB so state survives within the running app */
const _mock = {
  users: [
    {
      id: "1",
      username: "dbs",
      // amazonq-ignore-next-line
      password: "dbs123",
      role: "DBS_OPERATOR",
      name: "DBS Operator",
      dbsId: "DBS-09",
      dbsName: "Mehsana DBS",
    },
    {
      id: "2",
      username: "eic",
      // amazonq-ignore-next-line
      password: "password",
      role: "EIC",
      name: "EIC Admin",
      msId: "MS-12",
      msName: "Vastral MS",
    },
    {
      id: "3",
      username: "ms",
      // amazonq-ignore-next-line
      password: "ms123",
      role: "MS_OPERATOR",
      name: "MS Operator",
      msId: "MS-12",
      msName: "Vastral MS",
    },
    {
      id: "4",
      username: "driver",
      // amazonq-ignore-next-line
      password: "driver123",
      role: "SGL_DRIVER",
      name: "SGL Driver",
    },
    {
      id: "5",
      username: "fdodo",
      // amazonq-ignore-next-line
      password: "fdodo123",
      role: "FDODO_CUSTOMER",
      name: "FDODO Customer",
      dbsId: "DBS-15",
      dbsName: "Surat DBS",
    },
    {
      id: "6",
      username: "sgl",
      // amazonq-ignore-next-line
      password: "sgl123",
      role: "SGL_CUSTOMER",
      name: "Mehsana DBS Owner",
      dbsId: "DBS-09",
      dbsName: "Mehsana DBS",
    },
  ],
  trips: {
    "TRIP-001": {
      id: "TRIP-001",
      status: "CREATED", // CREATED -> ARRIVED -> STARTED -> ENDED -> CONFIRMED
      msId: "MS-12",
      vehicle: "GJ-01-AB-1234",
      driver: "Rakesh Patel",
      pre: null,
      startTime: null,
      endTime: null,
      post: null,
      deliveredQty: null,
      operatorSig: null,
      driverSig: null,
    },
  },
  proposals: [
    {
      id: "PR-001",
      msName: "Vastral MS",
      driver: "Rakesh Patel",
      priority: "HIGH",
      score: 92,
      status: "PENDING",
      createdAt: "2025-01-05T08:00:00.000Z",
    },
    {
      id: "PR-002",
      msName: "Naroda MS",
      driver: "Suresh Mehta",
      priority: "MEDIUM",
      score: 76,
      status: "PENDING",
      createdAt: "2025-01-06T11:30:00.000Z",
    },
    {
      id: "PR-003",
      msName: "Sanand MS",
      driver: "Priya Shah",
      priority: "LOW",
      score: 65,
      status: "APPROVED",
      createdAt: "2025-01-07T15:45:00.000Z",
    },
  ],
  driverTokens: {},
  msSessions: {},
  customerStations: {
    "DBS-09": {
      dbsId: "DBS-09",
      dbsName: "Mehsana DBS",
      location: "Mehsana, Gujarat",
      dashboard: {
        stats: [
          { key: "totalTrips", value: "24", label: "Total Trips" },
          { key: "pending", value: "3", label: "Pending" },
          { key: "completed", value: "21", label: "Completed" },
          { key: "delayed", value: "2", label: "Delayed" },
        ],
        recentTrips: [
          {
            id: "TRP-2024-001",
            route: "Mehsana DBS \u2190 Changodar MS",
            status: "IN_PROGRESS",
            driverName: "Rakesh Patel",
            scheduledTime: new Date(
              Date.now() - 2 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "TRP-2024-002",
            route: "Mehsana DBS \u2190 Sanand MS",
            status: "COMPLETED",
            driverName: "Suresh Shah",
            scheduledTime: new Date(
              Date.now() - 5 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "TRP-2024-003",
            route: "Mehsana DBS \u2190 Changodar MS",
            status: "PENDING",
            driverName: "Priya Mehta",
            scheduledTime: new Date(
              Date.now() + 3 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
        allTrips: [
          {
            id: "TRP-2024-004",
            route: "Mehsana DBS \u2190 Changodar MS",
            status: "COMPLETED",
            driverName: "Hardik Joshi",
            scheduledTime: new Date(
              Date.now() - 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "TRP-2024-005",
            route: "Mehsana DBS \u2190 Changodar MS",
            status: "COMPLETED",
            driverName: "Vijay Desai",
            scheduledTime: new Date(
              Date.now() - 48 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
      },
      stocks: {
        summary: {
          totalProducts: 4,
          totalCapacity: 75000,
          totalStock: 52500,
        },
        items: [
          {
            id: "STOCK-001",
            productName: "Petrol (Regular)",
            productType: "Fuel",
            currentStock: 18500,
            capacity: 25000,
            percentage: 74,
            lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          {
            id: "STOCK-002",
            productName: "Diesel",
            productType: "Fuel",
            currentStock: 22000,
            capacity: 30000,
            percentage: 73,
            lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          },
          {
            id: "STOCK-003",
            productName: "Premium Petrol",
            productType: "Fuel",
            currentStock: 8000,
            capacity: 15000,
            percentage: 53,
            lastUpdated: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          },
          {
            id: "STOCK-004",
            productName: "CNG",
            productType: "Gas",
            currentStock: 4000,
            capacity: 5000,
            percentage: 80,
            lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          },
        ],
      },
      transport: {
        summary: {
          activeTransports: 3,
          enRoute: 2,
          delayed: 1,
        },
        items: [
          {
            id: "TRK-001",
            vehicleNumber: "GJ-01-AB-1234",
            driverName: "Rakesh Patel",
            status: "EN_ROUTE",
            origin: "Vastral MS",
            destination: "Mehsana DBS",
            cargoType: "Petrol",
            quantity: 15000,
            progressPercentage: 65,
            departureTime: new Date(
              Date.now() - 3 * 60 * 60 * 1000
            ).toISOString(),
            estimatedArrival: new Date(
              Date.now() + 1 * 60 * 60 * 1000
            ).toISOString(),
            currentLocation: "Near Gandhinagar Toll Plaza",
          },
          {
            id: "TRK-002",
            vehicleNumber: "GJ-05-CD-5678",
            driverName: "Suresh Shah",
            status: "LOADING",
            origin: "Sanand MS",
            destination: "Mehsana DBS",
            cargoType: "Diesel",
            quantity: 20000,
            progressPercentage: 15,
            departureTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            estimatedArrival: new Date(
              Date.now() + 4 * 60 * 60 * 1000
            ).toISOString(),
            currentLocation: "Sanand MS Loading Bay",
          },
          {
            id: "TRK-003",
            vehicleNumber: "GJ-02-EF-9012",
            driverName: "Priya Mehta",
            status: "DELAYED",
            origin: "Naroda MS",
            destination: "Mehsana DBS",
            cargoType: "Premium Petrol",
            quantity: 8000,
            progressPercentage: 45,
            departureTime: new Date(
              Date.now() - 5 * 60 * 60 * 1000
            ).toISOString(),
            estimatedArrival: new Date(
              Date.now() + 2 * 60 * 60 * 1000
            ).toISOString(),
            currentLocation: "Stuck in traffic near Kalol",
          },
        ],
      },
      transfers: {
        summary: {
          totalTransfers: 8,
          pending: 2,
          inProgress: 1,
          completed: 5,
        },
        items: [
          {
            id: "TXF-001",
            type: "INCOMING",
            fromLocation: "Vastral MS",
            toLocation: "Mehsana DBS",
            productName: "Petrol (Regular)",
            quantity: 15000,
            status: "IN_PROGRESS",
            initiatedAt: new Date(
              Date.now() - 2 * 60 * 60 * 1000
            ).toISOString(),
            estimatedCompletion: new Date(
              Date.now() + 1 * 60 * 60 * 1000
            ).toISOString(),
            notes: "High priority delivery for weekend rush",
          },
          {
            id: "TXF-002",
            type: "INCOMING",
            fromLocation: "Sanand MS",
            toLocation: "Mehsana DBS",
            productName: "Diesel",
            quantity: 20000,
            status: "PENDING",
            initiatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            estimatedCompletion: new Date(
              Date.now() + 4 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "TXF-003",
            type: "OUTGOING",
            fromLocation: "Mehsana DBS",
            toLocation: "Paldi Retail Station",
            productName: "Petrol (Regular)",
            quantity: 5000,
            status: "COMPLETED",
            initiatedAt: new Date(
              Date.now() - 6 * 60 * 60 * 1000
            ).toISOString(),
            completedAt: new Date(
              Date.now() - 4 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "TXF-004",
            type: "INTERNAL",
            fromLocation: "Tank A",
            toLocation: "Tank B",
            productName: "Premium Petrol",
            quantity: 3000,
            status: "PENDING",
            initiatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            estimatedCompletion: new Date(
              Date.now() + 2 * 60 * 60 * 1000
            ).toISOString(),
            notes: "Tank maintenance transfer",
          },
        ],
      },
      pendingTrips: [
        {
          id: "TRP-PEND-001",
          route: "Vastral MS \u2192 Changodar DBS",
          vehicleNumber: "GJ-03-GH-3456",
          cargoType: "Petrol",
          quantity: 12000,
          priority: "HIGH",
          scheduledTime: new Date(
            Date.now() + 1 * 60 * 60 * 1000
          ).toISOString(),
          notes: "Urgent delivery required for weekend stock",
        },
        {
          id: "TRP-PEND-002",
          route: "Sanand MS \u2192 Changodar DBS",
          vehicleNumber: "GJ-04-IJ-7890",
          cargoType: "Diesel",
          quantity: 18000,
          priority: "MEDIUM",
          scheduledTime: new Date(
            Date.now() + 3 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "TRP-PEND-003",
          route: "Naroda MS \u2192 Changodar DBS",
          vehicleNumber: "GJ-07-KL-1122",
          cargoType: "Premium Petrol",
          quantity: 8000,
          priority: "LOW",
          scheduledTime: new Date(
            Date.now() + 6 * 60 * 60 * 1000
          ).toISOString(),
          notes: "Scheduled for evening slot",
        },
      ],
    },
    "DBS-15": {
      dbsId: "DBS-15",
      dbsName: "Surat DBS",
      location: "Surat, Gujarat",
      dashboard: {
        stats: [
          { key: "totalTrips", value: "12", label: "Total Trips" },
          { key: "pending", value: "1", label: "Pending" },
          { key: "completed", value: "9", label: "Completed" },
          { key: "delayed", value: "2", label: "Delayed" },
        ],
        recentTrips: [
          {
            id: "SUR-TRP-001",
            route: "Surat DBS \u2190 Hazira MS",
            status: "COMPLETED",
            driverName: "Manish Chauhan",
            scheduledTime: new Date(
              Date.now() - 3 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "SUR-TRP-002",
            route: "Surat DBS \u2190 Ankleshwar MS",
            status: "IN_PROGRESS",
            driverName: "Alpesh Rana",
            scheduledTime: new Date(
              Date.now() - 1 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "SUR-TRP-003",
            route: "Surat DBS \u2190 Bharuch MS",
            status: "PENDING",
            driverName: "Pritesh Vyas",
            scheduledTime: new Date(
              Date.now() + 4 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
        allTrips: [
          {
            id: "SUR-TRP-004",
            route: "Surat DBS \u2190 Hazira MS",
            status: "COMPLETED",
            driverName: "Manish Chauhan",
            scheduledTime: new Date(
              Date.now() - 26 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "SUR-TRP-005",
            route: "Surat DBS \u2190 Dahej MS",
            status: "DELAYED",
            driverName: "Hiren Patel",
            scheduledTime: new Date(
              Date.now() - 18 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "SUR-TRP-006",
            route: "Surat DBS \u2190 Udhna MS",
            status: "COMPLETED",
            driverName: "Digant Thakkar",
            scheduledTime: new Date(
              Date.now() - 42 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
      },
      stocks: {
        summary: {
          totalProducts: 3,
          totalCapacity: 54000,
          totalStock: 31250,
        },
        items: [
          {
            id: "SUR-STOCK-001",
            productName: "Diesel",
            productType: "Fuel",
            currentStock: 14000,
            capacity: 18000,
            percentage: 78,
            lastUpdated: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          },
          {
            id: "SUR-STOCK-002",
            productName: "Petrol (Regular)",
            productType: "Fuel",
            currentStock: 10250,
            capacity: 18000,
            percentage: 57,
            lastUpdated: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          },
          {
            id: "SUR-STOCK-003",
            productName: "Aviation Turbine Fuel",
            productType: "Fuel",
            currentStock: 7000,
            capacity: 18000,
            percentage: 39,
            lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
        ],
      },
      transport: {
        summary: {
          activeTransports: 2,
          enRoute: 1,
          delayed: 1,
        },
        items: [
          {
            id: "SUR-TRK-001",
            vehicleNumber: "GJ-19-AC-1122",
            driverName: "Alpesh Rana",
            status: "EN_ROUTE",
            origin: "Ankleshwar MS",
            destination: "Surat DBS",
            cargoType: "Diesel",
            quantity: 18000,
            progressPercentage: 58,
            departureTime: new Date(
              Date.now() - 2 * 60 * 60 * 1000
            ).toISOString(),
            estimatedArrival: new Date(
              Date.now() + 90 * 60 * 1000
            ).toISOString(),
            currentLocation: "Kamrej Circle",
          },
          {
            id: "SUR-TRK-002",
            vehicleNumber: "GJ-05-AA-7777",
            driverName: "Hiren Patel",
            status: "DELAYED",
            origin: "Dahej MS",
            destination: "Surat DBS",
            cargoType: "ATF",
            quantity: 10000,
            progressPercentage: 35,
            departureTime: new Date(
              Date.now() - 4 * 60 * 60 * 1000
            ).toISOString(),
            estimatedArrival: new Date(
              Date.now() + 2.5 * 60 * 60 * 1000
            ).toISOString(),
            currentLocation: "Bharuch Bridge",
          },
        ],
      },
      transfers: {
        summary: {
          totalTransfers: 5,
          pending: 1,
          inProgress: 1,
          completed: 3,
        },
        items: [
          {
            id: "SUR-TXF-001",
            type: "INCOMING",
            fromLocation: "Hazira MS",
            toLocation: "Surat DBS",
            productName: "Diesel",
            quantity: 18000,
            status: "COMPLETED",
            initiatedAt: new Date(
              Date.now() - 8 * 60 * 60 * 1000
            ).toISOString(),
            completedAt: new Date(
              Date.now() - 6 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "SUR-TXF-002",
            type: "INCOMING",
            fromLocation: "Ankleshwar MS",
            toLocation: "Surat DBS",
            productName: "Petrol (Regular)",
            quantity: 15000,
            status: "IN_PROGRESS",
            initiatedAt: new Date(
              Date.now() - 3 * 60 * 60 * 1000
            ).toISOString(),
            estimatedCompletion: new Date(
              Date.now() + 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "SUR-TXF-003",
            type: "OUTGOING",
            fromLocation: "Surat DBS",
            toLocation: "Udhna Retail Station",
            productName: "Diesel",
            quantity: 6000,
            status: "COMPLETED",
            initiatedAt: new Date(
              Date.now() - 12 * 60 * 60 * 1000
            ).toISOString(),
            completedAt: new Date(
              Date.now() - 10 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "SUR-TXF-004",
            type: "INTERNAL",
            fromLocation: "Tank C",
            toLocation: "Tank D",
            productName: "ATF",
            quantity: 1500,
            status: "PENDING",
            initiatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            estimatedCompletion: new Date(
              Date.now() + 90 * 60 * 1000
            ).toISOString(),
          },
        ],
      },
      pendingTrips: [
        {
          id: "SUR-PEND-001",
          route: "Ankleshwar MS \u2192 Surat DBS",
          vehicleNumber: "GJ-17-ZZ-8899",
          cargoType: "Diesel",
          quantity: 15000,
          priority: "HIGH",
          scheduledTime: new Date(
            Date.now() + 2 * 60 * 60 * 1000
          ).toISOString(),
          notes: "Credit cleared, dispatch in 1 hour",
        },
        {
          id: "SUR-PEND-002",
          route: "Hazira MS \u2192 Surat DBS",
          vehicleNumber: "GJ-21-YY-6677",
          cargoType: "Petrol",
          quantity: 12000,
          priority: "MEDIUM",
          scheduledTime: new Date(
            Date.now() + 5 * 60 * 60 * 1000
          ).toISOString(),
        },
      ],
    },
    "DBS-22": {
      dbsId: "DBS-22",
      dbsName: "Kalol DBS",
      location: "Kalol, Gujarat",
      dashboard: {
        stats: [
          { key: "totalTrips", value: "8", label: "Total Trips" },
          { key: "pending", value: "2", label: "Pending" },
          { key: "completed", value: "6", label: "Completed" },
        ],
        recentTrips: [
          {
            id: "KAL-TRP-001",
            route: "Kalol DBS \u2190 Vastral MS",
            status: "SCHEDULED",
            driverName: "Sanjay Vora",
            scheduledTime: new Date(
              Date.now() + 4 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
        allTrips: [
          {
            id: "KAL-TRP-000",
            route: "Kalol DBS \u2190 Vastral MS",
            status: "COMPLETED",
            driverName: "Dilip Rana",
            scheduledTime: new Date(
              Date.now() - 12 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
      },
      pendingTrips: [],
    },
    "DBS-23": {
      dbsId: "DBS-23",
      dbsName: "Anand DBS",
      location: "Anand, Gujarat",
      dashboard: {
        stats: [
          { key: "totalTrips", value: "6", label: "Total Trips" },
          { key: "pending", value: "1", label: "Pending" },
          { key: "completed", value: "5", label: "Completed" },
        ],
        recentTrips: [
          {
            id: "AND-TRP-001",
            route: "Anand DBS \u2190 Vastral MS",
            status: "EN_ROUTE",
            driverName: "Kishor Trivedi",
            scheduledTime: new Date(
              Date.now() + 2 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
        allTrips: [
          {
            id: "AND-TRP-000",
            route: "Anand DBS \u2190 Vastral MS",
            status: "COMPLETED",
            driverName: "Deepak Mehta",
            scheduledTime: new Date(
              Date.now() - 10 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
      },
      pendingTrips: [],
    },
    "DBS-24": {
      dbsId: "DBS-24",
      dbsName: "Nadiad DBS",
      location: "Nadiad, Gujarat",
      dashboard: {
        stats: [
          { key: "totalTrips", value: "5", label: "Total Trips" },
          { key: "pending", value: "2", label: "Pending" },
          { key: "completed", value: "3", label: "Completed" },
        ],
        recentTrips: [
          {
            id: "NAD-TRP-001",
            route: "Nadiad DBS \u2190 Vastral MS",
            status: "SCHEDULED",
            driverName: "Farhan Shaikh",
            scheduledTime: new Date(
              Date.now() + 6 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
        allTrips: [
          {
            id: "NAD-TRP-000",
            route: "Nadiad DBS \u2190 Vastral MS",
            status: "COMPLETED",
            driverName: "Ravi Patel",
            scheduledTime: new Date(
              Date.now() - 14 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
      },
      pendingTrips: [],
    },
  },
  msStations: {
    "MS-12": {
      msId: "MS-12",
      msName: "Vastral MS",
      location: "Ahmedabad, Gujarat",
      status: "OPERATIONAL",
      capacityLitre: 65000,
      utilization: 0.78,
      summary: {
        todaysDispatches: 4,
        pendingTrips: 2,
        completedTrips: 6,
      },
      trips: [
        {
          id: "MS12-TRP-201",
          dbsId: "DBS-09",
          dbsName: "Mehsana DBS",
          route: "Vastral MS \u2192 Mehsana DBS",
          product: "MS",
          quantity: 12000,
          status: "SCHEDULED",
          scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          vehicleNumber: "GJ-01-AA-2211",
          driverName: "Ankit Shah",
        },
        {
          id: "MS12-TRP-202",
          dbsId: "DBS-09",
          dbsName: "Mehsana DBS",
          route: "Vastral MS \u2192 Mehsana DBS",
          product: "Diesel",
          quantity: 15000,
          status: "LOADING",
          scheduledTime: new Date(
            Date.now() + 2 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-01-BB-3344",
          driverName: "Jignesh Rana",
        },
        {
          id: "MS12-TRP-199",
          dbsId: "DBS-15",
          dbsName: "Surat DBS",
          route: "Vastral MS \u2192 Surat DBS",
          product: "MS",
          quantity: 10000,
          status: "DISPATCHED",
          scheduledTime: new Date(
            Date.now() - 2 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-01-CC-5566",
          driverName: "Rakesh Patel",
        },
        {
          id: "MS12-TRP-188",
          dbsId: "DBS-12",
          dbsName: "Paldi DBS",
          route: "Vastral MS \u2192 Paldi DBS",
          product: "Petrol",
          quantity: 9000,
          status: "COMPLETED",
          scheduledTime: new Date(
            Date.now() - 20 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-01-DD-7788",
          driverName: "Divyesh Tolia",
        },
        {
          id: "MS12-TRP-210",
          dbsId: "DBS-22",
          dbsName: "Kalol DBS",
          route: "Vastral MS \u2192 Kalol DBS",
          product: "MS",
          quantity: 11000,
          status: "SCHEDULED",
          scheduledTime: new Date(
            Date.now() + 4 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-01-EE-9900",
          driverName: "Sanjay Vora",
        },
        {
          id: "MS12-TRP-211",
          dbsId: "DBS-23",
          dbsName: "Anand DBS",
          route: "Vastral MS \u2192 Anand DBS",
          product: "Diesel",
          quantity: 13000,
          status: "EN_ROUTE",
          scheduledTime: new Date(
            Date.now() + 2 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-01-FF-8811",
          driverName: "Kishor Trivedi",
        },
        {
          id: "MS12-TRP-212",
          dbsId: "DBS-24",
          dbsName: "Nadiad DBS",
          route: "Vastral MS \u2192 Nadiad DBS",
          product: "Premium Petrol",
          quantity: 9500,
          status: "SCHEDULED",
          scheduledTime: new Date(
            Date.now() + 6 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-01-GG-7722",
          driverName: "Farhan Shaikh",
        },
      ],
    },
    "MS-14": {
      msId: "MS-14",
      msName: "Sanand MS",
      location: "Sanand, Gujarat",
      status: "OPERATIONAL",
      capacityLitre: 72000,
      utilization: 0.64,
      summary: {
        todaysDispatches: 3,
        pendingTrips: 1,
        completedTrips: 5,
      },
      trips: [
        {
          id: "MS14-TRP-301",
          dbsId: "DBS-09",
          dbsName: "Mehsana DBS",
          route: "Sanand MS \u2192 Mehsana DBS",
          product: "Diesel",
          quantity: 18000,
          status: "SCHEDULED",
          scheduledTime: new Date(
            Date.now() + 3 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-02-AA-9911",
          driverName: "Nilesh Parmar",
        },
        {
          id: "MS14-TRP-287",
          dbsId: "DBS-15",
          dbsName: "Surat DBS",
          route: "Sanand MS \u2192 Surat DBS",
          product: "MS",
          quantity: 16000,
          status: "DISPATCHED",
          scheduledTime: new Date(
            Date.now() - 3 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-02-BB-8822",
          driverName: "Mahesh Prajapati",
        },
        {
          id: "MS14-TRP-278",
          dbsId: "DBS-17",
          dbsName: "Vadodara DBS",
          route: "Sanand MS \u2192 Vadodara DBS",
          product: "Diesel",
          quantity: 14000,
          status: "COMPLETED",
          scheduledTime: new Date(
            Date.now() - 26 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-02-CC-7733",
          driverName: "Sagar Bhanderi",
        },
      ],
    },
    "MS-18": {
      msId: "MS-18",
      msName: "Naroda MS",
      location: "Naroda, Gujarat",
      status: "MAINTENANCE",
      capacityLitre: 54000,
      utilization: 0.51,
      summary: {
        todaysDispatches: 2,
        pendingTrips: 1,
        completedTrips: 4,
      },
      trips: [
        {
          id: "MS18-TRP-110",
          dbsId: "DBS-09",
          dbsName: "Mehsana DBS",
          route: "Naroda MS \u2192 Mehsana DBS",
          product: "Premium Petrol",
          quantity: 8000,
          status: "ON_HOLD",
          scheduledTime: new Date(
            Date.now() + 5 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-03-AA-6611",
          driverName: "Hemant Joshi",
        },
        {
          id: "MS18-TRP-108",
          dbsId: "DBS-21",
          dbsName: "Gandhinagar DBS",
          route: "Naroda MS \u2192 Gandhinagar DBS",
          product: "Diesel",
          quantity: 11000,
          status: "SCHEDULED",
          scheduledTime: new Date(
            Date.now() + 9 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-03-BB-5522",
          driverName: "Vikram Jhala",
        },
        {
          id: "MS18-TRP-098",
          dbsId: "DBS-09",
          dbsName: "Mehsana DBS",
          route: "Naroda MS \u2192 Mehsana DBS",
          product: "MS",
          quantity: 10000,
          status: "COMPLETED",
          scheduledTime: new Date(
            Date.now() - 22 * 60 * 60 * 1000
          ).toISOString(),
          vehicleNumber: "GJ-03-CC-4433",
          driverName: "Yogesh Parmar",
        },
      ],
    },
  },
  fdodoStations: {
    "DBS-15": {
      credit: {
        status: "OK",
        sapStatus: "LIVE",
        available: 65000,
        reserved: 12000,
        used: 23000,
        limit: 100000,
        currency: "INR",
        lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      requests: [
        {
          id: "FDODO-REQ-001",
          dbsId: "DBS-15",
          quantity: 15000,
          status: "APPROVED",
          requestedAt: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          approvedAt: new Date(
            Date.now() - 2.5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          fulfilledQuantity: 15000,
          sapStatus: "CLEARED",
          notes: "Weekend top-up",
        },
        {
          id: "FDODO-REQ-002",
          dbsId: "DBS-15",
          quantity: 10000,
          status: "FILLED",
          requestedAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          approvedAt: new Date(
            Date.now() - 1.8 * 24 * 60 * 60 * 1000
          ).toISOString(),
          fulfilledQuantity: 9800,
          sapStatus: "CONFIRM_REQUIRED",
          notes: "Please confirm received quantity",
          requiresConfirmation: true,
        },
        {
          id: "FDODO-REQ-003",
          dbsId: "DBS-15",
          quantity: 20000,
          status: "PENDING",
          requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          sapStatus: "UNDER_REVIEW",
          notes: "Awaiting SAP credit check",
        },
      ],
      nextId: 4,
    },
  },
  stoRecords: [],
  deliveries: [],
  deliveryHistory: [],
  manualRequests: [],
  reconcileQueue: [
    {
      id: "RCN-101",
      tripId: "TRIP-9901",
      amount: 52340,
      status: "PENDING",
      submittedAt: "2025-01-06T06:45:00.000Z",
    },
  ],
  permissions: {
    // Mock permissions by user ID; adjust in tests to simulate different grants
    2: {
      canApproveProposals: true,
      canTriggerCorrectiveActions: true,
      canManageDrivers: true,
      canManageClusters: true,
    },
  },
};

enforceCngOnly(_mock);

const ARROW_LEFT = "\u2190";
const ARROW_RIGHT = "\u2192";

const PRODUCT_LOCATION_KEYWORDS = ["MS", "Fueling Station"];

function extractMsNameFromRoute(route) {
  if (typeof route !== "string") return null;
  const hasLeftArrow = route.includes(ARROW_LEFT);
  const hasRightArrow = route.includes(ARROW_RIGHT);
  if (hasLeftArrow) {
    const parts = route.split(ARROW_LEFT);
    return parts[1]?.trim() || null;
  }
  if (hasRightArrow) {
    const parts = route.split(ARROW_RIGHT);
    return parts[0]?.trim() || null;
  }
  const match = route.match(/([A-Za-z0-9\s-]+MS)/i);
  return match ? match[0].trim() : null;
}

function rewriteRouteString(route, dbsName, msName) {
  const dbLabel = dbsName || "DBS";
  const msLabel = msName || "MS";
  if (typeof route === "string" && route.includes(ARROW_LEFT)) {
    return `${dbLabel} ${ARROW_LEFT} ${msLabel}`;
  }
  return `${msLabel} ${ARROW_RIGHT} ${dbLabel}`;
}

function normalizeLocationField(value, dbsName, msName) {
  if (typeof value !== "string") return value;
  if (value.includes("MS")) return msName || value;
  if (value.includes("DBS")) return dbsName || value;
  return value;
}

function normalizeRecordMsFields(record, dbsName, msName, msId) {
  if (!record || typeof record !== "object") return;
  if ("msName" in record) record.msName = msName;
  if ("msId" in record) record.msId = msId;
  if ("dbsName" in record) record.dbsName = dbsName;
  if ("route" in record) {
    record.route = rewriteRouteString(record.route, dbsName, msName);
  }
  if ("origin" in record) {
    record.origin = normalizeLocationField(record.origin, dbsName, msName);
  }
  if ("destination" in record) {
    record.destination = normalizeLocationField(
      record.destination,
      dbsName,
      msName
    );
  }
  if ("fromLocation" in record) {
    record.fromLocation = normalizeLocationField(
      record.fromLocation,
      dbsName,
      msName
    );
  }
  if ("toLocation" in record) {
    record.toLocation = normalizeLocationField(
      record.toLocation,
      dbsName,
      msName
    );
  }
}

function determineCanonicalMsName(station, existingMap) {
  if (!station) return null;
  if (station.preferredMsName) return station.preferredMsName;
  if (station.dbsId && existingMap[station.dbsId]) {
    return existingMap[station.dbsId];
  }

  const sources = [
    station.dashboard?.recentTrips,
    station.dashboard?.allTrips,
    station.pendingTrips,
    station.transport?.items,
    station.transfers?.items,
  ];

  for (const list of sources) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item) continue;
      if (item.msName) return item.msName;
      const fromRoute = extractMsNameFromRoute(item.route);
      if (fromRoute) return fromRoute;
      const fromOrigin = typeof item.origin === "string" ? item.origin : null;
      if (fromOrigin && PRODUCT_LOCATION_KEYWORDS.some((key) => fromOrigin.includes(key))) {
        return fromOrigin;
      }
    }
  }
  return null;
}

function enforceSingleMsPerDbs() {
  const dbsStations = _mock.customerStations || {};
  const msStations = _mock.msStations || {};
  const dbsToMsName = {};
  const dbsToMsId = {};

  Object.values(msStations).forEach((ms) => {
    (ms?.trips || []).forEach((trip) => {
      if (!trip?.dbsId) return;
      if (!dbsToMsName[trip.dbsId]) {
        dbsToMsName[trip.dbsId] = ms.msName;
        dbsToMsId[trip.dbsId] = ms.msId;
      }
    });
  });

  Object.values(dbsStations).forEach((station) => {
    if (!station) return;
    const dbsName = station.dbsName || station.dbsId || "DBS Station";
    const canonicalMsName =
      determineCanonicalMsName(station, dbsToMsName) || "Primary MS";
    const canonicalMsId =
      dbsToMsId[station.dbsId] ||
      canonicalMsName.replace(/\s+/g, "-").toUpperCase();

    station.primaryMsName = canonicalMsName;
    station.primaryMsId = canonicalMsId;

    const applyNormalization = (list) => {
      if (!Array.isArray(list)) return;
      list.forEach((item) =>
        normalizeRecordMsFields(item, dbsName, canonicalMsName, canonicalMsId)
      );
    };

    applyNormalization(station.dashboard?.recentTrips || []);
    applyNormalization(station.dashboard?.allTrips || []);
    applyNormalization(station.pendingTrips || []);
    applyNormalization(station.transport?.items || []);
    applyNormalization(station.transfers?.items || []);

    // Also ensure dashboard stats/transport summary use canonical names in strings if any
  });
}

const defaultRolePermissions = {
  EIC: {
    canApproveProposals: true,
    canTriggerCorrectiveActions: true,
    canManageDrivers: true,
    canManageClusters: true,
  },
};

function getStationData(dbsId) {
  if (!_mock.customerStations) return null;
  return (
    _mock.customerStations[dbsId] || _mock.customerStations["DBS-09"] || null
  );
}

function resolvePermissions(userId, role) {
  if (!userId || !role) return {};
  const roleDefaults = defaultRolePermissions[role] || {};
  const userOverrides = _mock.permissions?.[userId] || {};
  return { ...roleDefaults, ...userOverrides };
}

export function mockGetUserPermissions(userId, role) {
  return { ...resolvePermissions(userId, role) };
}

export function mockSetUserPermissions(userId, permissions) {
  if (!userId) return;
  const current = _mock.permissions?.[userId] || {};
  _mock.permissions[userId] = { ...current, ...permissions };
}

function parseRouteStations(route = "") {
  if (typeof route !== "string" || route.length === 0) {
    return { origin: null, destination: null };
  }
  if (route.includes("←")) {
    const parts = route.split("←");
    return {
      destination: parts[0]?.trim() || null,
      origin: parts[1]?.trim() || null,
    };
  }
  if (route.includes("→")) {
    const parts = route.split("→");
    return {
      origin: parts[0]?.trim() || null,
      destination: parts[1]?.trim() || null,
    };
  }
  return { origin: null, destination: null };
}

enforceSingleMsPerDbs();

function pickByKeyword(values = [], keyword = "") {
  if (!keyword) return null;
  const target = keyword.toUpperCase();
  return (
    values.find(
      (value) =>
        typeof value === "string" && value.toUpperCase().includes(target)
    ) || null
  );
}

function normalizeScheduleTrip(trip = {}, defaults = {}) {
  const safeTrip = { ...trip };
  const { origin, destination } = parseRouteStations(safeTrip.route || "");
  const msCandidate = pickByKeyword(
    [safeTrip.msName, origin, destination, defaults.msName],
    "MS"
  );
  const dbsCandidate = pickByKeyword(
    [safeTrip.dbsName, destination, origin, defaults.dbsName],
    "DBS"
  );
  const scheduledTime =
    safeTrip.scheduledTime ||
    safeTrip.time ||
    safeTrip.createdAt ||
    new Date().toISOString();
  return {
    ...safeTrip,
    scheduledTime,
    msName:
      msCandidate ||
      safeTrip.msName ||
      defaults.msName ||
      defaults.msId ||
      null,
    dbsName:
      dbsCandidate ||
      safeTrip.dbsName ||
      defaults.dbsName ||
      defaults.dbsId ||
      null,
  };
}

function sortTripsBySchedule(trips = []) {
  return [...trips].sort((a, b) => {
    const ta = new Date(a?.scheduledTime || a?.time || 0).getTime();
    const tb = new Date(b?.scheduledTime || b?.time || 0).getTime();
    return ta - tb;
  });
}

const ACTIVE_STATUS_KEYWORDS = [
  "IN_PROGRESS",
  "LOADING",
  "DISPATCHED",
  "EN_ROUTE",
  "ARRIVED",
  "QUEUE",
];
const COMPLETED_STATUS_KEYWORDS = ["COMPLETED", "DELIVERED", "CONFIRMED"];

function computeStatusSummary(trips = []) {
  return trips.reduce(
    (acc, trip) => {
      const status = String(trip?.status || "").toUpperCase();
      if (status.length === 0) {
        acc.pending += 1;
        return acc;
      }
      if (COMPLETED_STATUS_KEYWORDS.some((key) => status.includes(key))) {
        acc.completed += 1;
      } else if (ACTIVE_STATUS_KEYWORDS.some((key) => status.includes(key))) {
        acc.inProgress += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    { pending: 0, inProgress: 0, completed: 0 }
  );
}

function buildDbsSchedulePayload(station, fallbackId) {
  if (!station) {
    return {
      station: {
        dbsId: fallbackId,
        dbsName: fallbackId || "DBS Station",
      },
      trips: [],
      summary: { pending: 0, inProgress: 0, completed: 0 },
    };
  }

  const aggregated = [
    ...(station.dashboard?.recentTrips || []),
    ...(station.dashboard?.allTrips || []),
    ...(station.pendingTrips || []),
  ];

  const seen = new Set();
  const trips = aggregated.reduce((acc, trip, idx) => {
    if (!trip) return acc;
    const tripId =
      trip.id || `${station.dbsId || fallbackId || "DBS"}-TRIP-${idx}`;
    if (seen.has(tripId)) return acc;
    seen.add(tripId);
    acc.push(
      normalizeScheduleTrip(
        { ...trip, id: tripId },
        { dbsId: station.dbsId || fallbackId, dbsName: station.dbsName }
      )
    );
    return acc;
  }, []);

  const sortedTrips = sortTripsBySchedule(trips);

  // Align every trip to a single MS attachment per DBS
  const canonicalMsName =
    station.preferredMsName ||
    sortedTrips.find((trip) => trip.msName)?.msName ||
    null;
  const canonicalMsId =
    station.preferredMsId ||
    sortedTrips.find((trip) => trip.msId)?.msId ||
    null;
  const canonicalDbsName = station.dbsName || fallbackId || "DBS Station";

  let alignedTrips = sortedTrips;
  if (canonicalMsName || canonicalMsId) {
    const filtered = sortedTrips
      .filter((trip) => {
        if (canonicalMsId && trip.msId) return trip.msId === canonicalMsId;
        if (canonicalMsName && trip.msName)
          return trip.msName === canonicalMsName;
        // keep records that don't carry MS metadata yet
        return !trip.msName && !trip.msId;
      })
      .map((trip) => {
        const msName =
          canonicalMsName || trip.msName || canonicalMsId || trip.msId || null;
        return {
          ...trip,
          msId: canonicalMsId || trip.msId || null,
          msName,
          route:
            msName && canonicalDbsName
              ? `${msName} \u2192 ${canonicalDbsName}`
              : trip.route,
        };
      });
    if (filtered.length > 0) {
      alignedTrips = filtered;
    }
  }

  return {
    station: {
      dbsId: station.dbsId || fallbackId,
      dbsName: station.dbsName || fallbackId || "DBS Station",
      location: station.location,
      stats: station.dashboard?.stats
        ? station.dashboard.stats.map((stat) => ({ ...stat }))
        : [],
    },
    trips: alignedTrips,
    summary: computeStatusSummary(alignedTrips),
  };
}

/** AUTH — POST /auth/login */
export async function mockLogin(usernameOrCredentials, passwordArg, roleArg) {
  await sleep(400);
  const credentials =
    typeof usernameOrCredentials === "object" && usernameOrCredentials !== null
      ? usernameOrCredentials
      : {
          username: usernameOrCredentials,
          password: passwordArg,
          role: roleArg,
        };
  const { username, password, role } = credentials;
  // Relaxed: allow UI-selected role to override stored role if creds match
  const user = _mock.users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  const finalRole = role || user.role;
  const tokenPayload = {
    sub: user.id,
    role: finalRole,
    name: user.name,
    iat: Date.now(),
  };

  // RN-safe mock token (avoid Buffer / base64 here)
  const token = `mock.${tokenPayload.sub}.${tokenPayload.role}.${tokenPayload.iat}`;

  return {
    token,
    user: {
      id: user.id,
      role: finalRole,
      name: user.name,
      dbsId: user.dbsId,
      dbsName: user.dbsName,
      msId: user.msId,
      msName: user.msName,
      permissions: mockGetUserPermissions(user.id, finalRole),
    },
  };
}

/** DBS — simulate VTS geofence / RFID arrival */
export async function mockSignalArrival(tripId) {
  await sleep(300);
  const trip =
    _mock.trips[tripId] ||
    (_mock.trips[tripId] = { id: tripId, status: "CREATED" });
  trip.status = "ARRIVED";
  trip.pre = {
    pressure: 28.6,
    flow: 124.5,
    mfm: 100234.2,
    time: new Date().toISOString(),
  };
  return { ok: true, trip };
}

/** GET /dbs/decant/{tripId}/pre */
export async function mockGetPre(tripId) {
  await sleep(250);
  const trip = _mock.trips[tripId];
  if (!trip || !trip.pre) {
    const err = new Error("Trip not arrived yet");
    err.status = 404;
    throw err;
  }
  return { tripId, ...trip.pre };
}

/** POST /dbs/decant/{tripId}/start */
export async function mockStartDecant(tripId) {
  await sleep(250);
  const trip = _mock.trips[tripId];
  if (!trip || trip.status !== "ARRIVED") {
    const err = new Error("Trip not in ARRIVED state");
    err.status = 409;
    throw err;
  }
  trip.status = "STARTED";
  trip.startTime = new Date().toISOString();
  return { ok: true, tripId, startTime: trip.startTime };
}

/** POST /dbs/decant/{tripId}/end */
export async function mockEndDecant(tripId) {
  await sleep(350);
  const trip = _mock.trips[tripId];
  if (!trip || trip.status !== "STARTED") {
    const err = new Error("Trip not in STARTED state");
    err.status = 409;
    throw err;
  }
  trip.status = "ENDED";
  trip.endTime = new Date().toISOString();
  trip.post = {
    pressure: 12.2,
    flow: 0.0,
    mfm: (trip.pre?.mfm ?? 0) + 998.7,
    time: new Date().toISOString(),
  };
  return { ok: true, tripId, endTime: trip.endTime, ...trip.post };
}

/** GET /dbs/decant/{tripId}/end */
export async function mockGetEnd(tripId) {
  await sleep(200);
  const trip = _mock.trips[tripId];
  if (!trip || !trip.post) {
    const err = new Error("No post-decant metrics found");
    err.status = 404;
    throw err;
  }
  return { tripId, ...trip.post };
}

/** POST /dbs/decant/{tripId}/confirm */
export async function mockConfirmDelivery(
  tripId,
  { deliveredQty, operatorSig, driverSig }
) {
  await sleep(300);
  const trip = _mock.trips[tripId];
  if (!trip || trip.status !== "ENDED") {
    const err = new Error("Trip not in ENDED state");
    err.status = 409;
    throw err;
  }
  trip.deliveredQty = deliveredQty;
  trip.operatorSig = operatorSig;
  trip.driverSig = driverSig;
  trip.status = "CONFIRMED";
  // Real system: GTS pushes confirmation to SAP here
  const confirmation = {
    id: `DLV-${tripId}`,
    tripId,
    deliveredQty,
    operatorSig,
    driverSig,
    status: trip.status,
    confirmedAt: new Date().toISOString(),
  };
  _mock.deliveries = [
    ..._mock.deliveries.filter((d) => d.tripId !== tripId),
    confirmation,
  ];
  _mock.deliveryHistory.unshift({ ...confirmation });
  return { ok: true, tripId, status: trip.status };
}

/** First screen POST /auth/choose-role (optional) */
export async function mockChooseRole(role) {
  await sleep(200);
  return { ok: true, role };
}

/** PROPOSALS -------------------------------------------------------------- */
export async function fetchProposals() {
  await sleep(200);
  return _mock.proposals.map((p) => ({ ...p }));
}

export async function approveProposal(id) {
  await sleep(200);
  const proposal = _mock.proposals.find((p) => p.id === id);
  if (!proposal) {
    const err = new Error("Proposal not found");
    err.status = 404;
    throw err;
  }
  proposal.status = "APPROVED";
  proposal.approvedAt = new Date().toISOString();
  return { ...proposal };
}

/** DRIVER / TRIP FLOW ----------------------------------------------------- */
export async function fetchMyTrip() {
  await sleep(250);
  const trip = _mock.trips["TRIP-001"];
  if (!trip) {
    const err = new Error("No trip assigned");
    err.status = 404;
    throw err;
  }
  const token =
    _mock.driverTokens[trip.id] ||
    (_mock.driverTokens[trip.id] = `MOCK-TKN-${trip.id}`);
  return {
    tripId: trip.id,
    token,
    status: trip.status,
    msId: trip.msId,
    vehicle: trip.vehicle,
    driver: trip.driver,
  };
}

export async function driverAcceptTrip(tripId) {
  await sleep(200);
  const trip =
    _mock.trips[tripId] ||
    (_mock.trips[tripId] = {
      id: tripId,
      status: "CREATED",
      msId: "MS-99",
      vehicle: "GJ-05-XY-7890",
      driver: "Demo Driver",
    });
  trip.status = "ASSIGNED";
  const token = `MOCK-TKN-${tripId}-${Date.now()}`;
  _mock.driverTokens[tripId] = token;
  return { tripId, token, status: trip.status };
}

/** MS OPERATIONS ---------------------------------------------------------- */
export async function msPrefill(tokenId) {
  await sleep(180);
  const session =
    _mock.msSessions[tokenId] ||
    (_mock.msSessions[tokenId] = { tokenId, tripId: "TRIP-001" });
  const trip = _mock.trips[session.tripId] || _mock.trips["TRIP-001"];
  return {
    tokenId,
    tripId: session.tripId,
    driver: trip?.driver ?? "Rakesh Patel",
    vehicle: trip?.vehicle ?? "GJ-01-AB-1234",
    status: _mock.trips[session.tripId]?.status ?? "CREATED",
    checklist: {
      hoseInspection: true,
      pumpReady: true,
      safetyGear: true,
    },
  };
}

export async function msStartFill(tokenId) {
  await sleep(150);
  const session =
    _mock.msSessions[tokenId] ||
    (_mock.msSessions[tokenId] = { tokenId, tripId: "TRIP-001" });
  session.startedAt = new Date().toISOString();
  session.status = "IN_PROGRESS";
  return { tokenId, startedAt: session.startedAt, status: session.status };
}

export async function msEndFill(tokenId) {
  await sleep(150);
  const session = _mock.msSessions[tokenId];
  if (!session || !session.startedAt) {
    const err = new Error("Fill session not started");
    err.status = 409;
    throw err;
  }
  session.endedAt = new Date().toISOString();
  session.status = "COMPLETED";
  return {
    tokenId,
    endedAt: session.endedAt,
    status: session.status,
    deliveredQty: 995.4,
  };
}

export async function generateSTO(tripId) {
  await sleep(120);
  const stoNumber = `STO-${tripId}-${String(
    _mock.stoRecords.length + 1
  ).padStart(3, "0")}`;
  const record = {
    stoNumber,
    tripId,
    generatedAt: new Date().toISOString(),
  };
  _mock.stoRecords.push(record);
  return { ...record };
}

/** FDODO ------------------------------------------------------------------ */
export async function fdodoCredit(dbsId) {
  await sleep(180);
  const station =
    _mock.fdodoStations?.[dbsId] ||
    (dbsId ? null : _mock.fdodoStations?.["DBS-15"]);
  if (!station?.credit) {
    return {
      status: "UNKNOWN",
      sapStatus: "OFFLINE",
      available: 0,
      reserved: 0,
      used: 0,
      limit: 0,
      currency: "INR",
      lastUpdated: new Date().toISOString(),
      availableNet: 0,
      remaining: 0,
    };
  }
  const { credit } = station;
  const { limit = 0, used = 0, reserved = 0, available = 0 } = credit;
  const availableNet = Math.max(0, available);
  const remaining = Math.max(0, limit - (used + reserved));
  return {
    ...credit,
    availableNet,
    remaining,
  };
}

export async function fdodoRequest(payload = {}) {
  await sleep(220);
  const { dbsId, quantity } = payload;
  if (!dbsId) {
    throw new Error("dbsId is required to submit FDODO request");
  }
  const station = _mock.fdodoStations?.[dbsId];
  if (!station) {
    const err = new Error(`No FDODO station configured for ${dbsId}`);
    err.status = 404;
    throw err;
  }

  const credit = station.credit || {
    status: "UNKNOWN",
    available: 0,
    reserved: 0,
    used: 0,
    limit: 0,
    currency: "INR",
    sapStatus: "OFFLINE",
    lastUpdated: new Date().toISOString(),
  };

  const nowIso = new Date().toISOString();
  const nextId = station.nextId || station.requests.length + 1;
  const requestId = `FDODO-REQ-${String(nextId).padStart(3, "0")}`;

  const recordBase = {
    id: requestId,
    dbsId,
    quantity,
    priority: payload.priority || "NON_PRIORITY",
    requestedAt: nowIso,
    requestedFor: payload.requestedFor || nowIso,
    notes: payload.notes,
    sapStatus: "SUBMITTED",
  };

  let status = "PENDING";
  let blockReason = null;

  if (!quantity || quantity <= 0) {
    status = "REJECTED";
    blockReason = "Quantity must be greater than zero";
    recordBase.sapStatus = "INVALID_QUANTITY";
  } else if (credit.available < quantity) {
    status = "BLOCKED";
    blockReason = "Insufficient credit balance";
    recordBase.sapStatus = "CREDIT_INSUFFICIENT";
  } else {
    credit.available = Math.max(0, credit.available - quantity);
    credit.reserved = (credit.reserved || 0) + quantity;
    credit.lastUpdated = nowIso;
  }

  const record = {
    ...recordBase,
    status,
  };

  if (blockReason) {
    record.blockReason = blockReason;
  }

  station.requests = [record, ...station.requests];
  station.nextId = nextId + 1;

  return {
    ...record,
    credit: await fdodoCredit(dbsId),
  };
}

export async function getFdodoRequests(dbsId) {
  await sleep(180);
  const station =
    _mock.fdodoStations?.[dbsId] ||
    (dbsId ? null : _mock.fdodoStations?.["DBS-15"]);
  if (!station) {
    return { requests: [], credit: await fdodoCredit(dbsId) };
  }
  return {
    requests: station.requests.map((req) => ({ ...req })),
    credit: await fdodoCredit(dbsId),
  };
}

export async function fdodoConfirmFill(requestId, { dbsId, filledQuantity }) {
  await sleep(200);
  if (!dbsId) {
    throw new Error("dbsId is required to confirm filled quantity");
  }
  const station = _mock.fdodoStations?.[dbsId];
  if (!station) {
    const err = new Error(`No FDODO station configured for ${dbsId}`);
    err.status = 404;
    throw err;
  }
  const record = station.requests.find((req) => req.id === requestId);
  if (!record) {
    const err = new Error(`FDODO request ${requestId} not found`);
    err.status = 404;
    throw err;
  }

  const credit = station.credit || {};
  const nowIso = new Date().toISOString();
  const quantity = Number(filledQuantity ?? record.quantity ?? 0);

  record.fulfilledQuantity = quantity;
  record.status = "CONFIRMED";
  record.requiresConfirmation = false;
  record.confirmedAt = nowIso;
  record.sapStatus = "CONFIRMED";

  credit.reserved = Math.max(0, (credit.reserved || 0) - quantity);
  credit.used = (credit.used || 0) + quantity;
  credit.lastUpdated = nowIso;

  return {
    ...record,
    credit: await fdodoCredit(dbsId),
  };
}

export async function getFdodoDashboard(dbsId) {
  await sleep(220);
  const stationInfo = getStationData(dbsId) || {};
  const fdodoStation =
    _mock.fdodoStations?.[dbsId] ||
    (dbsId ? null : _mock.fdodoStations?.["DBS-15"]);

  const credit = await fdodoCredit(dbsId);
  const requests = fdodoStation?.requests?.map((req) => ({ ...req })) || [];
  const requestsSummary = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    blocked: requests.filter((r) => r.status === "BLOCKED").length,
    confirmationPending: requests.filter((r) => r.requiresConfirmation === true)
      .length,
  };

  const stocks = stationInfo?.stocks
    ? {
        summary: { ...(stationInfo.stocks.summary || {}) },
        stocks: (stationInfo.stocks.items || []).map((item) => ({ ...item })),
      }
    : { summary: {}, stocks: [] };

  const transport = stationInfo?.transport
    ? {
        summary: { ...(stationInfo.transport.summary || {}) },
        transports: (stationInfo.transport.items || []).map((item) => ({
          ...item,
        })),
      }
    : { summary: {}, transports: [] };

  const transfers = stationInfo?.transfers
    ? {
        summary: { ...(stationInfo.transfers.summary || {}) },
        transfers: (stationInfo.transfers.items || []).map((item) => ({
          ...item,
        })),
      }
    : { summary: {}, transfers: [] };

  return {
    station: {
      dbsId: stationInfo.dbsId || dbsId,
      name: stationInfo.dbsName,
      location: stationInfo.location,
    },
    credit,
    requests,
    requestsSummary,
    dashboard: stationInfo?.dashboard || { stats: [], recentTrips: [] },
    stocks,
    transport,
    transfers,
    pendingTrips: stationInfo?.pendingTrips?.map((item) => ({ ...item })) || [],
  };
}

/** DBS DECANTING ---------------------------------------------------------- */
export async function dbsPreDecant(tripId) {
  return mockGetPre(tripId);
}

export async function dbsStartDecant(tripId) {
  return mockStartDecant(tripId);
}

export async function dbsEndDecant(tripId) {
  return mockEndDecant(tripId);
}

export async function dbsConfirmDecant(
  tripId,
  { operatorSig, driverSig, deliveredQty }
) {
  return mockConfirmDelivery(tripId, { operatorSig, driverSig, deliveredQty });
}

export async function dbsDeliveries() {
  await sleep(150);
  return _mock.deliveries.map((d) => ({ ...d }));
}

export async function dbsHistory() {
  await sleep(150);
  return _mock.deliveryHistory.map((d) => ({ ...d }));
}

export async function dbsReconcile() {
  await sleep(200);
  return _mock.reconcileQueue.map((item) => ({ ...item }));
}

export async function dbsPushReconcile(ids = []) {
  await sleep(200);
  const processed = [];
  _mock.reconcileQueue = _mock.reconcileQueue.filter((item) => {
    if (ids.includes(item.id)) {
      processed.push({
        ...item,
        status: "PUSHED",
        pushedAt: new Date().toISOString(),
      });
      return false;
    }
    return true;
  });
  return { ok: true, processed };
}

export async function dbsManualRequest(payload) {
  await sleep(180);
  const record = {
    id: `REQ-${_mock.manualRequests.length + 1}`,
    submittedAt: new Date().toISOString(),
    status: "SUBMITTED",
    ...payload,
  };
  _mock.manualRequests.push(record);
  return { ...record };
}

// Customer API Mock Functions
export async function getCustomerDashboard(dbsId) {
  await sleep(300);
  const station = getStationData(dbsId);
  if (station?.dashboard) {
    const { stats = [], recentTrips = [], allTrips = [] } = station.dashboard;
    return {
      stats: stats.map((item, idx) => ({
        ...item,
        key: item.key || `stat-${idx}`,
      })),
      recentTrips: recentTrips.map((trip) => ({ ...trip })),
      allTrips: allTrips.map((trip) => ({ ...trip })),
    };
  }
  console.log("Mock getCustomerDashboard called with:", dbsId);
  return {
    stats: [
      { key: "totalTrips", value: "24", label: "Total Trips" },
      { key: "pending", value: "3", label: "Pending" },
      { key: "completed", value: "21", label: "Completed" },
      { key: "delayed", value: "2", label: "Delayed" },
    ],
    recentTrips: [
      {
        id: "TRP-2024-001",
        route: "Mehsana DBS ← Changodar MS",
        status: "IN_PROGRESS",
        driverName: "Rakesh Patel",
        scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "TRP-2024-002",
        route: "Mehsana DBS ← Changodar MS",
        status: "COMPLETED",
        driverName: "Suresh Shah",
        scheduledTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "TRP-2024-003",
        route: "Mehsana DBS ← Naroda MS",
        status: "PENDING",
        driverName: "Priya Mehta",
        scheduledTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
}

export async function getCurrentStocks(dbsId) {
  await sleep(250);
  const station = getStationData(dbsId);
  if (station?.stocks) {
    const { summary = {}, items = [] } = station.stocks;
    return {
      summary: { ...summary },
      stocks: items.map((item) => ({ ...item })),
    };
  }
  return {
    summary: {
      totalProducts: 4,
      totalCapacity: 75000,
      totalStock: 52500,
    },
    stocks: [
      {
        id: "STOCK-001",
        productName: "Petrol (Regular)",
        productType: "Fuel",
        currentStock: 18500,
        capacity: 25000,
        percentage: 74,
        lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: "STOCK-002",
        productName: "Diesel",
        productType: "Fuel",
        currentStock: 22000,
        capacity: 30000,
        percentage: 73,
        lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: "STOCK-003",
        productName: "Premium Petrol",
        productType: "Fuel",
        currentStock: 8000,
        capacity: 15000,
        percentage: 53,
        lastUpdated: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      {
        id: "STOCK-004",
        productName: "CNG",
        productType: "Gas",
        currentStock: 4000,
        capacity: 5000,
        percentage: 80,
        lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ],
  };
}

export async function getTransportTracking(dbsId) {
  await sleep(200);
  const station = getStationData(dbsId);
  if (station?.transport) {
    const { summary = {}, items = [] } = station.transport;
    return {
      summary: { ...summary },
      transports: items.map((item) => ({ ...item })),
    };
  }
  return {
    summary: {
      activeTransports: 3,
      enRoute: 2,
      delayed: 1,
    },
    transports: [
      {
        id: "TRK-001",
        vehicleNumber: "GJ-01-AB-1234",
        driverName: "Rakesh Patel",
        status: "EN_ROUTE",
        origin: "Vastral MS",
        destination: "Mehsana DBS",
        cargoType: "Petrol",
        quantity: 15000,
        progressPercentage: 65,
        departureTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        estimatedArrival: new Date(
          Date.now() + 1 * 60 * 60 * 1000
        ).toISOString(),
        currentLocation: "Near Gandhinagar Toll Plaza",
      },
      {
        id: "TRK-002",
        vehicleNumber: "GJ-05-CD-5678",
        driverName: "Suresh Shah",
        status: "LOADING",
        origin: "Sanand MS",
        destination: "Mehsana DBS",
        cargoType: "Diesel",
        quantity: 20000,
        progressPercentage: 15,
        departureTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        estimatedArrival: new Date(
          Date.now() + 4 * 60 * 60 * 1000
        ).toISOString(),
        currentLocation: "Sanand MS Loading Bay",
      },
      {
        id: "TRK-003",
        vehicleNumber: "GJ-02-EF-9012",
        driverName: "Priya Mehta",
        status: "DELAYED",
        origin: "Naroda MS",
        destination: "Mehsana DBS",
        cargoType: "Premium Petrol",
        quantity: 8000,
        progressPercentage: 45,
        departureTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        estimatedArrival: new Date(
          Date.now() + 2 * 60 * 60 * 1000
        ).toISOString(),
        currentLocation: "Stuck in traffic near Kalol",
      },
    ],
  };
}

export async function getStockTransfers(dbsId) {
  await sleep(220);
  const station = getStationData(dbsId);
  if (station?.transfers) {
    const { summary = {}, items = [] } = station.transfers;
    return {
      summary: { ...summary },
      transfers: items.map((item) => ({ ...item })),
    };
  }
  return {
    summary: {
      totalTransfers: 8,
      pending: 2,
      inProgress: 1,
      completed: 5,
    },
    transfers: [
      {
        id: "TXF-001",
        type: "INCOMING",
        fromLocation: "Vastral MS",
        toLocation: "Mehsana DBS",
        productName: "Petrol (Regular)",
        quantity: 15000,
        status: "IN_PROGRESS",
        initiatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        estimatedCompletion: new Date(
          Date.now() + 1 * 60 * 60 * 1000
        ).toISOString(),
        notes: "High priority delivery for weekend rush",
      },
      {
        id: "TXF-002",
        type: "INCOMING",
        fromLocation: "Sanand MS",
        toLocation: "Mehsana DBS",
        productName: "Diesel",
        quantity: 20000,
        status: "PENDING",
        initiatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        estimatedCompletion: new Date(
          Date.now() + 4 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "TXF-003",
        type: "OUTGOING",
        fromLocation: "Mehsana DBS",
        toLocation: "Paldi Retail Station",
        productName: "Petrol (Regular)",
        quantity: 5000,
        status: "COMPLETED",
        initiatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "TXF-004",
        type: "INTERNAL",
        fromLocation: "Tank A",
        toLocation: "Tank B",
        productName: "Premium Petrol",
        quantity: 3000,
        status: "PENDING",
        initiatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        estimatedCompletion: new Date(
          Date.now() + 2 * 60 * 60 * 1000
        ).toISOString(),
        notes: "Tank maintenance transfer",
      },
    ],
  };
}

export async function getPendingTrips(dbsId) {
  await sleep(180);
  const station = getStationData(dbsId);
  if (station?.pendingTrips) {
    return {
      trips: station.pendingTrips.map((trip) => ({ ...trip })),
    };
  }
  return {
    trips: [
      {
        id: "TRP-PEND-001",
        route: "Vastral MS → Mehsana DBS",
        vehicleNumber: "GJ-03-GH-3456",
        cargoType: "Petrol",
        quantity: 12000,
        priority: "HIGH",
        scheduledTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        notes: "Urgent delivery required for weekend stock",
      },
      {
        id: "TRP-PEND-002",
        route: "Sanand MS → Mehsana DBS",
        vehicleNumber: "GJ-04-IJ-7890",
        cargoType: "Diesel",
        quantity: 18000,
        priority: "MEDIUM",
        scheduledTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "TRP-PEND-003",
        route: "Naroda MS → Mehsana DBS",
        vehicleNumber: "GJ-06-KL-2468",
        cargoType: "Premium Petrol",
        quantity: 8000,
        priority: "LOW",
        scheduledTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
}

export async function getDbsTripSchedule(dbsId) {
  await sleep(220);
  const station = getStationData(dbsId);
  return buildDbsSchedulePayload(station, dbsId);
}

export async function getMsTripSchedule(msId) {
  await sleep(220);
  const stations = _mock.msStations || {};
  const station = stations[msId] || Object.values(stations)[0] || null;

  if (!station) {
    return {
      station: {
        msId,
        msName: msId || "MS Station",
      },
      trips: [],
      summary: { pending: 0, inProgress: 0, completed: 0 },
    };
  }

  const trips = sortTripsBySchedule(
    (station.trips || []).map((trip, idx) =>
      normalizeScheduleTrip(
        {
          ...trip,
          id: trip.id || `${station.msId}-TRIP-${idx}`,
        },
        {
          msId: station.msId,
          msName: station.msName,
          dbsName: trip.dbsName,
          dbsId: trip.dbsId,
        }
      )
    )
  );

  return {
    station: {
      msId: station.msId,
      msName: station.msName,
      location: station.location,
      status: station.status,
      capacityLitre: station.capacityLitre,
      utilization: station.utilization,
      summary: { ...(station.summary || {}) },
    },
    trips,
    summary: computeStatusSummary(trips),
  };
}

export async function getMsCluster(msId) {
  await sleep(180);
  const customerStations = Object.values(_mock.customerStations || {});
  const msStations = _mock.msStations || {};
  const msRecord = (msId && msStations[msId]) || null;

  const linkedStations = customerStations
    .filter((station) => {
      if (!station) return false;
      if (msId && station.primaryMsId) {
        return station.primaryMsId === msId;
      }
      if (msRecord?.msName && station.primaryMsName) {
        return (
          station.primaryMsName.toLowerCase() ===
          msRecord.msName.toLowerCase()
        );
      }
      return false;
    })
    .map((station) => ({
      dbsId: station.dbsId,
      dbsName: station.dbsName,
      location: station.location,
      region: station.region,
      primaryMsId: station.primaryMsId,
      primaryMsName: station.primaryMsName,
    }))
    .sort((a, b) => (a.dbsName || "").localeCompare(b.dbsName || ""));

  return {
    ms: {
      msId: msRecord?.msId || msId || linkedStations[0]?.primaryMsId || null,
      msName:
        msRecord?.msName ||
        linkedStations[0]?.primaryMsName ||
        msId ||
        "MS Station",
      location: msRecord?.location || null,
    },
    dbs: linkedStations,
  };
}

export async function getNetworkOverview() {
  await sleep(250);

  const msStations = Object.values(_mock.msStations || {}).map((station) => {
    const trips = sortTripsBySchedule(
      (station.trips || []).map((trip, idx) =>
        normalizeScheduleTrip(
          {
            ...trip,
            id: trip.id || `${station.msId}-TRIP-${idx}`,
          },
          {
            msId: station.msId,
            msName: station.msName,
            dbsName: trip.dbsName,
            dbsId: trip.dbsId,
          }
        )
      )
    );
    const summary = computeStatusSummary(trips);
    return {
      msId: station.msId,
      msName: station.msName,
      location: station.location,
      status: station.status,
      capacityLitre: station.capacityLitre,
      utilization: station.utilization,
      summary: {
        ...summary,
        ...(station.summary || {}),
      },
      trips,
    };
  });

  const dbsStations = Object.values(_mock.customerStations || {}).map(
    (station) => {
      const payload = buildDbsSchedulePayload(station, station?.dbsId);
      return {
        ...payload.station,
        summary: payload.summary,
        trips: payload.trips,
      };
    }
  );

  const totals = {
    msCount: msStations.length,
    dbsCount: dbsStations.length,
    activeTrips:
      msStations.reduce((sum, ms) => sum + (ms.summary?.inProgress || 0), 0) +
      dbsStations.reduce((sum, dbs) => sum + (dbs.summary?.inProgress || 0), 0),
  };

  return {
    lastUpdated: new Date().toISOString(),
    totals,
    msStations,
    dbsStations,
  };
}

export async function getCustomerPermissions(userId) {
  await sleep(150);
  return {
    canAcceptTrips: userId === "6", // Only for sgl user
  };
}

export async function acceptTrip(tripId, userId) {
  await sleep(200);
  return {
    success: true,
    message: `Trip ${tripId} accepted successfully`,
    acceptedAt: new Date().toISOString(),
  };
}
