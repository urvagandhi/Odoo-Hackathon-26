/**
 * FleetFlow — Comprehensive Prisma Database Seed
 * ─────────────────────────────────────────────────────────────────
 * Seeds complete end-to-end data for the FleetFlow system:
 *  1. Vehicle types (TRUCK, VAN, BIKE, PLANE)
 *  2. Users — Indian names, one per role
 *  3. Vehicles — Indian fleet brands + registration plates
 *  4. Drivers — Indian names, varied compliance & duty states
 *  5. Trips — COMPLETED, DISPATCHED, DRAFT, CANCELLED (8 total)
 *  6. Fuel logs — fill events per vehicle / trip
 *  7. Maintenance logs — service history
 *  8. Expenses — tolls, lodging, misc per trip
 *  9. Vehicle locations — GPS telemetry for Leaflet map
 *
 * Seed is fully idempotent — re-running clears and recreates all data.
 *
 * Run:         npm run prisma:seed
 * Reset+Seed:  npm run prisma:reset && npm run prisma:seed
 */

import {
    PrismaClient,
    UserRole,
    VehicleStatus,
    DriverStatus,
    VehicleType,
    TripStatus,
    ExpenseCategory,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// ── Date helpers ────────────────────────────────────────────────────
const daysAgo = (n: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
};

const daysFromNow = (n: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};

const hoursAgo = (n: number): Date => {
    const d = new Date();
    d.setHours(d.getHours() - n);
    return d;
};

// ── Main ────────────────────────────────────────────────────────────
async function main() {
    console.log('🌱  Starting FleetFlow seed...\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 0: Clear all existing data (reverse dependency order)
    // ──────────────────────────────────────────────────────────────
    console.log('  🗑️   Clearing existing seed data...');
    await prisma.auditLog.deleteMany({});
    await prisma.vehicleLocation.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.fuelLog.deleteMany({});
    await prisma.maintenanceLog.deleteMany({});
    await prisma.trip.deleteMany({});
    await prisma.vehicle.deleteMany({});
    await prisma.driver.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.vehicleTypeRecord.deleteMany({});
    console.log('  ✅  Cleared.\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 1: Vehicle Types
    // ──────────────────────────────────────────────────────────────
    console.log('  → Seeding vehicle types...');
    const [truckType, vanType, bikeType, planeType] = await Promise.all([
        prisma.vehicleTypeRecord.create({
            data: {
                name: VehicleType.TRUCK,
                description:
                    'Heavy-duty long-haul trucks for bulk freight and interstate cargo logistics.',
            },
        }),
        prisma.vehicleTypeRecord.create({
            data: {
                name: VehicleType.VAN,
                description:
                    'Mid-size vans for city, regional, and last-mile deliveries.',
            },
        }),
        prisma.vehicleTypeRecord.create({
            data: {
                name: VehicleType.BIKE,
                description:
                    'Cargo bikes and motorcycles for ultra-fast urban micro-deliveries.',
            },
        }),
        prisma.vehicleTypeRecord.create({
            data: {
                name: VehicleType.PLANE,
                description:
                    'Air freight aircraft for international and priority time-critical cargo.',
            },
        }),
    ]);
    console.log('  ✅  4 vehicle types seeded.\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 2: Users — one per role, Indian names
    // ──────────────────────────────────────────────────────────────
    console.log('  → Seeding users...');
    const passwordHash = await bcrypt.hash('FleetFlow@2025', SALT_ROUNDS);

    const [, , dispatcher, , financeAnalyst] = await Promise.all([
        // SUPER_ADMIN
        prisma.user.create({
            data: {
                email: 'superadmin@fleetflow.io',
                passwordHash,
                fullName: 'Arjun Mehta',
                role: UserRole.SUPER_ADMIN,
                isActive: true,
            },
        }),
        // MANAGER
        prisma.user.create({
            data: {
                email: 'manager@fleetflow.io',
                passwordHash,
                fullName: 'Priya Sharma',
                role: UserRole.MANAGER,
                isActive: true,
            },
        }),
        // DISPATCHER
        prisma.user.create({
            data: {
                email: 'dispatcher@fleetflow.io',
                passwordHash,
                fullName: 'Rahul Verma',
                role: UserRole.DISPATCHER,
                isActive: true,
            },
        }),
        // SAFETY_OFFICER
        prisma.user.create({
            data: {
                email: 'safety@fleetflow.io',
                passwordHash,
                fullName: 'Sneha Patel',
                role: UserRole.SAFETY_OFFICER,
                isActive: true,
            },
        }),
        // FINANCE_ANALYST
        prisma.user.create({
            data: {
                email: 'finance@fleetflow.io',
                passwordHash,
                fullName: 'Vikram Nair',
                role: UserRole.FINANCE_ANALYST,
                isActive: true,
            },
        }),
    ]);
    console.log('  ✅  5 users seeded.\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 3: Vehicles — Indian brands, real registration plate format
    //
    //  Statuses at seed time:
    //   truck1  → AVAILABLE  (completed Trip 1, ready for Trip 4 draft)
    //   truck2  → ON_TRIP    (currently running Trip 3: Mumbai→Hyderabad)
    //   van1    → AVAILABLE  (completed Trip 2, drafts 4 & 7 planned)
    //   van2    → IN_SHOP    (brake inspection in progress)
    //   bike1   → AVAILABLE  (completed Trip 8)
    //   plane1  → AVAILABLE  (completed Trip 6)
    // ──────────────────────────────────────────────────────────────
    console.log('  → Seeding vehicles...');
    const [truck1, truck2, van1, van2, bike1, plane1] = await Promise.all([
        // TRUCK 1 — Tata Prima, AVAILABLE, Mumbai depot
        prisma.vehicle.create({
            data: {
                licensePlate: 'MH-04-AB-1234',
                make: 'Tata',
                model: 'Prima 4928.S',
                year: 2022,
                color: 'Midnight Blue',
                vin: 'MAT450634N2CA0001',
                vehicleTypeId: truckType.id,
                status: VehicleStatus.AVAILABLE,
                currentOdometer: 45_386,  // After Mumbai→Pune run (156 km from 45,230)
                capacityWeight: 20_000,   // 20 tonnes
                capacityVolume: 85,       // 85 m³
            },
        }),
        // TRUCK 2 — Tata Prima (larger), ON_TRIP Mumbai→Hyderabad
        prisma.vehicle.create({
            data: {
                licensePlate: 'MH-04-CD-5678',
                make: 'Tata',
                model: 'Prima 5530.S',
                year: 2023,
                color: 'Flame Red',
                vin: 'MAT450634N3CA0002',
                vehicleTypeId: truckType.id,
                status: VehicleStatus.ON_TRIP,
                currentOdometer: 38_500,  // Odometer at last dispatch
                capacityWeight: 25_000,   // 25 tonnes
                capacityVolume: 92,
            },
        }),
        // VAN 1 — Mahindra Supro, AVAILABLE, Delhi/Bangalore depot
        prisma.vehicle.create({
            data: {
                licensePlate: 'DL-01-EF-9012',
                make: 'Mahindra',
                model: 'Supro Profit Truck Excel',
                year: 2023,
                color: 'Polar White',
                vehicleTypeId: vanType.id,
                status: VehicleStatus.AVAILABLE,
                currentOdometer: 12_700,  // After Delhi→Agra run (200 km from 12,500)
                capacityWeight: 1_200,
                capacityVolume: 11,
            },
        }),
        // VAN 2 — Force Traveller, IN_SHOP (brake inspection)
        prisma.vehicle.create({
            data: {
                licensePlate: 'KA-03-GH-3456',
                make: 'Force',
                model: 'Traveller Pro',
                year: 2021,
                color: 'Silver Grey',
                vehicleTypeId: vanType.id,
                status: VehicleStatus.IN_SHOP,
                currentOdometer: 58_900,
                capacityWeight: 1_500,
                capacityVolume: 14,
            },
        }),
        // BIKE 1 — Hero Splendor Cargo, AVAILABLE, Mumbai
        prisma.vehicle.create({
            data: {
                licensePlate: 'MH-02-IJ-7890',
                make: 'Hero',
                model: 'Splendor+ Cargo',
                year: 2024,
                color: 'Matte Black',
                vehicleTypeId: bikeType.id,
                status: VehicleStatus.AVAILABLE,
                currentOdometer: 3_225,  // After Mumbai local delivery (25 km)
                capacityWeight: 50,
                capacityVolume: 0.2,
            },
        }),
        // PLANE 1 — Cessna Caravan, AVAILABLE, Delhi
        prisma.vehicle.create({
            data: {
                licensePlate: 'VT-FLW-208',  // Indian civil aircraft registration
                make: 'Cessna',
                model: 'Caravan 208B',
                year: 2020,
                color: 'White & Royal Blue',
                vin: 'CE208B2020IND001',
                vehicleTypeId: planeType.id,
                status: VehicleStatus.AVAILABLE,
                currentOdometer: 9_580,  // Nautical miles after Mumbai→Delhi air run
                capacityWeight: 1_200,
                capacityVolume: 4.8,
            },
        }),
    ]);
    console.log('  ✅  6 vehicles seeded.\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 4: Drivers — Indian names, varied states
    //
    //  ramesh  → ON_DUTY   (reliable, safety score 98)
    //  suresh  → ON_TRIP   (currently driving Trip 3)
    //  anjali  → ON_DUTY   (top performer, perfect score)
    //  mohan   → OFF_DUTY  (license expiring in 20 days — alert)
    //  deepak  → SUSPENDED (multiple safety violations, score 45)
    // ──────────────────────────────────────────────────────────────
    console.log('  → Seeding drivers...');
    const [ramesh, suresh, anjali, mohan] = await Promise.all([
        prisma.driver.create({
            data: {
                licenseNumber: 'MH-CDL-A-001234',
                fullName: 'Ramesh Kumar',
                phone: '+91-98201-11001',
                email: 'ramesh.kumar@fleetflow.io',
                dateOfBirth: new Date('1985-03-15'),
                licenseExpiryDate: daysFromNow(730),  // 2 years — healthy
                licenseClass: 'CDL-A',
                status: DriverStatus.ON_DUTY,
                safetyScore: 98,
            },
        }),
        prisma.driver.create({
            data: {
                licenseNumber: 'MH-CDL-B-005678',
                fullName: 'Suresh Yadav',
                phone: '+91-98202-22002',
                email: 'suresh.yadav@fleetflow.io',
                dateOfBirth: new Date('1988-07-20'),
                licenseExpiryDate: daysFromNow(365),  // 1 year — valid
                licenseClass: 'CDL-B',
                status: DriverStatus.ON_TRIP,          // Currently on Mumbai→Hyderabad
                safetyScore: 85,
            },
        }),
        prisma.driver.create({
            data: {
                licenseNumber: 'DL-CDL-A-009012',
                fullName: 'Anjali Singh',
                phone: '+91-98203-33003',
                email: 'anjali.singh@fleetflow.io',
                dateOfBirth: new Date('1992-11-05'),
                licenseExpiryDate: daysFromNow(548),  // 1.5 years — healthy
                licenseClass: 'CDL-A',
                status: DriverStatus.ON_DUTY,
                safetyScore: 100,                      // Perfect record
            },
        }),
        prisma.driver.create({
            data: {
                licenseNumber: 'KA-B-003456',
                fullName: 'Mohan Das',
                phone: '+91-98204-44004',
                email: 'mohan.das@fleetflow.io',
                dateOfBirth: new Date('1979-06-12'),
                licenseExpiryDate: daysFromNow(20),   // ⚠️ Expiring soon — dashboard alert
                licenseClass: 'B',
                status: DriverStatus.OFF_DUTY,
                safetyScore: 92,
            },
        }),
        prisma.driver.create({
            data: {
                licenseNumber: 'GJ-B-007890',
                fullName: 'Deepak Gupta',
                phone: '+91-98205-55005',
                dateOfBirth: new Date('1983-09-28'),
                licenseExpiryDate: daysFromNow(180),
                licenseClass: 'B',
                status: DriverStatus.SUSPENDED,        // Multiple violations
                safetyScore: 45,                       // ⛔ Below minimum threshold
            },
        }),
    ]);
    console.log('  ✅  5 drivers seeded.\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 5: Trips — 8 trips covering all status transitions
    //  Routes use real Indian city pairs with approximate distances.
    // ──────────────────────────────────────────────────────────────
    console.log('  → Seeding trips...');

    // Trip 1: COMPLETED — Mumbai → Pune (Truck 1, Ramesh)
    const trip1 = await prisma.trip.create({
        data: {
            vehicleId: truck1.id,
            driverId: ramesh.id,
            origin: 'Mumbai, Maharashtra',
            destination: 'Pune, Maharashtra',
            distanceEstimated: 156,
            distanceActual: 162,       // Minor detour via Khopoli
            cargoWeight: 12_500,
            cargoDescription: 'Auto parts — Tata Motors Pune plant supply chain',
            odometerStart: 45_230,
            odometerEnd: 45_386,
            revenue: 28_000,
            clientName: 'Tata Motors Ltd.',
            invoiceReference: 'INV-FF-2025-0001',
            status: TripStatus.COMPLETED,
            dispatchTime: daysAgo(10),
            completionTime: daysAgo(9),
        },
    });

    // Trip 2: COMPLETED — Delhi → Agra (Van 1, Anjali)
    const trip2 = await prisma.trip.create({
        data: {
            vehicleId: van1.id,
            driverId: anjali.id,
            origin: 'Delhi, NCT',
            destination: 'Agra, Uttar Pradesh',
            distanceEstimated: 200,
            distanceActual: 204,
            cargoWeight: 800,
            cargoDescription: 'E-commerce returns — Flipkart warehouse restocking (electronics)',
            odometerStart: 12_500,
            odometerEnd: 12_700,
            revenue: 9_500,
            clientName: 'Flipkart Internet Pvt. Ltd.',
            invoiceReference: 'INV-FF-2025-0002',
            status: TripStatus.COMPLETED,
            dispatchTime: daysAgo(7),
            completionTime: daysAgo(7),
        },
    });

    // Trip 3: DISPATCHED — Mumbai → Hyderabad (Truck 2, Suresh) — currently active
    const trip3 = await prisma.trip.create({
        data: {
            vehicleId: truck2.id,
            driverId: suresh.id,
            origin: 'Mumbai, Maharashtra',
            destination: 'Hyderabad, Telangana',
            distanceEstimated: 710,
            cargoWeight: 18_000,
            cargoDescription: 'FMCG goods — ITC distribution consignment (biscuits, beverages)',
            odometerStart: 38_500,
            revenue: 75_000,
            clientName: 'ITC Limited',
            invoiceReference: 'INV-FF-2025-0003',
            status: TripStatus.DISPATCHED,
            dispatchTime: hoursAgo(6),
        },
    });

    // Trip 4: DRAFT — Bangalore → Chennai (Van 1, Anjali) — planned, not yet dispatched
    await prisma.trip.create({
        data: {
            vehicleId: van1.id,
            driverId: anjali.id,
            origin: 'Bangalore, Karnataka',
            destination: 'Chennai, Tamil Nadu',
            distanceEstimated: 345,
            cargoWeight: 600,
            cargoDescription: 'IT hardware — Dell server racks and networking gear',
            revenue: 22_000,
            clientName: 'Dell Technologies India Pvt. Ltd.',
            status: TripStatus.DRAFT,
        },
    });

    // Trip 5: CANCELLED — Jaipur local (Bike 1, Mohan) — cancelled before dispatch
    await prisma.trip.create({
        data: {
            vehicleId: bike1.id,
            driverId: mohan.id,
            origin: 'Jaipur, Rajasthan',
            destination: 'Jaipur City Centre Mall, Rajasthan',
            distanceEstimated: 18,
            cargoWeight: 25,
            cargoDescription: 'Jewellery display samples — Tanishq retail showcase',
            revenue: 1_500,
            clientName: 'Tanishq (Titan Company Ltd.)',
            status: TripStatus.CANCELLED,
            cancelledReason: 'Client postponed pickup — rescheduled for next week due to store renovation',
        },
    });

    // Trip 6: COMPLETED — Mumbai → Delhi (Plane 1, Anjali) — pharmaceutical air freight
    const trip6 = await prisma.trip.create({
        data: {
            vehicleId: plane1.id,
            driverId: anjali.id,
            origin: 'CSIA Mumbai (BOM)',
            destination: 'IGI Delhi (DEL)',
            distanceEstimated: 1_415,
            distanceActual: 1_410,
            cargoWeight: 900,
            cargoDescription: 'Temperature-controlled pharma cargo — Sun Pharma API shipment',
            odometerStart: 8_900,
            odometerEnd: 9_580,
            revenue: 185_000,
            clientName: 'Sun Pharmaceutical Industries Ltd.',
            invoiceReference: 'INV-FF-2025-0004',
            status: TripStatus.COMPLETED,
            dispatchTime: daysAgo(5),
            completionTime: daysAgo(5),
        },
    });

    // Trip 7: DRAFT — Pune → Nashik (Van 1, Anjali) — planned
    await prisma.trip.create({
        data: {
            vehicleId: van1.id,
            driverId: anjali.id,
            origin: 'Pune, Maharashtra',
            destination: 'Nashik, Maharashtra',
            distanceEstimated: 215,
            cargoWeight: 400,
            cargoDescription: 'Premium wine cases — Sula Vineyards B2B distributor order',
            revenue: 12_000,
            clientName: 'Sula Vineyards Pvt. Ltd.',
            status: TripStatus.DRAFT,
        },
    });

    // Trip 8: COMPLETED — Mumbai local (Bike 1, Mohan) — express document courier
    const trip8 = await prisma.trip.create({
        data: {
            vehicleId: bike1.id,
            driverId: mohan.id,
            origin: 'Andheri West, Mumbai',
            destination: 'Bandra Kurla Complex, Mumbai',
            distanceEstimated: 22,
            distanceActual: 25,
            cargoWeight: 18,
            cargoDescription: 'Legal documents — court-filed affidavits and contracts (urgent)',
            odometerStart: 3_200,
            odometerEnd: 3_225,
            revenue: 2_800,
            clientName: 'AZB & Partners (Law Firm)',
            invoiceReference: 'INV-FF-2025-0005',
            status: TripStatus.COMPLETED,
            dispatchTime: daysAgo(3),
            completionTime: daysAgo(3),
        },
    });

    console.log('  ✅  8 trips seeded.\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 6: Fuel Logs
    // ──────────────────────────────────────────────────────────────
    console.log('  → Seeding fuel logs...');
    await Promise.all([
        // Truck 1 — mid-run fill during Mumbai→Pune trip
        prisma.fuelLog.create({
            data: {
                vehicleId: truck1.id,
                tripId: trip1.id,
                liters: 80,
                costPerLiter: 94.52,
                totalCost: 7_561.6,
                odometerAtFill: 45_260,
                fuelStation: 'HP Petrol Pump, Khopoli, NH-48',
                loggedAt: daysAgo(10),
            },
        }),
        // Truck 1 — depot refill after completing Mumbai→Pune
        prisma.fuelLog.create({
            data: {
                vehicleId: truck1.id,
                liters: 60,
                costPerLiter: 94.52,
                totalCost: 5_671.2,
                odometerAtFill: 45_386,
                fuelStation: 'BPCL, Navi Mumbai Depot',
                loggedAt: daysAgo(2),
            },
        }),
        // Truck 2 — full tank before Mumbai→Hyderabad long-haul dispatch
        prisma.fuelLog.create({
            data: {
                vehicleId: truck2.id,
                tripId: trip3.id,
                liters: 120,
                costPerLiter: 94.52,
                totalCost: 11_342.4,
                odometerAtFill: 38_510,
                fuelStation: 'Indian Oil, Pune Bypass, NH-65',
                loggedAt: hoursAgo(7),
            },
        }),
        // Van 1 — fill during Delhi→Agra run
        prisma.fuelLog.create({
            data: {
                vehicleId: van1.id,
                tripId: trip2.id,
                liters: 30,
                costPerLiter: 96.72,
                totalCost: 2_901.6,
                odometerAtFill: 12_520,
                fuelStation: 'Bharat Petroleum, Mathura Road, NH-19',
                loggedAt: daysAgo(7),
            },
        }),
        // Bike 1 — fill before Mumbai local delivery
        prisma.fuelLog.create({
            data: {
                vehicleId: bike1.id,
                tripId: trip8.id,
                liters: 5,
                costPerLiter: 105.41,
                totalCost: 527.05,
                odometerAtFill: 3_202,
                fuelStation: 'Shell, Andheri East, Mumbai',
                loggedAt: daysAgo(3),
            },
        }),
        // Trip 6 (plane) — aviation fuel at CSIA Mumbai
        prisma.fuelLog.create({
            data: {
                vehicleId: plane1.id,
                tripId: trip6.id,
                liters: 450,
                costPerLiter: 88.20,
                totalCost: 39_690,
                odometerAtFill: 8_905,
                fuelStation: 'CSIA Cargo Terminal Fuelling Station, Mumbai',
                loggedAt: daysAgo(5),
            },
        }),
    ]);
    console.log('  ✅  6 fuel logs seeded.\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 7: Maintenance Logs
    // ──────────────────────────────────────────────────────────────
    console.log('  → Seeding maintenance logs...');
    await Promise.all([
        // Van 2 — currently IN_SHOP for brake inspection
        prisma.maintenanceLog.create({
            data: {
                vehicleId: van2.id,
                serviceType: 'BRAKE_INSPECTION',
                description:
                    'Full brake system inspection and brake pad replacement on all four wheels. ABS sensor diagnostic and calibration. Expected 2 days downtime.',
                cost: 12_500,
                odometerAtService: 58_900,
                technicianName: 'Rajesh Mistry',
                shopName: 'Force Motors Authorized Service Centre, Whitefield, Bangalore',
                serviceDate: daysAgo(1),
                nextServiceDue: daysFromNow(180),
            },
        }),
        // Truck 1 — historical oil change (completed, vehicle AVAILABLE)
        prisma.maintenanceLog.create({
            data: {
                vehicleId: truck1.id,
                serviceType: 'OIL_CHANGE',
                description:
                    'Engine oil change (15W-40 mineral oil, 20 litres) and oil filter replacement. Air filter cleaned.',
                cost: 4_200,
                odometerAtService: 44_500,
                technicianName: 'Krishnamurthy Auto Works',
                shopName: 'Tata Motors Authorized Workshop, Navi Mumbai',
                serviceDate: daysAgo(30),
                nextServiceDue: daysFromNow(150),
            },
        }),
        // Truck 2 — tyre rotation (historical, pre-current trip)
        prisma.maintenanceLog.create({
            data: {
                vehicleId: truck2.id,
                serviceType: 'TYRE_ROTATION',
                description:
                    'Full tyre rotation and balancing (10 tyres). Front tyre tread depth check — all above minimum 3mm. Tyre pressure normalised to 120 PSI.',
                cost: 3_500,
                odometerAtService: 37_800,
                technicianName: 'Sunil Tyre Works',
                shopName: 'MRF Tyre Service, Thane',
                serviceDate: daysAgo(20),
                nextServiceDue: daysFromNow(90),
            },
        }),
    ]);
    console.log('  ✅  3 maintenance logs seeded.\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 8: Expenses — tolls, lodging, misc
    // ──────────────────────────────────────────────────────────────
    console.log('  → Seeding expenses...');
    await Promise.all([
        // Trip 1 — Mumbai-Pune Expressway toll (heavy vehicle)
        prisma.expense.create({
            data: {
                vehicleId: truck1.id,
                tripId: trip1.id,
                amount: 780,
                category: ExpenseCategory.TOLL,
                description: 'Mumbai-Pune Expressway toll — heavy commercial vehicle rate (entry + return)',
                loggedByUserId: dispatcher.id,
                dateLogged: daysAgo(9),
            },
        }),
        // Trip 2 — Yamuna Expressway toll
        prisma.expense.create({
            data: {
                vehicleId: van1.id,
                tripId: trip2.id,
                amount: 325,
                category: ExpenseCategory.TOLL,
                description: 'Yamuna Expressway toll (Delhi → Agra), LMV rate',
                loggedByUserId: dispatcher.id,
                dateLogged: daysAgo(7),
            },
        }),
        // Trip 3 — Driver lodging en route (Solapur overnight)
        prisma.expense.create({
            data: {
                vehicleId: truck2.id,
                tripId: trip3.id,
                amount: 1_800,
                category: ExpenseCategory.LODGING,
                description: 'Driver accommodation — Hotel Sai Inn, Solapur (overnight halt en route Hyderabad)',
                loggedByUserId: dispatcher.id,
                dateLogged: hoursAgo(2),
            },
        }),
        // Trip 3 — NH-65 toll charges
        prisma.expense.create({
            data: {
                vehicleId: truck2.id,
                tripId: trip3.id,
                amount: 1_240,
                category: ExpenseCategory.TOLL,
                description: 'NH-65 toll plazas — Pune Bypass, Solapur, Bidar (heavy commercial)',
                loggedByUserId: dispatcher.id,
                dateLogged: hoursAgo(1),
            },
        }),
        // Trip 6 — Airport cargo handling fee
        prisma.expense.create({
            data: {
                vehicleId: plane1.id,
                tripId: trip6.id,
                amount: 8_500,
                category: ExpenseCategory.MISC,
                description: 'CSIA cargo terminal handling fee + cold-chain temperature-controlled storage surcharge (Sun Pharma)',
                loggedByUserId: financeAnalyst.id,
                dateLogged: daysAgo(5),
            },
        }),
        // Truck 1 — breakdown repair en route (minor, historical)
        prisma.expense.create({
            data: {
                vehicleId: truck1.id,
                amount: 2_200,
                category: ExpenseCategory.MAINTENANCE_EN_ROUTE,
                description: 'Emergency roadside repair — burst coolant hose, NH-48, Khopoli. Mobile mechanic call-out.',
                loggedByUserId: dispatcher.id,
                dateLogged: daysAgo(15),
            },
        }),
    ]);
    console.log('  ✅  6 expenses seeded.\n');

    // ──────────────────────────────────────────────────────────────
    //  Step 9: Vehicle Locations — GPS telemetry for Leaflet map
    //  Uses real Indian city coordinates.
    // ──────────────────────────────────────────────────────────────
    console.log('  → Seeding vehicle locations...');
    await Promise.all([
        // Truck 1 — AVAILABLE, parked at Mumbai depot, Navi Mumbai
        prisma.vehicleLocation.create({
            data: {
                vehicleId: truck1.id,
                latitude: 19.0330,
                longitude: 73.0297,
                speed: 0,
                heading: 90,
                accuracy: 5,
                recordedAt: hoursAgo(1),
            },
        }),
        // Truck 2 — ON_TRIP, mid-route near Solapur (Mumbai→Hyderabad NH-65)
        prisma.vehicleLocation.create({
            data: {
                vehicleId: truck2.id,
                latitude: 17.6869,
                longitude: 75.9064,
                speed: 68.5,
                heading: 145,  // South-East toward Hyderabad
                accuracy: 8,
                recordedAt: new Date(),
            },
        }),
        // Van 1 — AVAILABLE, at Bangalore depot
        prisma.vehicleLocation.create({
            data: {
                vehicleId: van1.id,
                latitude: 12.9716,
                longitude: 77.5946,
                speed: 0,
                heading: 0,
                accuracy: 5,
                recordedAt: hoursAgo(2),
            },
        }),
        // Van 2 — IN_SHOP, at Force Motors service centre, Whitefield Bangalore
        prisma.vehicleLocation.create({
            data: {
                vehicleId: van2.id,
                latitude: 12.9698,
                longitude: 77.7499,
                speed: 0,
                heading: 0,
                accuracy: 10,
                recordedAt: hoursAgo(24),
            },
        }),
        // Bike 1 — AVAILABLE, Mumbai BKC (last delivery drop point)
        prisma.vehicleLocation.create({
            data: {
                vehicleId: bike1.id,
                latitude: 19.0663,
                longitude: 72.8686,
                speed: 0,
                heading: 270,
                accuracy: 10,
                recordedAt: daysAgo(3),
            },
        }),
        // Plane 1 — AVAILABLE, parked at IGI Delhi cargo apron
        prisma.vehicleLocation.create({
            data: {
                vehicleId: plane1.id,
                latitude: 28.5562,
                longitude: 77.1000,
                speed: 0,
                heading: 180,
                accuracy: 15,
                recordedAt: daysAgo(5),
            },
        }),
    ]);
    console.log('  ✅  6 vehicle locations seeded.\n');

    // ──────────────────────────────────────────────────────────────
    //  Summary
    // ──────────────────────────────────────────────────────────────
    console.log('🎉  FleetFlow seed completed successfully!\n');

    console.log('📋  Login credentials (all roles — same password):');
    console.log('    Password: FleetFlow@2025\n');
    console.log('    ┌──────────────────────────────────────┬─────────────────────┬──────────────────┐');
    console.log('    │ Email                                │ Name                │ Role             │');
    console.log('    ├──────────────────────────────────────┼─────────────────────┼──────────────────┤');
    console.log('    │ superadmin@fleetflow.io              │ Arjun Mehta         │ SUPER_ADMIN      │');
    console.log('    │ manager@fleetflow.io                 │ Priya Sharma        │ MANAGER          │');
    console.log('    │ dispatcher@fleetflow.io              │ Rahul Verma         │ DISPATCHER       │');
    console.log('    │ safety@fleetflow.io                  │ Sneha Patel         │ SAFETY_OFFICER   │');
    console.log('    │ finance@fleetflow.io                 │ Vikram Nair         │ FINANCE_ANALYST  │');
    console.log('    └──────────────────────────────────────┴─────────────────────┴──────────────────┘\n');

    console.log('🚛  Fleet status snapshot:');
    console.log('    Vehicles  →  2 trucks  |  2 vans  |  1 bike  |  1 plane');
    console.log('    Statuses  →  AVAILABLE: truck1, van1, bike1, plane1');
    console.log('               →  ON_TRIP: truck2 (Mumbai→Hyderabad, Suresh Yadav driving)');
    console.log('               →  IN_SHOP: van2 (brake inspection, Whitefield)\n');

    console.log('📊  Drivers:');
    console.log('    Ramesh Kumar   →  ON_DUTY    (safety: 98/100)');
    console.log('    Suresh Yadav   →  ON_TRIP    (safety: 85/100)');
    console.log('    Anjali Singh   →  ON_DUTY    (safety: 100/100 ⭐)');
    console.log('    Mohan Das      →  OFF_DUTY   (safety: 92/100 | ⚠️ License expires in 20 days)');
    console.log('    Deepak Gupta   →  SUSPENDED  (safety: 45/100 ⛔)\n');

    console.log('🗺️   Active trip:');
    console.log('    Trip 3 → Mumbai → Hyderabad | ITC Ltd | ₹75,000 | Tata Prima 5530 | Suresh Yadav\n');
}

main()
    .catch((e) => {
        console.error('❌  Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
