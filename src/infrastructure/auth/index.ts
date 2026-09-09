/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTH LAYER — Barrel Export
 * ═══════════════════════════════════════════════════════════════════════════
 * Tầng quản lý xác thực tập trung cho toàn bộ Framework:
 * - BaseAuthProvider (Abstract Template Method)
 * - NekoAuthProvider (JWT / Zustand cho Neko Coffee)
 * - CMSAuthProvider (Cookie-based session cho CMS)
 * - Auth utilities: jwt.utils, storage-state.utils, auth.types
 */

export * from './auth.types';
export * from './jwt.utils';
export * from './storage-state.utils';
export * from './BaseAuthProvider';
export * from './cms/CMSAuthProvider';
export * from './neko/NekoAuthProvider';
