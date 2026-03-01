// ─────────────────────────────────────────────────────────────────
//  FleetFlow — OpenAPI 3.0 Specification
//  Mounted at GET /api/docs (Swagger UI)
//  All 42 endpoints across 7 modules documented inline.
// ─────────────────────────────────────────────────────────────────

// Reusable response fragments
const errorResponse = (description: string) => ({
    description,
    content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
});

const successList = (itemRef: string, description = 'OK') => ({
    description,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: itemRef } },
                },
            },
        },
    },
});

const successSingle = (itemRef: string, description = 'OK') => ({
    description,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: itemRef },
                },
            },
        },
    },
});

const idParam = (name = 'id') => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string', example: '1' },
    description: `${name} of the resource`,
});

const bearerSecurity = [{ bearerAuth: [] }];

// ─────────────────────────────────────────────────────────────────

export const swaggerSpec = {
    openapi: '3.0.0',

    info: {
        title: 'FleetFlow — Fleet & Logistics Management API',
        version: '1.0.0',
        description: `
## Overview

**FleetFlow** is a production-grade modular fleet & logistics management system.
This API powers vehicle dispatch, driver HR, real-time GPS tracking, financial logging, and analytics.

---

## Authentication

All protected endpoints require a **Bearer JWT** token in the \`Authorization\` header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

Obtain a token via \`POST /api/v1/auth/login\`.

---

## Role-Based Access Control

| Role | Scope |
|------|-------|
| \`\` | Full access to all endpoints |
| \`MANAGER\` | Fleet, dispatch, analytics, finance read/write |
| \`DISPATCHER\` | Create and manage trips |
| \`SAFETY_OFFICER\` | Driver credentials, vehicle inspections |
| \`FINANCE_ANALYST\` | Fuel logs, expenses, maintenance costs, analytics |

---

## Error Format

All errors return a consistent JSON body with a machine-readable \`error_code\`:

\`\`\`json
{
  "success": false,
  "error_code": "NOT_FOUND",
  "message": "Record not found.",
  "details": null
}
\`\`\`
        `.trim(),
        contact: { name: 'FleetFlow Hackathon Team' },
    },

    servers: [
        { url: 'http://localhost:5000', description: 'Local Development' },
    ],

    tags: [
        { name: 'Health', description: 'System health check — no authentication required' },
        { name: 'Auth', description: 'Register, login, and fetch current user profile' },
        { name: 'Fleet', description: 'Vehicle CRUD, status transitions, and maintenance history' },
        { name: 'Trips', description: 'Trip dispatch lifecycle: DRAFT → DISPATCHED → COMPLETED' },
        { name: 'Drivers', description: 'Driver HR, compliance, safety scoring, license expiry alerts' },
        { name: 'Finance', description: 'Fuel logs, operational expenses, maintenance cost recording' },
        { name: 'Locations', description: 'Real-time GPS telemetry ingestion and vehicle map data' },
        { name: 'Analytics', description: 'KPI dashboard, fuel efficiency, ROI, monthly reports, CSV export' },
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Obtain a JWT from POST /api/v1/auth/login and pass it here.',
            },
        },

        schemas: {
            // ── Shared ───────────────────────────────────────────────────
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error_code: {
                        type: 'string',
                        enum: ['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND',
                            'CONFLICT', 'VALIDATION_ERROR', 'DUPLICATE_ENTRY',
                            'FOREIGN_KEY_VIOLATION', 'DB_VALIDATION_ERROR', 'INTERNAL_ERROR'],
                        example: 'NOT_FOUND',
                    },
                    message: { type: 'string', example: 'Record not found.' },
                    details: { nullable: true },
                },
            },

            // ── Auth ─────────────────────────────────────────────────────
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'arjun@fleetflow.in' },
                    password: { type: 'string', minLength: 6, example: 'Manager@1234' },
                },
            },
            RegisterRequest: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'priya@fleetflow.in' },
                    password: { type: 'string', minLength: 8, example: 'Secure@9876' },
                    fullName: { type: 'string', minLength: 2, example: 'Priya Sharma' },
                    role: {
                        type: 'string',
                        enum: ['', 'MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE_ANALYST'],
                        default: 'DISPATCHER',
                    },
                },
            },
            UserProfile: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '1' },
                    email: { type: 'string', example: 'arjun@fleetflow.in' },
                    fullName: { type: 'string', example: 'Arjun Mehta' },
                    role: { type: 'string', enum: ['', 'MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE_ANALYST'] },
                    isActive: { type: 'boolean', example: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            AuthResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                        type: 'object',
                        properties: {
                            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJyb2xlIjoiTUFOQUdFUiJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' },
                            user: { $ref: '#/components/schemas/UserProfile' },
                        },
                    },
                },
            },

            // ── Vehicle ──────────────────────────────────────────────────
            VehicleType: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '1' },
                    name: { type: 'string', enum: ['TRUCK', 'VAN', 'BIKE', 'PLANE'] },
                    description: { type: 'string', nullable: true },
                },
            },
            Vehicle: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '1' },
                    licensePlate: { type: 'string', example: 'MH-04-AB-1234' },
                    make: { type: 'string', example: 'Tata' },
                    model: { type: 'string', example: 'Prima 5530.S' },
                    year: { type: 'integer', example: 2022 },
                    color: { type: 'string', example: 'White', nullable: true },
                    vin: { type: 'string', example: 'TT2022MH001234', nullable: true },
                    vehicleTypeId: { type: 'string', example: '1' },
                    status: { type: 'string', enum: ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'] },
                    currentOdometer: { type: 'string', example: '45230.50' },
                    capacityWeight: { type: 'string', example: '25000.00', nullable: true },
                    capacityVolume: { type: 'string', example: '40.00', nullable: true },
                    isDeleted: { type: 'boolean', example: false },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateVehicleRequest: {
                type: 'object',
                required: ['licensePlate', 'make', 'model', 'year', 'vehicleTypeId'],
                properties: {
                    licensePlate: { type: 'string', example: 'KA-03-GH-3456' },
                    make: { type: 'string', example: 'Mahindra' },
                    model: { type: 'string', example: 'Supro Profit Truck' },
                    year: { type: 'integer', example: 2023 },
                    color: { type: 'string', example: 'Grey' },
                    vin: { type: 'string', example: 'MH2023KA003456' },
                    vehicleTypeId: { type: 'string', example: '2' },
                    capacityWeight: { type: 'number', example: 7500 },
                    capacityVolume: { type: 'number', example: 18 },
                },
            },
            UpdateVehicleRequest: {
                type: 'object',
                properties: {
                    make: { type: 'string' },
                    model: { type: 'string' },
                    color: { type: 'string' },
                    capacityWeight: { type: 'number' },
                    capacityVolume: { type: 'number' },
                },
            },
            UpdateVehicleStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['AVAILABLE', 'IN_SHOP', 'RETIRED'] },
                },
            },
            MaintenanceLog: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    vehicleId: { type: 'string' },
                    serviceType: { type: 'string', example: 'BRAKE_INSPECTION' },
                    description: { type: 'string', nullable: true },
                    cost: { type: 'string', example: '4500.00' },
                    odometerAtService: { type: 'string' },
                    technicianName: { type: 'string', nullable: true },
                    shopName: { type: 'string', nullable: true },
                    serviceDate: { type: 'string', format: 'date-time' },
                    nextServiceDue: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },

            // ── Driver ───────────────────────────────────────────────────
            Driver: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '1' },
                    licenseNumber: { type: 'string', example: 'MH-0120230012345' },
                    fullName: { type: 'string', example: 'Ramesh Kumar' },
                    phone: { type: 'string', example: '+91-98765-43210', nullable: true },
                    email: { type: 'string', example: 'ramesh@example.com', nullable: true },
                    licenseExpiryDate: { type: 'string', format: 'date' },
                    licenseClass: { type: 'string', example: 'MCWG', nullable: true },
                    status: { type: 'string', enum: ['ON_DUTY', 'OFF_DUTY', 'ON_TRIP', 'SUSPENDED'] },
                    safetyScore: { type: 'string', example: '98.00' },
                    isDeleted: { type: 'boolean', example: false },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateDriverRequest: {
                type: 'object',
                required: ['licenseNumber', 'fullName', 'licenseExpiryDate'],
                properties: {
                    licenseNumber: { type: 'string', example: 'DL-0120220056789' },
                    fullName: { type: 'string', example: 'Suresh Yadav' },
                    phone: { type: 'string', example: '+91-99887-66554' },
                    email: { type: 'string', format: 'email', example: 'suresh.yadav@driver.in' },
                    dateOfBirth: { type: 'string', format: 'date', example: '1988-07-22' },
                    licenseExpiryDate: { type: 'string', format: 'date', example: '2028-06-30' },
                    licenseClass: { type: 'string', example: 'HMV' },
                },
            },
            UpdateDriverRequest: {
                type: 'object',
                properties: {
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    licenseExpiryDate: { type: 'string', format: 'date' },
                    licenseClass: { type: 'string' },
                },
            },
            UpdateDriverStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['ON_DUTY', 'OFF_DUTY', 'SUSPENDED'] },
                },
            },
            RecalculateSafetyScoreRequest: {
                type: 'object',
                description: 'No request body required. Triggers server-side recalculation from trip data.',
                properties: {},
            },

            // ── Trip ─────────────────────────────────────────────────────
            Trip: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '1' },
                    vehicleId: { type: 'string', example: '1' },
                    driverId: { type: 'string', example: '1' },
                    origin: { type: 'string', example: 'Mumbai, Maharashtra' },
                    destination: { type: 'string', example: 'Pune, Maharashtra' },
                    distanceEstimated: { type: 'string', example: '148.50' },
                    distanceActual: { type: 'string', example: '151.20', nullable: true },
                    cargoWeight: { type: 'string', example: '12500.00', nullable: true },
                    cargoDescription: { type: 'string', example: 'Automotive parts', nullable: true },
                    revenue: { type: 'string', example: '28000.00', nullable: true },
                    clientName: { type: 'string', example: 'Tata Motors Ltd.', nullable: true },
                    invoiceReference: { type: 'string', example: 'INV-2026-001', nullable: true },
                    status: { type: 'string', enum: ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'] },
                    dispatchTime: { type: 'string', format: 'date-time', nullable: true },
                    completionTime: { type: 'string', format: 'date-time', nullable: true },
                    cancelledReason: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateTripRequest: {
                type: 'object',
                required: ['vehicleId', 'driverId', 'origin', 'destination', 'distanceEstimated'],
                properties: {
                    vehicleId: { type: 'string', example: '1' },
                    driverId: { type: 'string', example: '1' },
                    origin: { type: 'string', example: 'Mumbai, Maharashtra' },
                    destination: { type: 'string', example: 'Pune, Maharashtra' },
                    distanceEstimated: { type: 'number', example: 148.5 },
                    cargoWeight: { type: 'number', example: 12500 },
                    cargoDescription: { type: 'string', example: 'Automotive parts for assembly plant' },
                    revenue: { type: 'number', example: 28000 },
                    clientName: { type: 'string', example: 'Tata Motors Ltd.' },
                    invoiceReference: { type: 'string', example: 'INV-2026-001' },
                },
            },
            UpdateTripRequest: {
                type: 'object',
                properties: {
                    origin: { type: 'string' },
                    destination: { type: 'string' },
                    distanceEstimated: { type: 'number' },
                    cargoWeight: { type: 'number' },
                    cargoDescription: { type: 'string' },
                    revenue: { type: 'number' },
                    clientName: { type: 'string' },
                },
            },
            UpdateTripStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['DISPATCHED', 'COMPLETED', 'CANCELLED'] },
                    cancelledReason: { type: 'string', example: 'Vehicle breakdown on NH-48' },
                    distanceActual: { type: 'number', example: 151.2 },
                    odometerEnd: { type: 'number', example: 45381.7 },
                },
            },
            TripLedger: {
                type: 'object',
                properties: {
                    trip: { $ref: '#/components/schemas/Trip' },
                    fuelLogs: { type: 'array', items: { $ref: '#/components/schemas/FuelLog' } },
                    expenses: { type: 'array', items: { $ref: '#/components/schemas/Expense' } },
                    summary: {
                        type: 'object',
                        properties: {
                            revenue: { type: 'string', example: '28000.00' },
                            totalFuelCost: { type: 'string', example: '14225.26' },
                            totalExpenses: { type: 'string', example: '1420.00' },
                            netProfit: { type: 'string', example: '12354.74' },
                        },
                    },
                },
            },

            // ── Finance ──────────────────────────────────────────────────
            FuelLog: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    vehicleId: { type: 'string' },
                    tripId: { type: 'string', nullable: true },
                    liters: { type: 'string', example: '150.50' },
                    costPerLiter: { type: 'string', example: '94.5200' },
                    totalCost: { type: 'string', example: '14225.26' },
                    odometerAtFill: { type: 'string', example: '45380.00' },
                    fuelStation: { type: 'string', example: 'HPCL Highway Patrol — Khopoli', nullable: true },
                    loggedAt: { type: 'string', format: 'date-time' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateFuelLogRequest: {
                type: 'object',
                required: ['vehicleId', 'liters', 'costPerLiter', 'totalCost', 'odometerAtFill'],
                properties: {
                    vehicleId: { type: 'string', example: '1' },
                    tripId: { type: 'string', nullable: true, example: '1' },
                    liters: { type: 'number', example: 150.5 },
                    costPerLiter: { type: 'number', example: 94.52 },
                    totalCost: { type: 'number', example: 14225.26 },
                    odometerAtFill: { type: 'number', example: 45380.0 },
                    fuelStation: { type: 'string', example: 'HPCL Highway Patrol — Khopoli' },
                },
            },
            Expense: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    vehicleId: { type: 'string' },
                    tripId: { type: 'string', nullable: true },
                    amount: { type: 'string', example: '320.00' },
                    category: { type: 'string', enum: ['TOLL', 'LODGING', 'MAINTENANCE_EN_ROUTE', 'MISC'] },
                    description: { type: 'string', nullable: true },
                    dateLogged: { type: 'string', format: 'date-time' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateExpenseRequest: {
                type: 'object',
                required: ['vehicleId', 'amount', 'category'],
                properties: {
                    vehicleId: { type: 'string', example: '1' },
                    tripId: { type: 'string', nullable: true, example: '1' },
                    amount: { type: 'number', example: 320.00 },
                    category: { type: 'string', enum: ['TOLL', 'LODGING', 'MAINTENANCE_EN_ROUTE', 'MISC'], example: 'TOLL' },
                    description: { type: 'string', example: 'Mumbai-Pune Expressway toll' },
                },
            },
            CreateMaintenanceLogRequest: {
                type: 'object',
                required: ['vehicleId', 'serviceType', 'cost', 'odometerAtService', 'serviceDate'],
                properties: {
                    vehicleId: { type: 'string', example: '1' },
                    serviceType: { type: 'string', example: 'BRAKE_INSPECTION' },
                    description: { type: 'string', example: 'Annual brake system inspection and pad replacement' },
                    cost: { type: 'number', example: 4500.00 },
                    odometerAtService: { type: 'number', example: 45200.0 },
                    technicianName: { type: 'string', example: 'Ramkrishna Patil' },
                    shopName: { type: 'string', example: 'Tata Authorised Service Centre, Pune' },
                    serviceDate: { type: 'string', format: 'date-time', example: '2026-02-10T09:00:00Z' },
                    nextServiceDue: { type: 'string', format: 'date-time', example: '2026-08-10T09:00:00Z', nullable: true },
                },
            },

            // ── Locations ────────────────────────────────────────────────
            VehicleLocation: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    vehicleId: { type: 'string' },
                    latitude: { type: 'string', example: '19.0760000' },
                    longitude: { type: 'string', example: '72.8777000' },
                    speed: { type: 'string', example: '65.50', nullable: true },
                    heading: { type: 'string', example: '180.00', nullable: true },
                    accuracy: { type: 'string', example: '5.00', nullable: true },
                    recordedAt: { type: 'string', format: 'date-time' },
                },
            },
            RecordLocationRequest: {
                type: 'object',
                required: ['vehicleId', 'latitude', 'longitude'],
                properties: {
                    vehicleId: { type: 'string', example: '1' },
                    latitude: { type: 'number', example: 19.076, description: 'Latitude: -90 to +90, 7 decimal places' },
                    longitude: { type: 'number', example: 72.8777, description: 'Longitude: -180 to +180, 7 decimal places' },
                    speed: { type: 'number', example: 65.5, nullable: true, description: 'Speed in km/h' },
                    heading: { type: 'number', example: 180.0, nullable: true, description: 'Compass bearing 0–360°' },
                    accuracy: { type: 'number', example: 5.0, nullable: true, description: 'GPS accuracy in meters' },
                },
            },

            // ── Analytics ────────────────────────────────────────────────
            KPIData: {
                type: 'object',
                properties: {
                    totalVehicles: { type: 'integer', example: 12 },
                    availableVehicles: { type: 'integer', example: 8 },
                    activeTrips: { type: 'integer', example: 3 },
                    tripsThisMonth: { type: 'integer', example: 47 },
                    totalDrivers: { type: 'integer', example: 15 },
                    onDutyDrivers: { type: 'integer', example: 5 },
                    driversWithExpiringLicenses: { type: 'integer', example: 2 },
                    revenueThisMonth: { type: 'string', example: '450000.00' },
                    fuelCostThisMonth: { type: 'string', example: '85000.00' },
                    expensesThisMonth: { type: 'string', example: '22000.00' },
                    avgSafetyScore: { type: 'string', example: '87.50' },
                },
            },
        },
    },

    security: [{ bearerAuth: [] }],

    paths: {
        // ─────────────────────────────────────────────────────────────
        //  Health
        // ─────────────────────────────────────────────────────────────
        '/health': {
            get: {
                tags: ['Health'],
                summary: 'Health check',
                description: 'Returns server status. No authentication required. Use for uptime monitoring.',
                operationId: 'healthCheck',
                security: [],
                responses: {
                    200: {
                        description: 'Server is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        status: { type: 'string', example: 'healthy' },
                                        timestamp: { type: 'string', format: 'date-time' },
                                        version: { type: 'string', example: '1.0.0' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },

        // ─────────────────────────────────────────────────────────────
        //  Auth
        // ─────────────────────────────────────────────────────────────
        '/api/v1/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new user',
                description: 'Creates a new system user. Default role is `DISPATCHER`. Only `` should create privileged roles.',
                operationId: 'authRegister',
                security: [],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
                responses: {
                    201: { ...successSingle('#/components/schemas/AuthResponse', 'User registered and token returned'), },
                    409: errorResponse('Email already registered (DUPLICATE_ENTRY)'),
                    422: errorResponse('Validation error — invalid email, weak password, etc.'),
                },
            },
        },
        '/api/v1/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login and obtain JWT',
                description: 'Authenticates credentials and returns a Bearer JWT valid for the configured expiry window.',
                operationId: 'authLogin',
                security: [],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
                responses: {
                    200: { ...successSingle('#/components/schemas/AuthResponse', 'Login successful'), },
                    401: errorResponse('Invalid email or password (UNAUTHORIZED)'),
                    422: errorResponse('Validation error'),
                },
            },
        },
        '/api/v1/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get current user profile',
                description: 'Returns the authenticated user\'s profile decoded from the Bearer JWT.',
                operationId: 'authMe',
                security: bearerSecurity,
                responses: {
                    200: successSingle('#/components/schemas/UserProfile', 'Current user profile'),
                    401: errorResponse('Not authenticated'),
                },
            },
        },

        // ─────────────────────────────────────────────────────────────
        //  Fleet — Vehicle Types
        // ─────────────────────────────────────────────────────────────
        '/api/v1/fleet/types': {
            get: {
                tags: ['Fleet'],
                summary: 'List vehicle types',
                description: 'Returns all vehicle type lookup records (TRUCK, VAN, BIKE, PLANE). Used to populate vehicle creation dropdowns.',
                operationId: 'fleetListTypes',
                security: bearerSecurity,
                responses: {
                    200: successList('#/components/schemas/VehicleType', 'Vehicle type list'),
                    401: errorResponse('Not authenticated'),
                },
            },
        },

        // ─────────────────────────────────────────────────────────────
        //  Fleet — Vehicles
        // ─────────────────────────────────────────────────────────────
        '/api/v1/fleet/vehicles': {
            get: {
                tags: ['Fleet'],
                summary: 'List all vehicles',
                description: 'Returns all non-deleted vehicles. Supports filtering by `status` query param.',
                operationId: 'fleetListVehicles',
                security: bearerSecurity,
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'] }, description: 'Filter by vehicle status' },
                ],
                responses: {
                    200: successList('#/components/schemas/Vehicle', 'Vehicle list'),
                    401: errorResponse('Not authenticated'),
                },
            },
            post: {
                tags: ['Fleet'],
                summary: 'Create a vehicle',
                description: 'Registers a new fleet vehicle. Requires `MANAGER` or `` role.',
                operationId: 'fleetCreateVehicle',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateVehicleRequest' } } } },
                responses: {
                    201: successSingle('#/components/schemas/Vehicle', 'Vehicle created'),
                    403: errorResponse('Insufficient role (FORBIDDEN)'),
                    409: errorResponse('License plate or VIN already exists (DUPLICATE_ENTRY)'),
                    422: errorResponse('Validation error'),
                },
            },
        },
        '/api/v1/fleet/vehicles/{id}': {
            get: {
                tags: ['Fleet'],
                summary: 'Get vehicle by ID',
                operationId: 'fleetGetVehicle',
                security: bearerSecurity,
                parameters: [idParam('id')],
                responses: {
                    200: successSingle('#/components/schemas/Vehicle', 'Vehicle detail'),
                    404: errorResponse('Vehicle not found'),
                },
            },
            patch: {
                tags: ['Fleet'],
                summary: 'Update vehicle details',
                description: 'Partially updates vehicle metadata (make, model, color, capacity). Requires `MANAGER` or ``.',
                operationId: 'fleetUpdateVehicle',
                security: bearerSecurity,
                parameters: [idParam('id')],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateVehicleRequest' } } } },
                responses: {
                    200: successSingle('#/components/schemas/Vehicle', 'Vehicle updated'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Vehicle not found'),
                    422: errorResponse('Validation error'),
                },
            },
            delete: {
                tags: ['Fleet'],
                summary: 'Soft-delete a vehicle',
                description: 'Marks the vehicle as deleted (sets `is_deleted = true`). Historical trips and logs are preserved. ** only.**',
                operationId: 'fleetDeleteVehicle',
                security: bearerSecurity,
                parameters: [idParam('id')],
                responses: {
                    200: { description: 'Vehicle soft-deleted' },
                    403: errorResponse(' role required'),
                    404: errorResponse('Vehicle not found'),
                    409: errorResponse('Cannot delete vehicle with active trips (CONFLICT)'),
                },
            },
        },
        '/api/v1/fleet/vehicles/{id}/status': {
            patch: {
                tags: ['Fleet'],
                summary: 'Update vehicle status',
                description: 'Transitions vehicle status (AVAILABLE → IN_SHOP, IN_SHOP → AVAILABLE, any → RETIRED). Requires `MANAGER` or `SAFETY_OFFICER`.',
                operationId: 'fleetUpdateVehicleStatus',
                security: bearerSecurity,
                parameters: [idParam('id')],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateVehicleStatusRequest' } } } },
                responses: {
                    200: successSingle('#/components/schemas/Vehicle', 'Status updated'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Vehicle not found'),
                    409: errorResponse('Invalid state transition'),
                },
            },
        },
        '/api/v1/fleet/vehicles/{id}/maintenance': {
            get: {
                tags: ['Fleet'],
                summary: 'Get maintenance history for a vehicle',
                description: 'Returns all maintenance logs for the given vehicle, ordered by service date descending.',
                operationId: 'fleetGetMaintenance',
                security: bearerSecurity,
                parameters: [idParam('id')],
                responses: {
                    200: successList('#/components/schemas/MaintenanceLog', 'Maintenance log list'),
                    404: errorResponse('Vehicle not found'),
                },
            },
        },

        // ─────────────────────────────────────────────────────────────
        //  Trips
        // ─────────────────────────────────────────────────────────────
        '/api/v1/trips': {
            get: {
                tags: ['Trips'],
                summary: 'List trips',
                description: 'Returns trips. Supports filtering by `status` and `vehicleId` query params.',
                operationId: 'tripsList',
                security: bearerSecurity,
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'] } },
                    { name: 'vehicleId', in: 'query', schema: { type: 'string' }, description: 'Filter trips for a specific vehicle' },
                    { name: 'driverId', in: 'query', schema: { type: 'string' }, description: 'Filter trips for a specific driver' },
                ],
                responses: {
                    200: successList('#/components/schemas/Trip', 'Trip list'),
                    401: errorResponse('Not authenticated'),
                },
            },
            post: {
                tags: ['Trips'],
                summary: 'Create a trip (DRAFT)',
                description: 'Creates a new trip in DRAFT status. Vehicle must be AVAILABLE. Driver must be ON_DUTY. Requires `DISPATCHER`, `MANAGER`, or ``.',
                operationId: 'tripsCreate',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTripRequest' } } } },
                responses: {
                    201: successSingle('#/components/schemas/Trip', 'Trip created in DRAFT status'),
                    403: errorResponse('Insufficient role'),
                    409: errorResponse('Vehicle not AVAILABLE or driver not ON_DUTY (CONFLICT)'),
                    422: errorResponse('Validation error'),
                },
            },
        },
        '/api/v1/trips/{id}': {
            get: {
                tags: ['Trips'],
                summary: 'Get trip by ID',
                operationId: 'tripsGetById',
                security: bearerSecurity,
                parameters: [idParam('id')],
                responses: {
                    200: successSingle('#/components/schemas/Trip', 'Trip detail'),
                    404: errorResponse('Trip not found'),
                },
            },
            patch: {
                tags: ['Trips'],
                summary: 'Update trip details (DRAFT only)',
                description: 'Updates mutable fields on a DRAFT trip (origin, destination, cargo, revenue, client). Dispatched/Completed trips cannot be modified.',
                operationId: 'tripsUpdate',
                security: bearerSecurity,
                parameters: [idParam('id')],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTripRequest' } } } },
                responses: {
                    200: successSingle('#/components/schemas/Trip', 'Trip updated'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Trip not found'),
                    409: errorResponse('Cannot modify a dispatched or completed trip'),
                    422: errorResponse('Validation error'),
                },
            },
        },
        '/api/v1/trips/{id}/status': {
            patch: {
                tags: ['Trips'],
                summary: 'Transition trip status',
                description: `State machine transitions:
- \`DRAFT → DISPATCHED\`: sets dispatch_time, locks vehicle to ON_TRIP, driver to ON_TRIP
- \`DISPATCHED → COMPLETED\`: sets completion_time, releases vehicle/driver to AVAILABLE/ON_DUTY
- \`DRAFT | DISPATCHED → CANCELLED\`: terminal state, requires \`cancelledReason\``,
                operationId: 'tripsUpdateStatus',
                security: bearerSecurity,
                parameters: [idParam('id')],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTripStatusRequest' } } } },
                responses: {
                    200: successSingle('#/components/schemas/Trip', 'Status transitioned'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Trip not found'),
                    409: errorResponse('Invalid state transition'),
                    422: errorResponse('Validation error — e.g. cancelledReason required for CANCELLED'),
                },
            },
        },
        '/api/v1/trips/{id}/ledger': {
            get: {
                tags: ['Trips'],
                summary: 'Get trip financial ledger',
                description: 'Returns the full financial breakdown for a trip: fuel logs, expenses, revenue, and calculated net profit. Restricted to `FINANCE_ANALYST`, `MANAGER`, ``.',
                operationId: 'tripsGetLedger',
                security: bearerSecurity,
                parameters: [idParam('id')],
                responses: {
                    200: successSingle('#/components/schemas/TripLedger', 'Trip financial ledger'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Trip not found'),
                },
            },
        },

        // ─────────────────────────────────────────────────────────────
        //  Drivers (HR)
        // ─────────────────────────────────────────────────────────────
        '/api/v1/drivers': {
            get: {
                tags: ['Drivers'],
                summary: 'List drivers',
                description: 'Returns all non-deleted drivers. Filter by `status` query param.',
                operationId: 'driversList',
                security: bearerSecurity,
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['ON_DUTY', 'OFF_DUTY', 'ON_TRIP', 'SUSPENDED'] } },
                ],
                responses: {
                    200: successList('#/components/schemas/Driver', 'Driver list'),
                    401: errorResponse('Not authenticated'),
                },
            },
            post: {
                tags: ['Drivers'],
                summary: 'Register a driver',
                description: 'Adds a new driver to the system. Requires `MANAGER`, `SAFETY_OFFICER`, or ``.',
                operationId: 'driversCreate',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateDriverRequest' } } } },
                responses: {
                    201: successSingle('#/components/schemas/Driver', 'Driver registered'),
                    403: errorResponse('Insufficient role'),
                    409: errorResponse('License number or email already exists'),
                    422: errorResponse('Validation error'),
                },
            },
        },
        '/api/v1/drivers/expiring': {
            get: {
                tags: ['Drivers'],
                summary: 'Get drivers with expiring licenses',
                description: 'Returns drivers whose license expires within the next 30 days. Used for compliance dashboard alerts. Restricted to `SAFETY_OFFICER`, `MANAGER`, ``.',
                operationId: 'driversExpiring',
                security: bearerSecurity,
                parameters: [
                    { name: 'days', in: 'query', schema: { type: 'integer', default: 30 }, description: 'Look-ahead window in days' },
                ],
                responses: {
                    200: successList('#/components/schemas/Driver', 'Drivers with expiring licenses'),
                    403: errorResponse('Insufficient role'),
                },
            },
        },
        '/api/v1/drivers/{id}': {
            get: {
                tags: ['Drivers'],
                summary: 'Get driver by ID',
                operationId: 'driversGetById',
                security: bearerSecurity,
                parameters: [idParam('id')],
                responses: {
                    200: successSingle('#/components/schemas/Driver', 'Driver detail'),
                    404: errorResponse('Driver not found'),
                },
            },
            patch: {
                tags: ['Drivers'],
                summary: 'Update driver details',
                description: 'Partially updates driver contact info and license details. Requires `SAFETY_OFFICER`, `MANAGER`, or ``.',
                operationId: 'driversUpdate',
                security: bearerSecurity,
                parameters: [idParam('id')],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateDriverRequest' } } } },
                responses: {
                    200: successSingle('#/components/schemas/Driver', 'Driver updated'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Driver not found'),
                    422: errorResponse('Validation error'),
                },
            },
            delete: {
                tags: ['Drivers'],
                summary: 'Soft-delete a driver',
                description: 'Marks the driver as deleted. Historical trips preserved. ** only.**',
                operationId: 'driversDelete',
                security: bearerSecurity,
                parameters: [idParam('id')],
                responses: {
                    200: { description: 'Driver soft-deleted' },
                    403: errorResponse(' role required'),
                    404: errorResponse('Driver not found'),
                    409: errorResponse('Cannot delete driver with active trips'),
                },
            },
        },
        '/api/v1/drivers/{id}/status': {
            patch: {
                tags: ['Drivers'],
                summary: 'Update driver duty status',
                description: 'Transitions driver status (OFF_DUTY ↔ ON_DUTY, any → SUSPENDED). SUSPENDED blocks all future dispatch assignments.',
                operationId: 'driversUpdateStatus',
                security: bearerSecurity,
                parameters: [idParam('id')],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateDriverStatusRequest' } } } },
                responses: {
                    200: successSingle('#/components/schemas/Driver', 'Status updated'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Driver not found'),
                    409: errorResponse('Driver is currently ON_TRIP — cannot change status'),
                },
            },
        },
        '/api/v1/drivers/{id}/safety-score': {
            patch: {
                tags: ['Drivers'],
                summary: 'Recalculate driver safety score',
                description: 'Triggers server-side recalculation of the driver\'s safety score from trip completion rate, incidents, and per-trip ratings. **MANAGER or SAFETY_OFFICER only.**',
                operationId: 'driversRecalculateSafetyScore',
                security: bearerSecurity,
                parameters: [idParam('id')],
                responses: {
                    200: successSingle('#/components/schemas/Driver', 'Safety score updated'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Driver not found'),
                    422: errorResponse('Validation error'),
                },
            },
        },

        // ─────────────────────────────────────────────────────────────
        //  Finance
        // ─────────────────────────────────────────────────────────────
        '/api/v1/finance/fuel': {
            post: {
                tags: ['Finance'],
                summary: 'Log a fuel fill event',
                description: 'Records a fuel fill for a vehicle, optionally linked to the active trip. `odometer_at_fill` must be >= vehicle\'s current odometer (anti-fraud guard).',
                operationId: 'financeCreateFuelLog',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateFuelLogRequest' } } } },
                responses: {
                    201: successSingle('#/components/schemas/FuelLog', 'Fuel log recorded'),
                    403: errorResponse('Insufficient role'),
                    409: errorResponse('Odometer regression detected — fill odometer < current vehicle odometer'),
                    422: errorResponse('Validation error'),
                },
            },
            get: {
                tags: ['Finance'],
                summary: 'List fuel logs',
                description: 'Returns fuel logs filtered by `vehicleId` or `tripId`.',
                operationId: 'financeListFuelLogs',
                security: bearerSecurity,
                parameters: [
                    { name: 'vehicleId', in: 'query', schema: { type: 'string' } },
                    { name: 'tripId', in: 'query', schema: { type: 'string' } },
                ],
                responses: {
                    200: successList('#/components/schemas/FuelLog', 'Fuel log list'),
                    403: errorResponse('Insufficient role'),
                },
            },
        },
        '/api/v1/finance/expenses': {
            post: {
                tags: ['Finance'],
                summary: 'Log an operational expense',
                description: 'Records an expense (TOLL, LODGING, MAINTENANCE_EN_ROUTE, MISC) linked to a vehicle and optionally a trip.',
                operationId: 'financeCreateExpense',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateExpenseRequest' } } } },
                responses: {
                    201: successSingle('#/components/schemas/Expense', 'Expense recorded'),
                    403: errorResponse('Insufficient role'),
                    422: errorResponse('Validation error'),
                },
            },
            get: {
                tags: ['Finance'],
                summary: 'List expenses',
                description: 'Returns expenses filtered by `vehicleId`, `tripId`, or `category`.',
                operationId: 'financeListExpenses',
                security: bearerSecurity,
                parameters: [
                    { name: 'vehicleId', in: 'query', schema: { type: 'string' } },
                    { name: 'tripId', in: 'query', schema: { type: 'string' } },
                    { name: 'category', in: 'query', schema: { type: 'string', enum: ['TOLL', 'LODGING', 'MAINTENANCE_EN_ROUTE', 'MISC'] } },
                ],
                responses: {
                    200: successList('#/components/schemas/Expense', 'Expense list'),
                    403: errorResponse('Insufficient role'),
                },
            },
        },
        '/api/v1/finance/maintenance': {
            post: {
                tags: ['Finance'],
                summary: 'Log a maintenance event',
                description: 'Creates a maintenance log and transitions the vehicle to `IN_SHOP` status automatically. Requires `SAFETY_OFFICER`, `MANAGER`, or ``.',
                operationId: 'financeCreateMaintenance',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMaintenanceLogRequest' } } } },
                responses: {
                    201: successSingle('#/components/schemas/MaintenanceLog', 'Maintenance log created, vehicle set to IN_SHOP'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Vehicle not found'),
                    409: errorResponse('Vehicle is currently ON_TRIP — cannot send to shop'),
                    422: errorResponse('Validation error'),
                },
            },
        },
        '/api/v1/finance/maintenance/{id}/close': {
            patch: {
                tags: ['Finance'],
                summary: 'Close a maintenance log',
                description: 'Marks the maintenance as complete and transitions the vehicle from `IN_SHOP` → `AVAILABLE`. Requires `SAFETY_OFFICER`, `MANAGER`, or ``.',
                operationId: 'financeCloseMaintenance',
                security: bearerSecurity,
                parameters: [idParam('id')],
                responses: {
                    200: successSingle('#/components/schemas/MaintenanceLog', 'Maintenance closed, vehicle set to AVAILABLE'),
                    403: errorResponse('Insufficient role'),
                    404: errorResponse('Maintenance log not found'),
                },
            },
        },

        // ─────────────────────────────────────────────────────────────
        //  Locations (GPS Telemetry)
        // ─────────────────────────────────────────────────────────────
        '/api/v1/locations': {
            post: {
                tags: ['Locations'],
                summary: 'Record a GPS ping',
                description: 'Ingests a real-time GPS position for a vehicle. Called by IoT devices or the mobile driver app every N seconds. Also broadcasts to Socket.io clients.',
                operationId: 'locationsRecord',
                security: bearerSecurity,
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordLocationRequest' } } } },
                responses: {
                    201: successSingle('#/components/schemas/VehicleLocation', 'Location recorded'),
                    404: errorResponse('Vehicle not found'),
                    422: errorResponse('Validation error — lat/lon out of range'),
                },
            },
        },
        '/api/v1/locations/latest': {
            get: {
                tags: ['Locations'],
                summary: 'Get latest location for all vehicles',
                description: 'Returns the most recent GPS ping for every vehicle. Powers the live Leaflet fleet map.',
                operationId: 'locationsGetLatestAll',
                security: bearerSecurity,
                responses: {
                    200: successList('#/components/schemas/VehicleLocation', 'Latest locations for all vehicles'),
                    401: errorResponse('Not authenticated'),
                },
            },
        },
        '/api/v1/locations/{vehicleId}/latest': {
            get: {
                tags: ['Locations'],
                summary: 'Get latest location for one vehicle',
                description: 'Returns the single most recent GPS ping for the specified vehicle.',
                operationId: 'locationsGetLatest',
                security: bearerSecurity,
                parameters: [idParam('vehicleId')],
                responses: {
                    200: successSingle('#/components/schemas/VehicleLocation', 'Latest location'),
                    404: errorResponse('Vehicle not found or no location data'),
                },
            },
        },
        '/api/v1/locations/{vehicleId}/history': {
            get: {
                tags: ['Locations'],
                summary: 'Get location history for a vehicle',
                description: 'Returns a time-ordered list of GPS pings for route replay. Use `limit` to cap results (default 50, max 500).',
                operationId: 'locationsGetHistory',
                security: bearerSecurity,
                parameters: [
                    idParam('vehicleId'),
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 500 }, description: 'Number of pings to return' },
                ],
                responses: {
                    200: successList('#/components/schemas/VehicleLocation', 'Location history'),
                    404: errorResponse('Vehicle not found'),
                },
            },
        },

        // ─────────────────────────────────────────────────────────────
        //  Analytics
        // ─────────────────────────────────────────────────────────────
        '/api/v1/analytics/kpi': {
            get: {
                tags: ['Analytics'],
                summary: 'Dashboard KPI summary',
                description: 'Returns fleet-wide key performance indicators: active vehicles, active trips, monthly revenue, fuel cost, expense total, avg safety score, and license expiry alerts.',
                operationId: 'analyticsKPI',
                security: bearerSecurity,
                responses: {
                    200: {
                        description: 'KPI data',
                        content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/KPIData' } } } } },
                    },
                    403: errorResponse('Insufficient role'),
                },
            },
        },
        '/api/v1/analytics/fuel-efficiency': {
            get: {
                tags: ['Analytics'],
                summary: 'Fuel efficiency report',
                description: 'Returns km-per-liter efficiency per vehicle over a date range. Useful for identifying underperforming or overloaded vehicles.',
                operationId: 'analyticsFuelEfficiency',
                security: bearerSecurity,
                parameters: [
                    { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-01-01' },
                    { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-02-21' },
                ],
                responses: {
                    200: { description: 'Fuel efficiency data per vehicle', content: { 'application/json': { schema: { type: 'object' } } } },
                    403: errorResponse('Insufficient role'),
                },
            },
        },
        '/api/v1/analytics/roi': {
            get: {
                tags: ['Analytics'],
                summary: 'Vehicle ROI report',
                description: 'Computes revenue vs. total cost (fuel + expenses + maintenance) per vehicle over the selected period, returning a profit/loss per vehicle.',
                operationId: 'analyticsROI',
                security: bearerSecurity,
                parameters: [
                    { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-01-01' },
                    { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-02-21' },
                ],
                responses: {
                    200: { description: 'ROI per vehicle', content: { 'application/json': { schema: { type: 'object' } } } },
                    403: errorResponse('Insufficient role'),
                },
            },
        },
        '/api/v1/analytics/monthly': {
            get: {
                tags: ['Analytics'],
                summary: 'Monthly trip and revenue report',
                description: 'Returns month-by-month breakdown of trips completed, revenue earned, fuel cost, and expenses for a given year.',
                operationId: 'analyticsMonthly',
                security: bearerSecurity,
                parameters: [
                    { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 }, description: 'Calendar year for the report' },
                ],
                responses: {
                    200: { description: 'Monthly aggregated data', content: { 'application/json': { schema: { type: 'object' } } } },
                    403: errorResponse('Insufficient role'),
                },
            },
        },
        '/api/v1/analytics/export/csv': {
            get: {
                tags: ['Analytics'],
                summary: 'Export trip data as CSV',
                description: 'Streams a CSV file of all trips with associated financial totals over the date range. Suitable for Excel import.',
                operationId: 'analyticsExportCSV',
                security: bearerSecurity,
                parameters: [
                    { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-01-01' },
                    { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-02-21' },
                ],
                responses: {
                    200: {
                        description: 'CSV file download',
                        content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
                    },
                    403: errorResponse('Insufficient role'),
                },
            },
        },
    },
};
