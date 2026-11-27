import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

function secret(name: string, developmentFallback: string): string {
  const value = process.env[name];
  const isPlaceholder = !value || value === developmentFallback || /change[_ -]?this/i.test(value);
  if (nodeEnv === 'production' && (isPlaceholder || (value?.length ?? 0) < 32)) {
    throw new Error(`${name} must be a unique value of at least 32 characters in production`);
  }
  return value || developmentFallback;
}

export const env = {
  nodeEnv,
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: secret('JWT_SECRET', 'dev_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRefreshSecret: secret('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  companyName: process.env.COMPANY_NAME || 'Horizon360',
  companyCurrency: process.env.COMPANY_CURRENCY || 'FCFA',
};
