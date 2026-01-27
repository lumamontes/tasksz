/**
 * Better Auth API routes - handles all auth endpoints
 */
import type { APIRoute } from 'astro';
import { auth } from '../../../auth';

export const ALL: APIRoute = async (ctx) => {
  return auth.handler(ctx.request);
};