/**
 * Astro middleware - disabled for demo mode
 */
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // No auth for demo mode - just pass through
  context.locals.user = null;
  context.locals.session = null;
  
  return next();
});