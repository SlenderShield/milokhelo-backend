/**
 * Environment Validation Utility
 * Validates required environment variables
 */

function validateEnv(requiredVars = []) {
  const missing = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function validateEnvType(varName, expectedType) {
  const value = process.env[varName];

  if (!value) {
    return null;
  }

  switch (expectedType) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Environment variable ${varName} must be a number, got: ${value}`);
      }
      return num;

    case 'boolean':
      if (value !== 'true' && value !== 'false') {
        throw new Error(`Environment variable ${varName} must be true or false, got: ${value}`);
      }
      return value === 'true';

    case 'string':
    default:
      return value;
  }
}

export { validateEnv, validateEnvType };
