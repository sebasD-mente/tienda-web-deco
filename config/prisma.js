/**
 * config/prisma.js
 * Centralized PrismaClient Singleton with Controlled Connection Pool & Timeouts.
 * Deco Vintage Guate — Architecture Hardening (Phase 2)
 */

import { PrismaClient } from '@prisma/client';

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {
  // Ignored if .env is already loaded or process.loadEnvFile fails
}

function buildPrismaClient() {
  const rawUrl = process.env.DATABASE_URL;
  let datasourceUrl = rawUrl;

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (!parsed.searchParams.has('connection_limit')) {
        parsed.searchParams.set('connection_limit', '10');
      }
      if (!parsed.searchParams.has('statement_timeout')) {
        parsed.searchParams.set('statement_timeout', '10000');
      }
      if (!parsed.searchParams.has('pool_timeout')) {
        parsed.searchParams.set('pool_timeout', '20');
      }
      if (!parsed.searchParams.has('connect_timeout')) {
        parsed.searchParams.set('connect_timeout', '15');
      }
      datasourceUrl = parsed.toString();
    } catch (err) {
      console.warn('[Prisma Config] Warning: Failed to parse DATABASE_URL to inject pooling parameters:', err.message);
    }
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: datasourceUrl,
      },
    },
    log: process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'],
  });

  return client;
}

// Global singleton pattern to prevent multi-instance allocation
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || buildPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
