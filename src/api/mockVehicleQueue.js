export const mockVehicleQueue = [
  {
    vehicleId: "TN01AB1234",
    driverName: "Rajesh Kumar",
    driverPhone: "+919876543210", 
    queuePosition: 1,
    arrivalTime: "2024-01-15T10:30:00Z",
    estimatedWaitTime: "15 mins",
    bayAssigned: null,
    status: "waiting",
    cargoType: "Petrol",
    quantity: "5000L",
    destination: "DBS-Chennai-01"
  },
  {
    vehicleId: "KA02CD5678", 
    driverName: "Suresh Babu",
    driverPhone: "+919123456789",
    queuePosition: 2,
    arrivalTime: "2024-01-15T10:45:00Z", 
    estimatedWaitTime: "30 mins",
    bayAssigned: null,
    status: "waiting",
    cargoType: "Diesel",
    quantity: "8000L",
    destination: "DBS-Bangalore-02"
  },
  {
    vehicleId: "AP03EF9012", 
    driverName: "Venkat Reddy",
    driverPhone: "+919988776655",
    queuePosition: 3,
    arrivalTime: "2024-01-15T11:00:00Z", 
    estimatedWaitTime: "45 mins",
    bayAssigned: null,
    status: "waiting",
    cargoType: "Petrol",
    quantity: "6000L",
    destination: "DBS-Hyderabad-01"
  },
  {
    vehicleId: "MH04GH3456", 
    driverName: "Amit Sharma",
    driverPhone: "+919876543210",
    queuePosition: 4,
    arrivalTime: "2024-01-15T11:15:00Z", 
    estimatedWaitTime: "60 mins",
    bayAssigned: null,
    status: "waiting",
    cargoType: "Diesel",
    quantity: "7500L",
    destination: "DBS-Mumbai-03"
  },
  {
    vehicleId: "DL05IJ7890", 
    driverName: "Ravi Kumar",
    driverPhone: "+919123456789",
    queuePosition: 5,
    arrivalTime: "2024-01-15T11:30:00Z", 
    estimatedWaitTime: "75 mins",
    bayAssigned: null,
    status: "waiting",
    cargoType: "Petrol",
    quantity: "5500L",
    destination: "DBS-Delhi-01"
  },
  {
    vehicleId: "GJ06KL2345", 
    driverName: "Prakash Patel",
    driverPhone: "+919988776655",
    queuePosition: 6,
    arrivalTime: "2024-01-15T11:45:00Z", 
    estimatedWaitTime: "90 mins",
    bayAssigned: null,
    status: "waiting",
    cargoType: "Diesel",
    quantity: "9000L",
    destination: "DBS-Ahmedabad-02"
  }
];

export const mockBays = [
  { 
    bayId: "Bay-1", 
    status: "free", 
    currentVehicle: null,
    estimatedCompletion: null
  },
  { 
    bayId: "Bay-2", 
    status: "free", 
    currentVehicle: null,
    estimatedCompletion: null
  },
  { 
    bayId: "Bay-3", 
    status: "free", 
    currentVehicle: null,
    estimatedCompletion: null
  },
  { 
    bayId: "Bay-4", 
    status: "free", 
    currentVehicle: null,
    estimatedCompletion: null
  },
  { 
    bayId: "Bay-5", 
    status: "maintenance", 
    currentVehicle: null,
    estimatedCompletion: null
  }
];