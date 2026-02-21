/**
 * FleetFlow — Socket.io Integration
 * ──────────────────────────────────
 * Manages real-time vehicle location broadcasting for Leaflet map frontend.
 *
 * Events emitted to clients:
 *   location:update          — broadcast to all connected clients (fleet map view)
 *   location:update:<id>     — targeted channel per vehicle (individual tracking)
 *
 * Clients can listen to both channels simultaneously.
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';
import { env } from '../config/env';

let ioInstance: SocketIOServer | null = null;

export interface LocationUpdatePayload {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed?: number | null;
    heading?: number | null;
    accuracy?: number | null;
    recordedAt: string;
}

/**
 * Initialize Socket.io on the given HTTP server.
 * Must be called once in server.ts before app.listen().
 */
export function setupSocketIO(server: http.Server): SocketIOServer {
    const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

    const io = new SocketIOServer(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket: Socket) => {
        console.log(`📡  Socket connected: ${socket.id}`);

        // Client can subscribe to a specific vehicle room
        socket.on('subscribe:vehicle', (vehicleId: string) => {
            socket.join(`vehicle:${vehicleId}`);
            console.log(`📡  Socket ${socket.id} subscribed to vehicle:${vehicleId}`);
        });

        socket.on('unsubscribe:vehicle', (vehicleId: string) => {
            socket.leave(`vehicle:${vehicleId}`);
        });

        socket.on('disconnect', (reason) => {
            console.log(`📡  Socket disconnected: ${socket.id} (${reason})`);
        });
    });

    ioInstance = io;
    console.log('📡  Socket.io initialized');
    return io;
}

/**
 * Returns the active Socket.io server instance.
 * Throws if called before setupSocketIO().
 */
export function getIO(): SocketIOServer {
    if (!ioInstance) {
        throw new Error('Socket.io is not initialized. Call setupSocketIO() first.');
    }
    return ioInstance;
}

/**
 * Broadcast a location update to all connected clients.
 *   - Fleet-wide channel: 'location:update'
 *   - Per-vehicle room:   'location:update' within room 'vehicle:<id>'
 *
 * Safe to call even before Socket.io is initialized (no-op).
 */
export function emitLocationUpdate(payload: LocationUpdatePayload): void {
    if (!ioInstance) return;

    // Broadcast to all clients (Leaflet map renders all vehicles)
    ioInstance.emit('location:update', payload);

    // Also broadcast to the per-vehicle room (individual tracking panels)
    ioInstance.to(`vehicle:${payload.vehicleId}`).emit('location:update', payload);
}
