import { EnvironmentsEnum } from 'types';

export * from './sharedConfig';

export const contractAddress =
  'erd1qqqqqqqqqqqqqpgq8tq5rulzxzje29v8kzmcxx9pgx6kmevmep6qckwthl';
export const GATEWAY_URL = 'https://testnet-template-api.multiversx.com';
export const sampleAuthenticatedDomains = [GATEWAY_URL];
export const environment = EnvironmentsEnum.testnet;
