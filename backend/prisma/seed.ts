/**
 * FleetFlow — Comprehensive Prisma Database Seed
 * ─────────────────────────────────────────────────────────────────
 * Seeds 12 months of realistic fleet operations data:
 *   25 vehicles  |  20 drivers  |  ~220 trips  |  ~350 fuel logs
 *   ~120 maintenance logs  |  ~180 expenses  |  ~30 incidents
 *   Vehicle documents, GPS locations, trip waypoints
 *
 * Fully idempotent — re-running clears and recreates all data.
 *
 * Run:         npm run prisma:seed
 * Reset+Seed:  npm run prisma:reset && npm run prisma:seed
 */

import {
    PrismaClient,
    Prisma,
    UserRole,
    VehicleStatus,
    VehicleType,
    DriverStatus,
    TripStatus,
    ExpenseCategory,
    IncidentType,
    IncidentStatus,
    VehicleDocumentType,
    AuditAction,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// ── Deterministic random (seeded PRNG for reproducibility) ─────
let _seed = 42;
function rand(): number {
    _seed = (_seed * 16807 + 0) % 2147483647;
    return (_seed - 1) / 2147483646;
}
function randInt(min: number, max: number): number {
    return Math.floor(rand() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, decimals = 2): number {
    return parseFloat((rand() * (max - min) + min).toFixed(decimals));
}
function pick<T>(arr: T[]): T {
    return arr[randInt(0, arr.length - 1)];
}

// ── Date helpers ───────────────────────────────────────────────
const daysAgo = (n: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(randInt(5, 22), randInt(0, 59), 0, 0);
    return d;
};
const daysFromNow = (n: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};
const cal = (year: number, month: number, day: number, hour = 12): Date =>
    new Date(year, month - 1, day, hour, randInt(0, 59), 0);

// ── Reference data ─────────────────────────────────────────────
const ROUTES: { origin: string; destination: string; distKm: number; tolls: number }[] = [
    { origin: 'Mumbai, Maharashtra', destination: 'Pune, Maharashtra', distKm: 156, tolls: 780 },
    { origin: 'Delhi, NCT', destination: 'Agra, Uttar Pradesh', distKm: 200, tolls: 325 },
    { origin: 'Bangalore, Karnataka', destination: 'Chennai, Tamil Nadu', distKm: 345, tolls: 1200 },
    { origin: 'Mumbai, Maharashtra', destination: 'Hyderabad, Telangana', distKm: 710, tolls: 1240 },
    { origin: 'Delhi, NCT', destination: 'Jaipur, Rajasthan', distKm: 270, tolls: 420 },
    { origin: 'Pune, Maharashtra', destination: 'Nashik, Maharashtra', distKm: 215, tolls: 350 },
    { origin: 'Bangalore, Karnataka', destination: 'Hyderabad, Telangana', distKm: 570, tolls: 980 },
    { origin: 'Delhi, NCT', destination: 'Lucknow, Uttar Pradesh', distKm: 550, tolls: 920 },
    { origin: 'Chennai, Tamil Nadu', destination: 'Bangalore, Karnataka', distKm: 345, tolls: 1200 },
    { origin: 'Mumbai, Maharashtra', destination: 'Ahmedabad, Gujarat', distKm: 530, tolls: 890 },
    { origin: 'Kolkata, West Bengal', destination: 'Patna, Bihar', distKm: 570, tolls: 750 },
    { origin: 'Hyderabad, Telangana', destination: 'Bangalore, Karnataka', distKm: 570, tolls: 980 },
    { origin: 'Jaipur, Rajasthan', destination: 'Udaipur, Rajasthan', distKm: 395, tolls: 520 },
    { origin: 'Mumbai, Maharashtra', destination: 'Nagpur, Maharashtra', distKm: 840, tolls: 1450 },
    { origin: 'Delhi, NCT', destination: 'Chandigarh, Punjab', distKm: 245, tolls: 380 },
    { origin: 'Ahmedabad, Gujarat', destination: 'Mumbai, Maharashtra', distKm: 530, tolls: 890 },
    { origin: 'Pune, Maharashtra', destination: 'Bangalore, Karnataka', distKm: 840, tolls: 1380 },
    { origin: 'Chennai, Tamil Nadu', destination: 'Coimbatore, Tamil Nadu', distKm: 505, tolls: 680 },
    { origin: 'CSIA Mumbai (BOM)', destination: 'IGI Delhi (DEL)', distKm: 1415, tolls: 0 },
    { origin: 'IGI Delhi (DEL)', destination: 'Kempegowda Intl (BLR)', distKm: 1740, tolls: 0 },
    { origin: 'Andheri West, Mumbai', destination: 'Bandra Kurla Complex, Mumbai', distKm: 22, tolls: 0 },
    { origin: 'Koramangala, Bangalore', destination: 'Electronic City, Bangalore', distKm: 18, tolls: 0 },
    { origin: 'Connaught Place, Delhi', destination: 'Gurgaon, Haryana', distKm: 32, tolls: 80 },
    { origin: 'T. Nagar, Chennai', destination: 'Ambattur, Chennai', distKm: 15, tolls: 0 },
];

const CLIENTS = [
    'Tata Motors Ltd.', 'Flipkart Internet Pvt. Ltd.', 'ITC Limited', 'Sun Pharmaceutical Industries Ltd.',
    'Reliance Industries Ltd.', 'Hindustan Unilever Ltd.', 'Infosys Ltd.', 'Wipro Ltd.',
    'Mahindra & Mahindra Ltd.', 'Larsen & Toubro Ltd.', 'Cipla Ltd.', 'Dr. Reddy\'s Laboratories Ltd.',
    'Bajaj Auto Ltd.', 'Asian Paints Ltd.', 'JSW Steel Ltd.', 'Godrej Consumer Products Ltd.',
    'Bosch India Ltd.', 'Samsung India Electronics Pvt. Ltd.', 'Amazon India Pvt. Ltd.',
    'Dell Technologies India Pvt. Ltd.', 'HP India Pvt. Ltd.', 'HDFC Bank Ltd.',
    'Apollo Pharmacy Ltd.', 'Dabur India Ltd.', 'Nestle India Ltd.', 'Britannia Industries Ltd.',
    'Marico Ltd.', 'Titan Company Ltd.', 'Sula Vineyards Pvt. Ltd.', 'Amul (GCMMF)',
];

const CARGO_DESCRIPTIONS = [
    'Auto components and spare parts', 'Consumer electronics — laptops and peripherals',
    'FMCG goods — biscuits, beverages, personal care', 'Pharmaceutical API cold-chain shipment',
    'Textile goods and garments', 'Steel coils and rods', 'Industrial machinery parts',
    'E-commerce parcels — mixed category', 'IT hardware — servers and networking gear',
    'Medical supplies and equipment', 'Packaged food — dairy and frozen',
    'Construction materials — cement and fittings', 'Automotive paint drums and coating chemicals',
    'Legal documents and corporate courier', 'Banking documents — urgent delivery',
    'Agricultural produce — spices and grains', 'Furniture and home decor items',
    'Chemical raw materials — safely packaged', 'Temperature-controlled pharma cargo',
    'Premium wine cases — B2B distributor order',
];

const FUEL_STATIONS = [
    'HP Petrol Pump, Khopoli, NH-48', 'BPCL, Navi Mumbai Depot', 'Indian Oil, Pune Bypass, NH-65',
    'Bharat Petroleum, Mathura Road, NH-19', 'Shell, Andheri East, Mumbai',
    'Indian Oil, Tumkur Road, Bangalore', 'BPCL, Hosur Road, Bangalore',
    'HP Petrol Pump, NH-44, Hyderabad', 'Shell, MG Road, Pune', 'Indian Oil, GT Road, Delhi',
    'BPCL, NH-48, Gurgaon', 'HP, Yamuna Expressway', 'Shell, ECR, Chennai',
    'Indian Oil, Ahmedabad Highway', 'BPCL, Kolkata Bypass', 'HP, Jaipur Ring Road',
    'CSIA Cargo Terminal Fuelling Station, Mumbai', 'IGI Cargo Fuel Station, Delhi',
];

const SERVICE_TYPES = [
    'OIL_CHANGE', 'BRAKE_INSPECTION', 'TYRE_ROTATION', 'ENGINE_TUNING',
    'TRANSMISSION_SERVICE', 'BATTERY_REPLACEMENT', 'AC_SERVICE', 'SUSPENSION_CHECK',
    'GENERAL_INSPECTION', 'COOLANT_FLUSH',
];

const SHOPS = [
    'Tata Motors Authorized Workshop, Navi Mumbai', 'Force Motors ASC, Whitefield, Bangalore',
    'Mahindra Service Centre, Okhla, Delhi', 'MRF Tyre Service, Thane',
    'Bosch Car Service, Koregaon Park, Pune', 'Ashok Leyland ASC, Ambattur, Chennai',
    'Maruti Suzuki Service, Gurgaon', 'Bridgestone Tyre Centre, Connaught Place, Delhi',
    'Toyota Service Centre, Electronic City, Bangalore', 'Apollo Tyres, Andheri, Mumbai',
];

const TECHNICIANS = [
    'Rajesh Mistry', 'Krishnamurthy Auto Works', 'Sunil Tyre Works', 'Mohammed Irfan',
    'Kishore Auto Works', 'Ganesh Motor Works', 'Sanjay Electricals', 'Ravi Mechanics',
    'Prakash Auto Service', 'Vinod Kumar Motors',
];

// ── Main ───────────────────────────────────────────────────────
async function main() {
    console.log('🌱  Starting FleetFlow comprehensive seed...\n');

    // ────────────────────────────────────────────────────────────
    //  Clear all existing data (reverse dependency order)
    // ────────────────────────────────────────────────────────────
    console.log('  🗑️   Clearing existing data...');
    await prisma.auditLog.deleteMany({});
    await prisma.tripWaypoint.deleteMany({});
    await prisma.incidentReport.deleteMany({});
    await prisma.vehicleDocument.deleteMany({});
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

    // ────────────────────────────────────────────────────────────
    //  1. Vehicle Types
    // ────────────────────────────────────────────────────────────
    console.log('  → Vehicle types...');
    const [truckType, vanType, bikeType, carType, planeType] = await Promise.all([
        prisma.vehicleTypeRecord.create({ data: { name: VehicleType.TRUCK, description: 'Heavy-duty trucks for long-haul and interstate freight.' } }),
        prisma.vehicleTypeRecord.create({ data: { name: VehicleType.VAN, description: 'Mid-size vans for city, regional, and last-mile deliveries.' } }),
        prisma.vehicleTypeRecord.create({ data: { name: VehicleType.BIKE, description: 'Cargo bikes for ultra-fast urban micro-deliveries.' } }),
        prisma.vehicleTypeRecord.create({ data: { name: VehicleType.CAR, description: 'Sedans and hatchbacks for passenger transport and light deliveries.' } }),
        prisma.vehicleTypeRecord.create({ data: { name: VehicleType.PLANE, description: 'Air freight aircraft for priority and international cargo.' } }),
    ]);
    const typeMap = { TRUCK: truckType.id, VAN: vanType.id, BIKE: bikeType.id, CAR: carType.id, PLANE: planeType.id };

    // ────────────────────────────────────────────────────────────
    //  2. Users (8 users across all roles)
    // ────────────────────────────────────────────────────────────
    console.log('  → Users...');
    const passwordHash = await bcrypt.hash('FleetFlow@2026', SALT_ROUNDS);
    const usersData = [
        { email: 'manager@fleetflow.io', fullName: 'Priya Sharma', role: UserRole.MANAGER },
        { email: 'manager2@fleetflow.io', fullName: 'Anil Kapoor', role: UserRole.MANAGER },
        { email: 'dispatcher@fleetflow.io', fullName: 'Rahul Verma', role: UserRole.DISPATCHER },
        { email: 'dispatcher2@fleetflow.io', fullName: 'Kavita Menon', role: UserRole.DISPATCHER },
        { email: 'safety@fleetflow.io', fullName: 'Sneha Patel', role: UserRole.SAFETY_OFFICER },
        { email: 'safety2@fleetflow.io', fullName: 'Ajay Thakur', role: UserRole.SAFETY_OFFICER },
        { email: 'finance@fleetflow.io', fullName: 'Vikram Nair', role: UserRole.FINANCE_ANALYST },
        { email: 'finance2@fleetflow.io', fullName: 'Meera Iyer', role: UserRole.FINANCE_ANALYST },
    ];
    const users = await Promise.all(
        usersData.map(u => prisma.user.create({ data: { ...u, passwordHash, isActive: true } }))
    );
    const dispatcherUser = users[2];
    const financeUser = users[6];
    const safetyUser = users[4];

    // ────────────────────────────────────────────────────────────
    //  3. Vehicles (25 total)
    // ────────────────────────────────────────────────────────────
    console.log('  → Vehicles (25)...');
    const vehiclesData: {
        plate: string; make: string; model: string; year: number; color: string;
        vin?: string; type: keyof typeof typeMap; status: VehicleStatus;
        odometer: number; weightCap: number; volCap: number; region: string;
        acqCost: number;
    }[] = [
        // ── TRUCKS (12) ──
        { plate: 'MH-04-AB-1234', make: 'Tata', model: 'Prima 4928.S', year: 2022, color: 'Midnight Blue', vin: 'MAT450634N2CA0001', type: 'TRUCK', status: VehicleStatus.AVAILABLE, odometer: 87_200, weightCap: 20_000, volCap: 85, region: 'WEST', acqCost: 2_800_000 },
        { plate: 'MH-04-CD-5678', make: 'Tata', model: 'Prima 5530.S', year: 2023, color: 'Flame Red', vin: 'MAT450634N3CA0002', type: 'TRUCK', status: VehicleStatus.ON_TRIP, odometer: 62_400, weightCap: 25_000, volCap: 92, region: 'WEST', acqCost: 3_200_000 },
        { plate: 'DL-01-TR-3344', make: 'Ashok Leyland', model: 'Captain 2523', year: 2021, color: 'White', vin: 'ALD250213N1CA0003', type: 'TRUCK', status: VehicleStatus.AVAILABLE, odometer: 112_500, weightCap: 18_000, volCap: 78, region: 'NORTH', acqCost: 2_500_000 },
        { plate: 'KA-01-TR-7788', make: 'BharatBenz', model: '2823R', year: 2022, color: 'Silver Grey', vin: 'BBZ280223N2CA0004', type: 'TRUCK', status: VehicleStatus.ON_TRIP, odometer: 78_300, weightCap: 22_000, volCap: 88, region: 'SOUTH', acqCost: 3_100_000 },
        { plate: 'TN-01-TR-4455', make: 'Eicher', model: 'Pro 6049', year: 2023, color: 'Ocean Blue', vin: 'EIC600493N3CA0005', type: 'TRUCK', status: VehicleStatus.AVAILABLE, odometer: 45_600, weightCap: 15_000, volCap: 72, region: 'SOUTH', acqCost: 2_200_000 },
        { plate: 'GJ-01-TR-9900', make: 'Tata', model: 'Signa 4825.TK', year: 2021, color: 'Racing Green', vin: 'MAT480251N1CA0006', type: 'TRUCK', status: VehicleStatus.IN_SHOP, odometer: 145_200, weightCap: 28_000, volCap: 95, region: 'WEST', acqCost: 3_500_000 },
        { plate: 'RJ-14-TR-1122', make: 'Ashok Leyland', model: 'AVTR 4120', year: 2022, color: 'Charcoal', vin: 'ALD412022N2CA0007', type: 'TRUCK', status: VehicleStatus.AVAILABLE, odometer: 92_100, weightCap: 20_000, volCap: 82, region: 'NORTH', acqCost: 2_700_000 },
        { plate: 'WB-02-TR-6677', make: 'BharatBenz', model: '1617R', year: 2020, color: 'Desert Sand', vin: 'BBZ161720N0CA0008', type: 'TRUCK', status: VehicleStatus.AVAILABLE, odometer: 168_400, weightCap: 16_000, volCap: 70, region: 'EAST', acqCost: 2_100_000 },
        { plate: 'MH-12-TR-8899', make: 'Tata', model: 'LPT 3518', year: 2023, color: 'Pearl White', vin: 'MAT351823N3CA0009', type: 'TRUCK', status: VehicleStatus.ON_TRIP, odometer: 34_700, weightCap: 18_500, volCap: 80, region: 'WEST', acqCost: 2_600_000 },
        { plate: 'AP-07-TR-2233', make: 'Eicher', model: 'Pro 3019', year: 2022, color: 'Forest Green', vin: 'EIC301922N2CA0010', type: 'TRUCK', status: VehicleStatus.AVAILABLE, odometer: 55_800, weightCap: 12_000, volCap: 65, region: 'SOUTH', acqCost: 1_900_000 },
        { plate: 'UP-32-TR-5566', make: 'Ashok Leyland', model: 'Boss 1920', year: 2021, color: 'Royal Blue', vin: 'ALD192021N1CA0011', type: 'TRUCK', status: VehicleStatus.RETIRED, odometer: 248_000, weightCap: 16_000, volCap: 68, region: 'NORTH', acqCost: 1_800_000 },
        { plate: 'MP-09-TR-7744', make: 'Tata', model: 'Ultra T.16', year: 2024, color: 'Cosmic Grey', vin: 'MAT160024N4CA0012', type: 'TRUCK', status: VehicleStatus.AVAILABLE, odometer: 12_300, weightCap: 14_000, volCap: 62, region: 'CENTRAL', acqCost: 2_400_000 },
        // ── VANS (7) ──
        { plate: 'DL-01-VN-9012', make: 'Mahindra', model: 'Supro Profit Truck Excel', year: 2023, color: 'Polar White', type: 'VAN', status: VehicleStatus.AVAILABLE, odometer: 28_500, weightCap: 1_200, volCap: 11, region: 'NORTH', acqCost: 850_000 },
        { plate: 'KA-03-VN-3456', make: 'Force', model: 'Traveller Pro', year: 2021, color: 'Silver Grey', type: 'VAN', status: VehicleStatus.IN_SHOP, odometer: 72_400, weightCap: 1_500, volCap: 14, region: 'SOUTH', acqCost: 1_200_000 },
        { plate: 'MH-01-VN-5522', make: 'Tata', model: 'Ace Gold', year: 2023, color: 'Caribbean Blue', type: 'VAN', status: VehicleStatus.AVAILABLE, odometer: 19_800, weightCap: 1_000, volCap: 8, region: 'WEST', acqCost: 650_000 },
        { plate: 'TN-07-VN-8833', make: 'Mahindra', model: 'Bolero Pickup', year: 2022, color: 'Toreador Red', type: 'VAN', status: VehicleStatus.ON_TRIP, odometer: 48_200, weightCap: 1_200, volCap: 9, region: 'SOUTH', acqCost: 780_000 },
        { plate: 'GJ-06-VN-1144', make: 'Tata', model: 'Intra V30', year: 2024, color: 'Ivory White', type: 'VAN', status: VehicleStatus.AVAILABLE, odometer: 8_900, weightCap: 1_100, volCap: 10, region: 'WEST', acqCost: 720_000 },
        { plate: 'DL-08-VN-6655', make: 'Force', model: 'Trax Cruiser', year: 2020, color: 'Graphite', type: 'VAN', status: VehicleStatus.AVAILABLE, odometer: 95_200, weightCap: 1_800, volCap: 16, region: 'NORTH', acqCost: 1_100_000 },
        { plate: 'WB-01-VN-2277', make: 'Mahindra', model: 'Jeeto Plus', year: 2022, color: 'Alpine White', type: 'VAN', status: VehicleStatus.AVAILABLE, odometer: 35_600, weightCap: 700, volCap: 6, region: 'EAST', acqCost: 520_000 },
        // ── BIKES (4) ──
        { plate: 'MH-02-BK-7890', make: 'Hero', model: 'Splendor+ Cargo', year: 2024, color: 'Matte Black', type: 'BIKE', status: VehicleStatus.AVAILABLE, odometer: 8_400, weightCap: 50, volCap: 0.2, region: 'WEST', acqCost: 85_000 },
        { plate: 'DL-05-BK-4411', make: 'Bajaj', model: 'Maxima C', year: 2023, color: 'Blue', type: 'BIKE', status: VehicleStatus.ON_TRIP, odometer: 14_200, weightCap: 60, volCap: 0.3, region: 'NORTH', acqCost: 95_000 },
        { plate: 'KA-09-BK-5533', make: 'TVS', model: 'King Deluxe', year: 2023, color: 'Green', type: 'BIKE', status: VehicleStatus.AVAILABLE, odometer: 6_800, weightCap: 40, volCap: 0.15, region: 'SOUTH', acqCost: 72_000 },
        { plate: 'TN-04-BK-2244', make: 'Hero', model: 'HF Deluxe Cargo', year: 2024, color: 'Red', type: 'BIKE', status: VehicleStatus.AVAILABLE, odometer: 3_100, weightCap: 45, volCap: 0.18, region: 'SOUTH', acqCost: 78_000 },
        // ── PLANES (2) ──
        { plate: 'VT-FLW-208', make: 'Cessna', model: 'Caravan 208B', year: 2020, color: 'White & Royal Blue', vin: 'CE208B2020IND001', type: 'PLANE', status: VehicleStatus.AVAILABLE, odometer: 18_900, weightCap: 1_200, volCap: 4.8, region: 'INTERNATIONAL', acqCost: 45_000_000 },
        { plate: 'VT-FLW-350', make: 'Beechcraft', model: 'King Air 350i', year: 2019, color: 'Silver & Navy', vin: 'BE350I2019IND002', type: 'PLANE', status: VehicleStatus.AVAILABLE, odometer: 24_500, weightCap: 1_800, volCap: 6.2, region: 'INTERNATIONAL', acqCost: 68_000_000 },
    ];

    const vehicles = await Promise.all(
        vehiclesData.map(v => prisma.vehicle.create({
            data: {
                licensePlate: v.plate, make: v.make, model: v.model, year: v.year,
                color: v.color, vin: v.vin, vehicleTypeId: typeMap[v.type],
                status: v.status, currentOdometer: v.odometer,
                capacityWeight: v.weightCap, capacityVolume: v.volCap,
                region: v.region, acquisitionCost: v.acqCost,
            },
        }))
    );
    console.log(`  ✅  ${vehicles.length} vehicles seeded.\n`);

    // ────────────────────────────────────────────────────────────
    //  4. Drivers (20 total)
    // ────────────────────────────────────────────────────────────
    console.log('  → Drivers (20)...');
    const driversData: {
        license: string; name: string; phone: string; email?: string;
        dob: string; expiryDays: number; licClass: string;
        status: DriverStatus; safety: number;
    }[] = [
        { license: 'MH-CDL-A-001234', name: 'Ramesh Kumar', phone: '+91-98201-11001', email: 'ramesh.kumar@fleetflow.io', dob: '1985-03-15', expiryDays: 730, licClass: 'CDL-A', status: DriverStatus.ON_DUTY, safety: 96 },
        { license: 'MH-CDL-B-005678', name: 'Suresh Yadav', phone: '+91-98202-22002', email: 'suresh.yadav@fleetflow.io', dob: '1988-07-20', expiryDays: 365, licClass: 'CDL-B', status: DriverStatus.ON_TRIP, safety: 84 },
        { license: 'DL-CDL-A-009012', name: 'Anjali Singh', phone: '+91-98203-33003', email: 'anjali.singh@fleetflow.io', dob: '1992-11-05', expiryDays: 548, licClass: 'CDL-A', status: DriverStatus.ON_DUTY, safety: 99 },
        { license: 'KA-B-003456', name: 'Mohan Das', phone: '+91-98204-44004', email: 'mohan.das@fleetflow.io', dob: '1979-06-12', expiryDays: 18, licClass: 'B', status: DriverStatus.OFF_DUTY, safety: 91 },
        { license: 'GJ-B-007890', name: 'Deepak Gupta', phone: '+91-98205-55005', dob: '1983-09-28', expiryDays: 180, licClass: 'B', status: DriverStatus.SUSPENDED, safety: 42 },
        { license: 'TN-CDL-A-012345', name: 'Arjun Reddy', phone: '+91-98206-66006', email: 'arjun.reddy@fleetflow.io', dob: '1990-04-18', expiryDays: 5, licClass: 'CDL-A', status: DriverStatus.ON_DUTY, safety: 88 },
        { license: 'RJ-CDL-A-034567', name: 'Vikash Meena', phone: '+91-98207-77007', email: 'vikash.meena@fleetflow.io', dob: '1987-02-25', expiryDays: 620, licClass: 'CDL-A', status: DriverStatus.ON_TRIP, safety: 93 },
        { license: 'WB-CDL-B-045678', name: 'Biswajit Sen', phone: '+91-98208-88008', email: 'biswajit.sen@fleetflow.io', dob: '1991-08-14', expiryDays: 400, licClass: 'CDL-B', status: DriverStatus.ON_DUTY, safety: 87 },
        { license: 'AP-CDL-A-056789', name: 'Venkat Rao', phone: '+91-98209-99009', email: 'venkat.rao@fleetflow.io', dob: '1986-12-03', expiryDays: 280, licClass: 'CDL-A', status: DriverStatus.ON_DUTY, safety: 95 },
        { license: 'MP-B-067890', name: 'Rajendra Tiwari', phone: '+91-98210-10010', email: 'rajendra.tiwari@fleetflow.io', dob: '1984-05-22', expiryDays: 25, licClass: 'B', status: DriverStatus.ON_DUTY, safety: 79 },
        { license: 'UP-CDL-A-078901', name: 'Arun Pandey', phone: '+91-98211-11011', email: 'arun.pandey@fleetflow.io', dob: '1993-01-10', expiryDays: 510, licClass: 'CDL-A', status: DriverStatus.ON_TRIP, safety: 90 },
        { license: 'KA-CDL-A-089012', name: 'Naveen Gowda', phone: '+91-98212-12012', email: 'naveen.gowda@fleetflow.io', dob: '1989-09-07', expiryDays: 450, licClass: 'CDL-A', status: DriverStatus.ON_DUTY, safety: 94 },
        { license: 'MH-CDL-B-090123', name: 'Sanjay Patil', phone: '+91-98213-13013', email: 'sanjay.patil@fleetflow.io', dob: '1982-03-30', expiryDays: 320, licClass: 'CDL-B', status: DriverStatus.OFF_DUTY, safety: 82 },
        { license: 'DL-B-101234', name: 'Pradeep Chauhan', phone: '+91-98214-14014', email: 'pradeep.chauhan@fleetflow.io', dob: '1995-07-16', expiryDays: 700, licClass: 'B', status: DriverStatus.ON_TRIP, safety: 97 },
        { license: 'TN-CDL-A-112345', name: 'Karthik Rajan', phone: '+91-98215-15015', email: 'karthik.rajan@fleetflow.io', dob: '1988-11-21', expiryDays: 380, licClass: 'CDL-A', status: DriverStatus.ON_DUTY, safety: 91 },
        { license: 'GJ-CDL-A-123456', name: 'Hitesh Prajapati', phone: '+91-98216-16016', email: 'hitesh.prajapati@fleetflow.io', dob: '1990-06-09', expiryDays: 12, licClass: 'CDL-A', status: DriverStatus.ON_DUTY, safety: 86 },
        { license: 'KA-B-134567', name: 'Lakshmi Devi', phone: '+91-98217-17017', email: 'lakshmi.devi@fleetflow.io', dob: '1994-04-01', expiryDays: 550, licClass: 'B', status: DriverStatus.ON_TRIP, safety: 92 },
        { license: 'MH-CDL-A-145678', name: 'Ganesh Bhosle', phone: '+91-98218-18018', email: 'ganesh.bhosle@fleetflow.io', dob: '1981-10-15', expiryDays: 200, licClass: 'CDL-A', status: DriverStatus.ON_DUTY, safety: 76 },
        { license: 'RJ-B-156789', name: 'Mukesh Saini', phone: '+91-98219-19019', dob: '1986-02-28', expiryDays: 90, licClass: 'B', status: DriverStatus.SUSPENDED, safety: 38 },
        { license: 'WB-B-167890', name: 'Tapan Ghosh', phone: '+91-98220-20020', email: 'tapan.ghosh@fleetflow.io', dob: '1992-12-25', expiryDays: 480, licClass: 'B', status: DriverStatus.OFF_DUTY, safety: 85 },
    ];

    const drivers = await Promise.all(
        driversData.map(d => prisma.driver.create({
            data: {
                licenseNumber: d.license, fullName: d.name, phone: d.phone,
                email: d.email, dateOfBirth: new Date(d.dob),
                licenseExpiryDate: daysFromNow(d.expiryDays),
                licenseClass: d.licClass, status: d.status, safetyScore: d.safety,
            },
        }))
    );
    console.log(`  ✅  ${drivers.length} drivers seeded.\n`);

    // ── Indexes for easy reference ──
    // Separate truck-capable drivers from local/van drivers
    const truckDriverIds = [0, 1, 2, 6, 7, 8, 10, 11, 14, 17].map(i => drivers[i].id);
    const vanDriverIds = [3, 9, 12, 15, 19].map(i => drivers[i].id);
    const bikeDriverIds = [13, 16].map(i => drivers[i].id);
    const planeDriverIds = [2, 5].map(i => drivers[i].id); // Anjali + Arjun

    // Truck vehicle IDs (index 0-11), Van (12-18), Bike (19-22), Plane (23-24)
    const truckVehicleIds = vehicles.slice(0, 12).filter(v => v.status !== VehicleStatus.RETIRED).map(v => v.id);
    const vanVehicleIds = vehicles.slice(12, 19).filter(v => v.status !== VehicleStatus.RETIRED).map(v => v.id);
    const bikeVehicleIds = vehicles.slice(19, 23).map(v => v.id);
    const planeVehicleIds = vehicles.slice(23, 25).map(v => v.id);

    // ────────────────────────────────────────────────────────────
    //  5. Trips — 12 months of history (Mar 2025 → Feb 2026)
    //     Pre-built in memory, then batch-created with Promise.all
    // ────────────────────────────────────────────────────────────
    console.log('  → Generating trips (12 months)...');

    interface TripRecord {
        id: bigint;
        vehicleId: bigint;
        driverId: bigint;
        routeIdx: number;
        distActual: number;
        revenue: number;
        month: number;
        year: number;
        completionTime: Date | null;
        status: TripStatus;
    }

    // Pre-build all trip data in memory (consuming PRNG deterministically)
    const tripBundles: {
        data: Prisma.TripUncheckedCreateInput;
        meta: Omit<TripRecord, 'id'>;
    }[] = [];
    let invoiceCounter = 1;

    const monthConfigs: [number, number, number][] = [
        [2025, 3, 12], [2025, 4, 13], [2025, 5, 14], [2025, 6, 15],
        [2025, 7, 16], [2025, 8, 17], [2025, 9, 18], [2025, 10, 19],
        [2025, 11, 20], [2025, 12, 22], [2026, 1, 22], [2026, 2, 18],
    ];

    for (const [year, month, tripCount] of monthConfigs) {
        const isCurrentMonth = year === 2026 && month === 2;
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let t = 0; t < tripCount; t++) {
            const r = rand();
            let vehicleId: bigint;
            let driverId: bigint;
            let routeIdx: number;

            if (r < 0.55) {
                vehicleId = pick(truckVehicleIds);
                driverId = pick(truckDriverIds);
                routeIdx = randInt(0, 17);
            } else if (r < 0.80) {
                vehicleId = pick(vanVehicleIds);
                driverId = pick(vanDriverIds);
                routeIdx = randInt(0, 17);
            } else if (r < 0.92) {
                vehicleId = pick(bikeVehicleIds);
                driverId = pick(bikeDriverIds);
                routeIdx = randInt(20, 23);
            } else {
                vehicleId = pick(planeVehicleIds);
                driverId = pick(planeDriverIds);
                routeIdx = randInt(18, 19);
            }

            const route = ROUTES[routeIdx];
            const day = randInt(1, Math.min(daysInMonth, isCurrentMonth ? 27 : daysInMonth));
            const dispatchHour = randInt(4, 18);
            const dispatchTime = cal(year, month, day, dispatchHour);

            const durationHours = Math.max(2, Math.round(route.distKm / (rand() > 0.5 ? 50 : 65)));
            const completionDate = new Date(dispatchTime.getTime() + durationHours * 3_600_000);

            let status: TripStatus;
            if (isCurrentMonth && t >= tripCount - 5) {
                if (t >= tripCount - 2) status = TripStatus.DRAFT;
                else if (t >= tripCount - 4) status = TripStatus.DISPATCHED;
                else status = TripStatus.CANCELLED;
            } else {
                status = TripStatus.COMPLETED;
            }

            const distActual = status === TripStatus.COMPLETED
                ? route.distKm + randInt(-8, 15)
                : 0;

            const baseRevPerKm = route.distKm > 500 ? randFloat(80, 120) : randFloat(40, 90);
            const revenue = Math.round(route.distKm * baseRevPerKm);

            const cargoWeight = routeIdx >= 20
                ? randInt(5, 50)
                : routeIdx >= 18
                    ? randInt(600, 1200)
                    : randInt(500, 20_000);

            const invoiceRef = status === TripStatus.COMPLETED
                ? `INV-FF-${year}-${String(invoiceCounter++).padStart(4, '0')}`
                : undefined;

            tripBundles.push({
                data: {
                    vehicleId,
                    driverId,
                    origin: route.origin,
                    destination: route.destination,
                    distanceEstimated: route.distKm,
                    distanceActual: status === TripStatus.COMPLETED ? distActual : undefined,
                    cargoWeight,
                    cargoDescription: pick(CARGO_DESCRIPTIONS),
                    revenue,
                    clientName: pick(CLIENTS),
                    invoiceReference: invoiceRef,
                    status,
                    dispatchTime: status !== TripStatus.DRAFT ? dispatchTime : undefined,
                    completionTime: status === TripStatus.COMPLETED ? completionDate : undefined,
                    cancelledReason: status === TripStatus.CANCELLED
                        ? pick(['Client postponed shipment', 'Vehicle breakdown before departure', 'Driver unavailable — reassigned', 'Weather conditions — heavy rainfall advisory'])
                        : undefined,
                    createdAt: new Date(dispatchTime.getTime() - randInt(1, 24) * 3_600_000),
                },
                meta: {
                    vehicleId, driverId, routeIdx, distActual, revenue, month, year,
                    completionTime: status === TripStatus.COMPLETED ? completionDate : null,
                    status,
                },
            });
        }
    }

    // Today trips for dashboard "Completed Today" KPI
    const todayTrips = [
        { vi: 0, di: 0, ri: 0 }, { vi: 2, di: 2, ri: 14 }, { vi: 4, di: 8, ri: 2 },
        { vi: 12, di: 3, ri: 5 }, { vi: 19, di: 13, ri: 20 },
    ];
    for (const tt of todayTrips) {
        const route = ROUTES[tt.ri];
        const now = new Date();
        const dispTime = new Date(now.getTime() - randInt(3, 10) * 3_600_000);
        const compTime = new Date(dispTime.getTime() + randInt(2, 6) * 3_600_000);
        const distActual = route.distKm + randInt(-5, 10);
        const revenue = Math.round(route.distKm * randFloat(50, 100));

        tripBundles.push({
            data: {
                vehicleId: vehicles[tt.vi].id,
                driverId: drivers[tt.di].id,
                origin: route.origin,
                destination: route.destination,
                distanceEstimated: route.distKm,
                distanceActual: distActual,
                cargoWeight: randInt(200, 15_000),
                cargoDescription: pick(CARGO_DESCRIPTIONS),
                revenue,
                clientName: pick(CLIENTS),
                invoiceReference: `INV-FF-2026-${String(invoiceCounter++).padStart(4, '0')}`,
                status: TripStatus.COMPLETED,
                dispatchTime: dispTime,
                completionTime: compTime,
            },
            meta: {
                vehicleId: vehicles[tt.vi].id, driverId: drivers[tt.di].id,
                routeIdx: tt.ri, distActual, revenue, month: 2, year: 2026,
                completionTime: compTime, status: TripStatus.COMPLETED,
            },
        });
    }

    // Batch-create trips (need returned IDs for FK refs in child entities)
    const TRIP_BATCH = 25;
    const createdTripIds: bigint[] = [];
    for (let i = 0; i < tripBundles.length; i += TRIP_BATCH) {
        const batch = tripBundles.slice(i, i + TRIP_BATCH);
        const results = await Promise.all(
            batch.map(b => prisma.trip.create({ data: b.data, select: { id: true } }))
        );
        createdTripIds.push(...results.map(r => r.id));
    }

    const allTrips: TripRecord[] = createdTripIds.map((id, i) => ({
        id,
        ...tripBundles[i].meta,
    }));
    const completedTrips = allTrips.filter(t => t.status === TripStatus.COMPLETED);
    console.log(`  ✅  ${allTrips.length} trips seeded (${completedTrips.length} completed, 5 today).\n`);

    // ────────────────────────────────────────────────────────────
    //  6. Fuel Logs — bulk createMany
    // ────────────────────────────────────────────────────────────
    console.log('  → Fuel logs...');
    const fuelLogData: Prisma.FuelLogCreateManyInput[] = [];

    for (const trip of completedTrips) {
        const route = ROUTES[trip.routeIdx];
        const isPlane = trip.routeIdx >= 18 && trip.routeIdx <= 19;
        const isBike = trip.routeIdx >= 20;

        const liters = isPlane
            ? randFloat(350, 500)
            : isBike
                ? randFloat(2, 6)
                : route.distKm > 400
                    ? randFloat(80, 150)
                    : randFloat(25, 80);

        const costPerLiter = isPlane
            ? randFloat(85, 92, 2)
            : isBike
                ? randFloat(102, 108, 2)
                : randFloat(92, 98, 2);

        fuelLogData.push({
            vehicleId: trip.vehicleId,
            tripId: trip.id,
            liters,
            costPerLiter,
            totalCost: parseFloat((liters * costPerLiter).toFixed(2)),
            odometerAtFill: randInt(1000, 200_000),
            fuelStation: pick(FUEL_STATIONS),
            loggedAt: trip.completionTime
                ? new Date(trip.completionTime.getTime() - randInt(1, 4) * 3_600_000)
                : daysAgo(randInt(1, 30)),
        });

        if (route.distKm > 400 && rand() < 0.4 && !isBike) {
            const liters2 = randFloat(40, 90);
            fuelLogData.push({
                vehicleId: trip.vehicleId,
                tripId: trip.id,
                liters: liters2,
                costPerLiter,
                totalCost: parseFloat((liters2 * costPerLiter).toFixed(2)),
                odometerAtFill: randInt(1000, 200_000),
                fuelStation: pick(FUEL_STATIONS),
                loggedAt: trip.completionTime
                    ? new Date(trip.completionTime.getTime() - randInt(5, 10) * 3_600_000)
                    : daysAgo(randInt(1, 30)),
            });
        }
    }

    await prisma.fuelLog.createMany({ data: fuelLogData });
    console.log(`  ✅  ${fuelLogData.length} fuel logs seeded.\n`);

    // ────────────────────────────────────────────────────────────
    //  7. Maintenance Logs — bulk createMany
    // ────────────────────────────────────────────────────────────
    console.log('  → Maintenance logs...');
    const maintData: Prisma.MaintenanceLogCreateManyInput[] = [];

    for (const vehicle of vehicles) {
        if (vehicle.status === VehicleStatus.RETIRED) continue;

        const numLogs = randInt(3, 8);
        for (let m = 0; m < numLogs; m++) {
            const monthOffset = randInt(0, 11);
            const year = monthOffset < 10 ? 2025 : 2026;
            const month = ((2 + monthOffset) % 12) + 1;
            const day = randInt(1, 28);

            const serviceType = pick(SERVICE_TYPES);
            const baseCost = serviceType === 'OIL_CHANGE' ? randInt(3000, 6000)
                : serviceType === 'BRAKE_INSPECTION' ? randInt(8000, 18000)
                : serviceType === 'TYRE_ROTATION' ? randInt(2000, 5000)
                : serviceType === 'ENGINE_TUNING' ? randInt(5000, 12000)
                : serviceType === 'BATTERY_REPLACEMENT' ? randInt(4000, 9000)
                : serviceType === 'TRANSMISSION_SERVICE' ? randInt(12000, 25000)
                : randInt(2000, 8000);

            maintData.push({
                vehicleId: vehicle.id,
                serviceType,
                description: `${serviceType.replace(/_/g, ' ').toLowerCase()} — routine scheduled service. All checks passed.`,
                cost: baseCost,
                odometerAtService: randInt(5000, 200_000),
                technicianName: pick(TECHNICIANS),
                shopName: pick(SHOPS),
                serviceDate: cal(year, month, day),
                nextServiceDue: rand() > 0.3
                    ? cal(month + 6 > 12 ? year + 1 : year, ((month + 5) % 12) + 1, day > 28 ? 28 : day)
                    : undefined,
            });
        }
    }

    // In-shop vehicles get a recent maintenance log
    for (const v of vehicles.filter(v => v.status === VehicleStatus.IN_SHOP)) {
        maintData.push({
            vehicleId: v.id,
            serviceType: 'BRAKE_INSPECTION',
            description: 'Full brake system inspection and pad replacement. ABS diagnostic pending. Expected 2 days downtime.',
            cost: 15_000,
            odometerAtService: Number(v.currentOdometer),
            technicianName: pick(TECHNICIANS),
            shopName: pick(SHOPS),
            serviceDate: daysAgo(1),
            nextServiceDue: daysFromNow(180),
        });
    }

    await prisma.maintenanceLog.createMany({ data: maintData });
    console.log(`  ✅  ${maintData.length} maintenance logs seeded.\n`);

    // ────────────────────────────────────────────────────────────
    //  8. Expenses — bulk createMany
    // ────────────────────────────────────────────────────────────
    console.log('  → Expenses...');
    const expenseData: Prisma.ExpenseCreateManyInput[] = [];

    for (const trip of completedTrips) {
        const route = ROUTES[trip.routeIdx];

        if (route.tolls > 0) {
            expenseData.push({
                vehicleId: trip.vehicleId,
                tripId: trip.id,
                amount: route.tolls + randInt(-50, 100),
                category: ExpenseCategory.TOLL,
                description: `Highway toll charges — ${route.origin} to ${route.destination}`,
                loggedByUserId: dispatcherUser.id,
                dateLogged: trip.completionTime ?? daysAgo(1),
            });
        }

        if (route.distKm > 400 && rand() < 0.5) {
            expenseData.push({
                vehicleId: trip.vehicleId,
                tripId: trip.id,
                amount: randInt(1200, 3500),
                category: ExpenseCategory.LODGING,
                description: `Driver overnight stay — highway hotel en route ${route.destination}`,
                loggedByUserId: dispatcherUser.id,
                dateLogged: trip.completionTime ?? daysAgo(1),
            });
        }

        if (trip.routeIdx >= 18 && trip.routeIdx <= 19) {
            expenseData.push({
                vehicleId: trip.vehicleId,
                tripId: trip.id,
                amount: randInt(6000, 12000),
                category: ExpenseCategory.MISC,
                description: 'Airport cargo terminal handling + DGCA documentation fees',
                loggedByUserId: financeUser.id,
                dateLogged: trip.completionTime ?? daysAgo(1),
            });
        }

        if (rand() < 0.05) {
            expenseData.push({
                vehicleId: trip.vehicleId,
                tripId: trip.id,
                amount: randInt(1500, 8000),
                category: ExpenseCategory.MAINTENANCE_EN_ROUTE,
                description: pick([
                    'Emergency roadside repair — flat tyre replacement',
                    'Coolant hose burst — mobile mechanic call-out',
                    'Battery jump start — roadside assistance',
                    'Windshield wiper replacement — heavy rain damage',
                ]),
                loggedByUserId: dispatcherUser.id,
                dateLogged: trip.completionTime ?? daysAgo(1),
            });
        }
    }

    await prisma.expense.createMany({ data: expenseData });
    console.log(`  ✅  ${expenseData.length} expenses seeded.\n`);

    // ────────────────────────────────────────────────────────────
    //  9. Incident Reports (30) — bulk createMany
    // ────────────────────────────────────────────────────────────
    console.log('  → Incidents (30)...');
    const incidentConfigs: {
        type: IncidentType; title: string; desc: string; status: IncidentStatus;
        injuries: boolean; damage: number; resolution?: string; daysAgoVal: number;
    }[] = [
        { type: IncidentType.ACCIDENT, title: 'Rear-end collision on NH-48', desc: 'Truck rear-ended by a car near Khopoli exit. Minor bumper damage. No cargo damage. Police report filed.', status: IncidentStatus.RESOLVED, injuries: false, damage: 45_000, resolution: 'Insurance claim filed and approved. Bumper replaced at authorized workshop.', daysAgoVal: 250 },
        { type: IncidentType.ACCIDENT, title: 'Side-swipe on Pune-Bangalore highway', desc: 'Side mirror and door panel scraped against a divider during lane change. Driver was fatigued after 10-hour shift.', status: IncidentStatus.CLOSED, injuries: false, damage: 22_000, resolution: 'Door panel repainted. Driver counseled on rest requirements. Shift policy updated.', daysAgoVal: 200 },
        { type: IncidentType.ACCIDENT, title: 'Minor collision at Solapur toll plaza', desc: 'Low-speed collision with another truck at toll queue. Front bumper cracked.', status: IncidentStatus.RESOLVED, injuries: false, damage: 18_000, resolution: 'Bumper replaced. Insurance settled.', daysAgoVal: 120 },
        { type: IncidentType.ACCIDENT, title: 'Cargo shift during sharp turn', desc: 'Improperly secured cargo shifted causing vehicle to tilt dangerously on NH-44 curve. Emergency stop executed.', status: IncidentStatus.INVESTIGATING, injuries: false, damage: 85_000, daysAgoVal: 15 },
        { type: IncidentType.BREAKDOWN, title: 'Engine overheating near Mathura', desc: 'Coolant system failure caused engine overheating. Vehicle stopped on highway shoulder. Tow truck called.', status: IncidentStatus.RESOLVED, injuries: false, damage: 35_000, resolution: 'Radiator and coolant hose replaced. Vehicle back in service.', daysAgoVal: 180 },
        { type: IncidentType.BREAKDOWN, title: 'Transmission failure on NH-65', desc: 'Gearbox seized on Solapur highway. Complete transmission replacement required.', status: IncidentStatus.CLOSED, injuries: false, damage: 120_000, resolution: 'Full transmission rebuilt. Vehicle in service after 5 days downtime.', daysAgoVal: 150 },
        { type: IncidentType.BREAKDOWN, title: 'Flat tyre blowout near Tumkur', desc: 'Front-right tyre blowout at 70 km/h on NH-48. Driver managed to safely pull over.', status: IncidentStatus.RESOLVED, injuries: false, damage: 8_000, resolution: 'Tyre replaced. All tyres inspected and rotated.', daysAgoVal: 90 },
        { type: IncidentType.BREAKDOWN, title: 'Electrical failure — starter motor', desc: 'Vehicle failed to start at Delhi depot. Starter motor diagnosed as faulty.', status: IncidentStatus.CLOSED, injuries: false, damage: 12_000, resolution: 'Starter motor replaced. Battery health checked and cleared.', daysAgoVal: 60 },
        { type: IncidentType.BREAKDOWN, title: 'Brake fluid leak on Jaipur highway', desc: 'Brake warning light triggered. Fluid leak from rear brake line. Emergency roadside stop.', status: IncidentStatus.OPEN, injuries: false, damage: 25_000, daysAgoVal: 5 },
        { type: IncidentType.TRAFFIC_VIOLATION, title: 'Speeding violation — NH-44', desc: 'Driver clocked at 95 km/h in 60 km/h zone near Hyderabad outskirts. E-challan issued.', status: IncidentStatus.CLOSED, injuries: false, damage: 2_000, resolution: 'Fine paid. Driver issued formal warning. Safety score reduced.', daysAgoVal: 220 },
        { type: IncidentType.TRAFFIC_VIOLATION, title: 'Red light violation — Chennai', desc: 'Van ran a red light at T. Nagar signal. Captured by traffic camera.', status: IncidentStatus.RESOLVED, injuries: false, damage: 1_500, resolution: 'Fine paid. Driver completed mandatory safety refresher course.', daysAgoVal: 160 },
        { type: IncidentType.TRAFFIC_VIOLATION, title: 'Overloading fine at weigh bridge', desc: 'Vehicle weighed 2.5 tons over declared limit at Maharashtra state weigh bridge.', status: IncidentStatus.CLOSED, injuries: false, damage: 5_000, resolution: 'Fine paid. Loading procedures reviewed and updated. Weight verification mandatory before dispatch.', daysAgoVal: 100 },
        { type: IncidentType.TRAFFIC_VIOLATION, title: 'Lane violation on expressway', desc: 'Heavy vehicle found in fast lane on Mumbai-Pune Expressway. E-challan generated.', status: IncidentStatus.RESOLVED, injuries: false, damage: 1_000, resolution: 'Fine settled. Driver briefed on expressway lane discipline.', daysAgoVal: 40 },
        { type: IncidentType.THEFT, title: 'Fuel siphoning — Kolkata depot', desc: 'Approximately 40 liters of diesel siphoned from parked truck overnight at Kolkata depot. Security camera footage under review.', status: IncidentStatus.INVESTIGATING, injuries: false, damage: 4_000, daysAgoVal: 25 },
        { type: IncidentType.THEFT, title: 'Attempted cargo theft on NH-19', desc: 'Driver reported suspicious vehicles following the truck. Pulled into police checkpost. Attempted theft averted.', status: IncidentStatus.CLOSED, injuries: false, damage: 0, resolution: 'Police FIR filed. GPS tracking alert system installed on vehicle. Route security review completed.', daysAgoVal: 130 },
        { type: IncidentType.CARGO_DAMAGE, title: 'Water damage to electronics cargo', desc: 'Rain water seeped through tarpaulin tear during monsoon delivery. 15 cartons of electronics water-damaged.', status: IncidentStatus.RESOLVED, injuries: false, damage: 180_000, resolution: 'Insurance claim settled for ₹1,50,000. All tarpaulins replaced with heavy-duty waterproof variants. Pre-monsoon vehicle inspection protocol established.', daysAgoVal: 190 },
        { type: IncidentType.CARGO_DAMAGE, title: 'Fragile goods broken in transit', desc: 'Ceramic tiles shipment — 8% breakage due to inadequate cushioning on Pune-Nashik route.', status: IncidentStatus.CLOSED, injuries: false, damage: 32_000, resolution: 'Client compensation paid. Packaging standards updated for fragile goods category.', daysAgoVal: 80 },
        { type: IncidentType.CARGO_DAMAGE, title: 'Temperature excursion — pharma cargo', desc: 'Cold chain monitoring showed 2-hour temperature excursion above 8°C during Mumbai-Delhi air freight. 3 vaccine pallets affected.', status: IncidentStatus.INVESTIGATING, injuries: false, damage: 350_000, daysAgoVal: 10 },
        { type: IncidentType.NEAR_MISS, title: 'Near collision with pedestrian — Andheri', desc: 'Bike courier narrowly avoided hitting a pedestrian who jaywalked near Andheri station. Emergency braking applied.', status: IncidentStatus.CLOSED, injuries: false, damage: 0, resolution: 'Route modified to avoid peak-hour pedestrian zones. Speed limit reduced for urban corridors.', daysAgoVal: 170 },
        { type: IncidentType.NEAR_MISS, title: 'Near miss — truck swerve on NH-48', desc: 'Truck swerved to avoid a stalled vehicle on highway shoulder. No contact made but cargo shifted slightly.', status: IncidentStatus.RESOLVED, injuries: false, damage: 0, resolution: 'Cargo re-secured. Driver commended for quick reflexes. Incident logged for safety analysis.', daysAgoVal: 110 },
        { type: IncidentType.NEAR_MISS, title: 'Tyre burst during overtaking', desc: 'Rear tyre burst while overtaking on NH-44. Driver maintained control. No collision.', status: IncidentStatus.CLOSED, injuries: false, damage: 6_000, resolution: 'Tyre age policy updated — max 3 years. All fleet tyres audited.', daysAgoVal: 70 },
        { type: IncidentType.NEAR_MISS, title: 'Close call at railway crossing', desc: 'Van narrowly cleared unmanned railway crossing as barriers descended late. Within seconds of gate closure.', status: IncidentStatus.OPEN, injuries: false, damage: 0, daysAgoVal: 3 },
        { type: IncidentType.OTHER, title: 'Road rage incident — Gurgaon', desc: 'Driver involved in verbal altercation with another motorist after minor road dispute. No physical contact.', status: IncidentStatus.CLOSED, injuries: false, damage: 0, resolution: 'Driver counseled. Conflict resolution training scheduled for all drivers.', daysAgoVal: 140 },
        { type: IncidentType.OTHER, title: 'GPS tracker malfunction', desc: 'Vehicle GPS tracker went offline for 6 hours during Chennai-Coimbatore run. Location data gap in records.', status: IncidentStatus.RESOLVED, injuries: false, damage: 3_000, resolution: 'GPS unit replaced. Backup manual check-in protocol activated for future connectivity losses.', daysAgoVal: 50 },
        { type: IncidentType.ACCIDENT, title: 'Pedestrian minor injury — Jaipur', desc: 'Van bumped a pedestrian at low speed in Jaipur market area. Minor bruising reported. Medical assistance provided.', status: IncidentStatus.RESOLVED, injuries: true, damage: 15_000, resolution: 'Medical expenses covered. Driver license suspended for 30 days. Market area driving protocol updated.', daysAgoVal: 240 },
        { type: IncidentType.ACCIDENT, title: 'Multi-vehicle pileup — fog on NH-1', desc: 'Low visibility fog caused chain collision involving our truck and 3 other vehicles near Panipat. Driver sustained minor injuries.', status: IncidentStatus.CLOSED, injuries: true, damage: 280_000, resolution: 'Full vehicle repair completed. Driver recovered. Fog protocol — mandatory halt policy implemented for visibility below 50m.', daysAgoVal: 300 },
        { type: IncidentType.BREAKDOWN, title: 'Alternator failure on Bangalore ring road', desc: 'Vehicle electrical system failed mid-trip. All dashboard lights dimmed. Roadside assistance called.', status: IncidentStatus.RESOLVED, injuries: false, damage: 14_000, resolution: 'Alternator and voltage regulator replaced. Electrical system audit completed.', daysAgoVal: 35 },
        { type: IncidentType.CARGO_DAMAGE, title: 'Paint drums leaked during transit', desc: 'Two industrial paint drums developed leaks due to vibration damage. Van interior stained. Partial cargo loss.', status: IncidentStatus.OPEN, injuries: false, damage: 28_000, daysAgoVal: 7 },
        { type: IncidentType.NEAR_MISS, title: 'Bike courier near-miss with bus', desc: 'Delivery bike nearly collided with a reversing bus at Koramangala depot. Driver alert prevented contact.', status: IncidentStatus.INVESTIGATING, injuries: false, damage: 0, daysAgoVal: 12 },
        { type: IncidentType.TRAFFIC_VIOLATION, title: 'Parking violation — BKC Mumbai', desc: 'Delivery bike parked in no-parking zone during urgent delivery. Towed and fine issued.', status: IncidentStatus.RESOLVED, injuries: false, damage: 500, resolution: 'Fine paid. Designated parking spots identified for regular delivery zones.', daysAgoVal: 20 },
    ];

    const incidentData: Prisma.IncidentReportCreateManyInput[] = incidentConfigs.map(inc => {
        const vehicleIdx = randInt(0, vehicles.length - 1);
        const driverIdx = randInt(0, drivers.length - 1);
        const relatedTrip = completedTrips.find(t =>
            t.vehicleId === vehicles[vehicleIdx].id && t.driverId === drivers[driverIdx].id
        );

        return {
            vehicleId: vehicles[vehicleIdx].id,
            driverId: drivers[driverIdx].id,
            tripId: relatedTrip?.id,
            incidentType: inc.type,
            title: inc.title,
            description: inc.desc,
            incidentDate: daysAgo(inc.daysAgoVal),
            location: ROUTES[randInt(0, ROUTES.length - 1)].origin,
            injuriesReported: inc.injuries,
            damageEstimate: inc.damage,
            status: inc.status,
            resolution: inc.resolution,
            resolvedAt: inc.resolution ? daysAgo(inc.daysAgoVal - randInt(1, 10)) : undefined,
            reportedByUserId: safetyUser.id,
        };
    });

    await prisma.incidentReport.createMany({ data: incidentData });
    console.log(`  ✅  ${incidentData.length} incidents seeded.\n`);

    // ────────────────────────────────────────────────────────────
    //  10. Vehicle Documents — bulk createMany
    // ────────────────────────────────────────────────────────────
    console.log('  → Vehicle documents...');
    const docTypes = [
        VehicleDocumentType.INSURANCE, VehicleDocumentType.REGISTRATION,
        VehicleDocumentType.INSPECTION, VehicleDocumentType.PERMIT,
    ];
    const docData: Prisma.VehicleDocumentCreateManyInput[] = [];

    for (const vehicle of vehicles) {
        for (const docType of docTypes) {
            const expiryMonths = docType === VehicleDocumentType.INSURANCE ? randInt(6, 18)
                : docType === VehicleDocumentType.REGISTRATION ? randInt(12, 36)
                : randInt(3, 12);

            docData.push({
                vehicleId: vehicle.id,
                documentType: docType,
                documentNumber: `${docType.slice(0, 3)}-${vehicle.licensePlate}-${randInt(1000, 9999)}`,
                issuedBy: pick(['RTO Mumbai', 'RTO Delhi', 'RTO Bangalore', 'RTO Chennai', 'NHAI', 'IRDAI']),
                issuedAt: daysAgo(randInt(60, 365)),
                expiresAt: daysFromNow(expiryMonths * 30),
                notes: `Valid ${docType.toLowerCase()} document for ${vehicle.licensePlate}`,
                isActive: true,
            });
        }
    }

    await prisma.vehicleDocument.createMany({ data: docData });
    console.log(`  ✅  ${docData.length} vehicle documents seeded.\n`);

    // ────────────────────────────────────────────────────────────
    //  11. Vehicle Locations — bulk createMany
    // ────────────────────────────────────────────────────────────
    console.log('  → Vehicle locations...');
    const cityCoords: [number, number][] = [
        [19.0330, 73.0297],   // Navi Mumbai
        [17.6869, 75.9064],   // Solapur (en-route)
        [28.6139, 77.2090],   // Delhi
        [12.9716, 77.5946],   // Bangalore
        [13.0827, 80.2707],   // Chennai
        [23.0225, 72.5714],   // Ahmedabad
        [26.9124, 75.7873],   // Jaipur
        [22.5726, 88.3639],   // Kolkata
        [19.0760, 72.8777],   // Mumbai
        [18.5204, 73.8567],   // Pune
        [17.3850, 78.4867],   // Hyderabad
        [23.2599, 77.4126],   // Bhopal
        [25.4358, 81.8463],   // Prayagraj
        [21.1702, 72.8311],   // Surat
    ];

    const locationData: Prisma.VehicleLocationCreateManyInput[] = [];
    for (const vehicle of vehicles) {
        if (vehicle.status === VehicleStatus.RETIRED) continue;

        const [lat, lng] = pick(cityCoords);
        const isMoving = vehicle.status === VehicleStatus.ON_TRIP;

        const numPings = isMoving ? randInt(5, 12) : 1;
        for (let p = 0; p < numPings; p++) {
            locationData.push({
                vehicleId: vehicle.id,
                latitude: lat + (isMoving ? randFloat(-0.5, 0.5, 4) : randFloat(-0.01, 0.01, 4)),
                longitude: lng + (isMoving ? randFloat(-0.5, 0.5, 4) : randFloat(-0.01, 0.01, 4)),
                speed: isMoving ? randFloat(40, 85) : 0,
                heading: isMoving ? randFloat(0, 360) : 0,
                accuracy: randFloat(3, 15),
                recordedAt: isMoving
                    ? new Date(Date.now() - p * randInt(5, 15) * 60_000)
                    : daysAgo(randInt(0, 2)),
            });
        }
    }

    await prisma.vehicleLocation.createMany({ data: locationData });
    console.log(`  ✅  ${locationData.length} GPS locations seeded.\n`);

    // ────────────────────────────────────────────────────────────
    //  12. Trip Waypoints — bulk createMany
    // ────────────────────────────────────────────────────────────
    console.log('  → Trip waypoints...');
    const dispatchedTrips = allTrips.filter(t => t.status === TripStatus.DISPATCHED);
    const waypointData: Prisma.TripWaypointCreateManyInput[] = [];

    for (const trip of dispatchedTrips) {
        const route = ROUTES[trip.routeIdx];
        const waypointNames = [
            `${route.origin} — Loading Bay`,
            `Highway rest stop — ${randInt(50, 200)} km marker`,
            `Fuel station — ${pick(FUEL_STATIONS)}`,
            `${route.destination} — Unloading Bay`,
        ];

        for (let seq = 1; seq <= waypointNames.length; seq++) {
            const [lat, lng] = pick(cityCoords);
            waypointData.push({
                tripId: trip.id,
                sequence: seq,
                location: waypointNames[seq - 1],
                latitude: lat + randFloat(-0.3, 0.3, 4),
                longitude: lng + randFloat(-0.3, 0.3, 4),
                scheduledAt: new Date(Date.now() + seq * randInt(1, 3) * 3_600_000),
                arrivedAt: seq <= 2 ? new Date(Date.now() - (4 - seq) * 3_600_000) : undefined,
                departedAt: seq === 1 ? new Date(Date.now() - 3 * 3_600_000) : undefined,
            });
        }
    }

    await prisma.tripWaypoint.createMany({ data: waypointData });
    console.log(`  ✅  ${waypointData.length} waypoints seeded.\n`);

    // ────────────────────────────────────────────────────────────
    //  13. Audit Logs — bulk createMany
    // ────────────────────────────────────────────────────────────
    console.log('  → Audit logs...');
    const auditData: Prisma.AuditLogCreateManyInput[] = [
        { entity: 'Trip', action: AuditAction.CREATE, daysAgoVal: 1 },
        { entity: 'Trip', action: AuditAction.UPDATE, daysAgoVal: 1 },
        { entity: 'Vehicle', action: AuditAction.UPDATE, daysAgoVal: 2 },
        { entity: 'Driver', action: AuditAction.UPDATE, daysAgoVal: 3 },
        { entity: 'Trip', action: AuditAction.CREATE, daysAgoVal: 5 },
        { entity: 'Vehicle', action: AuditAction.CREATE, daysAgoVal: 10 },
        { entity: 'Driver', action: AuditAction.CREATE, daysAgoVal: 10 },
        { entity: 'Trip', action: AuditAction.UPDATE, daysAgoVal: 7 },
    ].map(a => ({
        userId: pick(users).id,
        entity: a.entity,
        entityId: pick(vehicles).id,
        action: a.action,
        newValues: { status: 'COMPLETED' },
        ipAddress: '192.168.1.' + randInt(2, 254),
        userAgent: 'Mozilla/5.0 FleetFlow Dashboard',
        timestamp: daysAgo(a.daysAgoVal),
    }));

    await prisma.auditLog.createMany({ data: auditData });
    console.log(`  ✅  ${auditData.length} audit logs seeded.\n`);

    // ────────────────────────────────────────────────────────────
    //  Summary
    // ────────────────────────────────────────────────────────────
    console.log('🎉  FleetFlow comprehensive seed completed!\n');

    console.log('📋  Login credentials (all roles — same password):');
    console.log('    Password: FleetFlow@2026\n');
    console.log('    ┌──────────────────────────────────────┬─────────────────────┬──────────────────┐');
    console.log('    │ Email                                │ Name                │ Role             │');
    console.log('    ├──────────────────────────────────────┼─────────────────────┼──────────────────┤');
    console.log('    │ manager@fleetflow.io                 │ Priya Sharma        │ MANAGER          │');
    console.log('    │ dispatcher@fleetflow.io              │ Rahul Verma         │ DISPATCHER       │');
    console.log('    │ safety@fleetflow.io                  │ Sneha Patel         │ SAFETY_OFFICER   │');
    console.log('    │ finance@fleetflow.io                 │ Vikram Nair         │ FINANCE_ANALYST  │');
    console.log('    └──────────────────────────────────────┴─────────────────────┴──────────────────┘');
    console.log('    + 4 more users (manager2, dispatcher2, safety2, finance2)\n');

    console.log('📊  Data Summary:');
    console.log(`    Vehicles:     ${vehicles.length} (12 trucks, 7 vans, 4 bikes, 2 planes)`);
    console.log(`    Drivers:      ${drivers.length} (4 expiring licenses, 2 suspended)`);
    console.log(`    Trips:        ${allTrips.length} (${completedTrips.length} completed, 5 today)`);
    console.log(`    Fuel logs:    ${fuelLogData.length}`);
    console.log(`    Maintenance:  ${maintData.length}`);
    console.log(`    Expenses:     ${expenseData.length}`);
    console.log(`    Incidents:    ${incidentData.length}`);
    console.log(`    Documents:    ${docData.length}`);
    console.log(`    GPS points:   ${locationData.length}`);
    console.log(`    Waypoints:    ${waypointData.length}`);
    console.log(`    Audit logs:   ${auditData.length}\n`);
}

main()
    .catch((e) => {
        console.error('❌  Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
