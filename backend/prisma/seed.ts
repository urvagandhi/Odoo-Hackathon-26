/**
 * FleetFlow — Prisma Database Seed
 * ─────────────────────────────────
 * Seeds:
 *  1. Vehicle types (all 4 types)
 *  2. Five users (one per role)
 *  3. Sample vehicles (one per type)
 *  4. Sample drivers (2, one with soon-expiring license)
 *
 * Run: npx ts-node prisma/seed.ts
 */

import { PrismaClient, UserRole, VehicleStatus, DriverStatus, VehicleType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
    console.log('🌱  Starting FleetFlow seed...');

    // ── 1. Vehicle Types ─────────────────────────────────────────
    console.log('  → Seeding vehicle types...');
    const vehicleTypes = await Promise.all([
        prisma.vehicleTypeRecord.upsert({
            where: { name: VehicleType.TRUCK },
            update: {},
            create: {
                name: VehicleType.TRUCK,
                description: 'Heavy-duty long-haul trucks. High capacity for bulk freight.',
            },
        }),
        prisma.vehicleTypeRecord.upsert({
            where: { name: VehicleType.VAN },
            update: {},
            create: {
                name: VehicleType.VAN,
                description: 'Mid-size vans for city and regional last-mile deliveries.',
            },
        }),
        prisma.vehicleTypeRecord.upsert({
            where: { name: VehicleType.BIKE },
            update: {},
            create: {
                name: VehicleType.BIKE,
                description: 'Cargo bikes and motorcycles for ultra-fast urban micro-deliveries.',
            },
        }),
        prisma.vehicleTypeRecord.upsert({
            where: { name: VehicleType.PLANE },
            update: {},
            create: {
                name: VehicleType.PLANE,
                description: 'Air freight aircraft for international and urgent cargo.',
            },
        }),
    ]);
    console.log(`  ✅  ${vehicleTypes.length} vehicle types seeded.`);

    // ── 2. Users (one per role) ───────────────────────────────────
    console.log('  → Seeding users...');
    const passwordHash = await bcrypt.hash('FleetFlow@2025', SALT_ROUNDS);

    const users = await Promise.all([
        prisma.user.upsert({
            where: { email: 'superadmin@fleetflow.io' },
            update: {},
            create: {
                email: 'superadmin@fleetflow.io',
                passwordHash,
                fullName: 'Super Admin',
                role: UserRole.SUPER_ADMIN,
                isActive: true,
            },
        }),
        prisma.user.upsert({
            where: { email: 'manager@fleetflow.io' },
            update: {},
            create: {
                email: 'manager@fleetflow.io',
                passwordHash,
                fullName: 'Fleet Manager',
                role: UserRole.MANAGER,
                isActive: true,
            },
        }),
        prisma.user.upsert({
            where: { email: 'dispatcher@fleetflow.io' },
            update: {},
            create: {
                email: 'dispatcher@fleetflow.io',
                passwordHash,
                fullName: 'Lead Dispatcher',
                role: UserRole.DISPATCHER,
                isActive: true,
            },
        }),
        prisma.user.upsert({
            where: { email: 'safety@fleetflow.io' },
            update: {},
            create: {
                email: 'safety@fleetflow.io',
                passwordHash,
                fullName: 'Safety Officer',
                role: UserRole.SAFETY_OFFICER,
                isActive: true,
            },
        }),
        prisma.user.upsert({
            where: { email: 'finance@fleetflow.io' },
            update: {},
            create: {
                email: 'finance@fleetflow.io',
                passwordHash,
                fullName: 'Finance Analyst',
                role: UserRole.FINANCE_ANALYST,
                isActive: true,
            },
        }),
    ]);
    console.log(`  ✅  ${users.length} users seeded.`);

    const truckType = vehicleTypes.find((t) => t.name === VehicleType.TRUCK)!;
    const vanType = vehicleTypes.find((t) => t.name === VehicleType.VAN)!;
    const bikeType = vehicleTypes.find((t) => t.name === VehicleType.BIKE)!;
    const planeType = vehicleTypes.find((t) => t.name === VehicleType.PLANE)!;

    // ── 3. Sample Vehicles ────────────────────────────────────────
    console.log('  → Seeding vehicles...');
    const vehicles = await Promise.all([
        prisma.vehicle.upsert({
            where: { licensePlate: 'FF-TRUCK-001' },
            update: {},
            create: {
                licensePlate: 'FF-TRUCK-001',
                make: 'Peterbilt',
                model: '579',
                year: 2022,
                color: 'Midnight Blue',
                vin: '1XPBDP9X0ND123456',
                vehicleTypeId: truckType.id,
                status: VehicleStatus.AVAILABLE,
                currentOdometer: 45_230,
                capacityWeight: 20_000,  // 20 tonnes
                capacityVolume: 85,       // 85 m³
            },
        }),
        prisma.vehicle.upsert({
            where: { licensePlate: 'FF-VAN-001' },
            update: {},
            create: {
                licensePlate: 'FF-VAN-001',
                make: 'Ford',
                model: 'Transit 350',
                year: 2023,
                color: 'Polar White',
                vehicleTypeId: vanType.id,
                status: VehicleStatus.AVAILABLE,
                currentOdometer: 12_500,
                capacityWeight: 1_500,
                capacityVolume: 14,
            },
        }),
        prisma.vehicle.upsert({
            where: { licensePlate: 'FF-BIKE-001' },
            update: {},
            create: {
                licensePlate: 'FF-BIKE-001',
                make: 'Honda',
                model: 'CB500F',
                year: 2023,
                color: 'Matte Black',
                vehicleTypeId: bikeType.id,
                status: VehicleStatus.AVAILABLE,
                currentOdometer: 3_200,
                capacityWeight: 50,
                capacityVolume: 0.12,
            },
        }),
        prisma.vehicle.upsert({
            where: { licensePlate: 'FF-PLANE-001' },
            update: {},
            create: {
                licensePlate: 'FF-PLANE-001',
                make: 'Cessna',
                model: 'Caravan 208B',
                year: 2021,
                color: 'White & Blue',
                vehicleTypeId: planeType.id,
                status: VehicleStatus.IN_SHOP,  // Currently under inspection
                currentOdometer: 8_900,
                capacityWeight: 1_200,
                capacityVolume: 4.5,
            },
        }),
    ]);
    console.log(`  ✅  ${vehicles.length} vehicles seeded.`);

    // ── 4. Sample Drivers ─────────────────────────────────────────
    console.log('  → Seeding drivers...');

    // Driver 1 — Valid license, ON_DUTY
    const futureExpiry = new Date();
    futureExpiry.setFullYear(futureExpiry.getFullYear() + 2);

    // Driver 2 — License expiring in 20 days (triggers dashboard alert)
    const expiringExpiry = new Date();
    expiringExpiry.setDate(expiringExpiry.getDate() + 20);

    const drivers = await Promise.all([
        prisma.driver.upsert({
            where: { licenseNumber: 'CDL-A-001234' },
            update: {},
            create: {
                licenseNumber: 'CDL-A-001234',
                fullName: 'Jane Doe',
                phone: '+1-555-0101',
                email: 'jane.doe@fleetflow.io',
                licenseExpiryDate: futureExpiry,
                licenseClass: 'CDL-A',
                status: DriverStatus.ON_DUTY,
                safetyScore: 100,
            },
        }),
        prisma.driver.upsert({
            where: { licenseNumber: 'CDL-B-005678' },
            update: {},
            create: {
                licenseNumber: 'CDL-B-005678',
                fullName: 'Marcus Rivera',
                phone: '+1-555-0202',
                email: 'marcus.rivera@fleetflow.io',
                licenseExpiryDate: expiringExpiry, // ⚠️ Expiring soon — will appear in dashboard alerts
                licenseClass: 'CDL-B',
                status: DriverStatus.OFF_DUTY,
                safetyScore: 88,
            },
        }),
    ]);
    console.log(`  ✅  ${drivers.length} drivers seeded.`);

    console.log('\n🎉  FleetFlow seed completed successfully!');
    console.log('\n📋  Seed credentials (all roles use same password):');
    console.log('    Password: FleetFlow@2025');
    console.log('    ┌──────────────────────────────────┬──────────────────┐');
    console.log('    │ Email                            │ Role             │');
    console.log('    ├──────────────────────────────────┼──────────────────┤');
    console.log('    │ superadmin@fleetflow.io          │ SUPER_ADMIN      │');
    console.log('    │ manager@fleetflow.io             │ MANAGER          │');
    console.log('    │ dispatcher@fleetflow.io          │ DISPATCHER       │');
    console.log('    │ safety@fleetflow.io              │ SAFETY_OFFICER   │');
    console.log('    │ finance@fleetflow.io             │ FINANCE_ANALYST  │');
    console.log('    └──────────────────────────────────┴──────────────────┘');
}

main()
    .catch((e) => {
        console.error('❌  Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
