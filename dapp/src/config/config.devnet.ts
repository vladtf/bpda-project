import { EnvironmentsEnum } from 'types';

export * from './sharedConfig';

export const contractAddress =
  'erd1qqqqqqqqqqqqqpgqsqkcq8wj3ac4ypuy3kp9805wpruefs3tryrsdgy4fg';
export const GATEWAY_URL = 'https://devnet-api.multiversx.com';
// export const GATEWAY_URL = 'http://localhost:5000';

export const sampleAuthenticatedDomains = [GATEWAY_URL];
export const environment = EnvironmentsEnum.devnet;
