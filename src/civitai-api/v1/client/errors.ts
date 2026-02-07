import type { ArkErrors } from 'arktype';

/**
 * Network request error
 */
export type NetworkError = {
  type: 'NETWORK_ERROR';
  status: number;
  code: string;
  message: string;
  originalError?: unknown;
};

/**
 * ArkType validation error
 */
export type ValidationError = {
  type: 'VALIDATION_ERROR';
  message: string;
  details: ArkErrors | any; // Allow any type for flexibility
};

/**
 * 400 Bad Request error (usually caused by incorrect query parameters)
 */
export type BadRequestError = {
  type: 'BAD_REQUEST';
  status: 400;
  message: string;
  details: any; // Zod error details
};

/**
 * 401 Unauthorized error (missing or invalid HTTP Auth Header)
 */
export type UnauthorizedError = {
  type: 'UNAUTHORIZED';
  status: 401;
  message: string;
  details?: { suggestion?: string };
};

/**
 * 404 Not Found error (resource does not exist)
 */
export type NotFoundError = {
  type: 'NOT_FOUND';
  status: 404;
  message: string;
  details?: any;
};

/**
 * All possible error types for Civitai API
 */
export type CivitaiError = NetworkError | ValidationError | BadRequestError | UnauthorizedError | NotFoundError;

/**
 * Create network error
 */
export const createNetworkError = (
  status: number,
  code: string,
  message: string,
  originalError?: unknown
): NetworkError => ({
  type: 'NETWORK_ERROR',
  status,
  code,
  message,
  originalError,
});

/**
 * Create validation error
 */
export const createValidationError = (
  message: string,
  details: ArkErrors | any
): ValidationError => ({
  type: 'VALIDATION_ERROR',
  message,
  details,
});

/**
 * Create Bad Request error
 */
export const createBadRequestError = (
  message: string,
  details: any
): BadRequestError => ({
  type: 'BAD_REQUEST',
  status: 400,
  message,
  details,
});

/**
 * Create Unauthorized error
 */
export const createUnauthorizedError = (
  message: string,
  details?: { suggestion?: string }
): UnauthorizedError => ({
  type: 'UNAUTHORIZED',
  status: 401,
  message,
  details,
});

/**
 * Create Not Found error
 */
export const createNotFoundError = (
  message: string,
  details?: any
): NotFoundError => ({
  type: 'NOT_FOUND',
  status: 404,
  message,
  details,
});

/**
 * Check error type
 */
export const isNetworkError = (error: CivitaiError): error is NetworkError =>
  error.type === 'NETWORK_ERROR';

export const isValidationError = (error: CivitaiError): error is ValidationError =>
  error.type === 'VALIDATION_ERROR';

export const isBadRequestError = (error: CivitaiError): error is BadRequestError =>
  error.type === 'BAD_REQUEST';

export const isUnauthorizedError = (error: CivitaiError): error is UnauthorizedError =>
  error.type === 'UNAUTHORIZED';

export const isNotFoundError = (error: CivitaiError): error is NotFoundError =>
  error.type === 'NOT_FOUND';
