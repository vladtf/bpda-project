import { EnvironmentsEnum } from 'types';

export * from './sharedConfig';

export const contractAddress =
  'erd1qqqqqqqqqqqqqpgq39y2fxfn72ew5ct0rgn4utaqtcnh9u49ua2ssqz2sd';
export const GATEWAY_URL = 'https://devnet-api.multiversx.com';
// export const GATEWAY_URL = 'http://localhost:5000';

export const sampleAuthenticatedDomains = [GATEWAY_URL];
export const environment = EnvironmentsEnum.devnet;
