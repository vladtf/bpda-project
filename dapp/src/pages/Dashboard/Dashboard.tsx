import { contractAddress } from 'config';
import { AuthRedirectWrapper } from 'wrappers';
import {
  Account,
  PingPongAbi,
  SignMessage,
  NativeAuth,
  BatchTransactions,
  PingPongService,
  Transactions
} from './widgets';
import { useScrollToElement } from 'hooks';
import { Widget } from './components';
import { WidgetType } from 'types/widget.types';
import { EligibilityCheck } from './widgets/EligibilityCheck';

const WIDGETS: WidgetType[] = [
  {
    title: 'Account (Connected)',
    widget: Account,
    description: 'Connected account details',
    reference: 'https://docs.multiversx.com/sdk-and-tools/sdk-dapp/#account'
  },
  {
    title: 'Eligibility Check',
    widget: EligibilityCheck,
    description:
      'Eligibility check for the connected account to interact with the Smart Contract',
    reference: 'https://github.com/multiversx/mx-ping-pong-service',
    anchor: 'ping-pong-backend'
  },
  {
    title: 'Ping & Pong (ABI)',
    widget: PingPongAbi,
    description:
      'Smart Contract interactions using the ABI generated transactions',
    reference:
      'https://docs.multiversx.com/sdk-and-tools/sdk-js/sdk-js-cookbook/#using-interaction-when-the-abi-is-available',
    anchor: 'ping-pong-abi'
  },
  {
    title: 'Ping & Pong (Backend)',
    widget: PingPongService,
    description:
      'Smart Contract interactions using the backend generated transactions',
    reference: 'https://github.com/multiversx/mx-ping-pong-service',
    anchor: 'ping-pong-backend'
  },
  {
    title: 'Sign message',
    widget: SignMessage,
    description: 'Message signing using the connected account',
    reference: 'https://docs.multiversx.com/sdk-and-tools/sdk-dapp/#account-1',
    anchor: 'sign-message'
  },
  {
    title: 'Native auth',
    widget: NativeAuth,
    description:
      'A secure authentication token can be used to interact with the backend',
    reference: 'https://github.com/multiversx/mx-sdk-js-native-auth-server'
  },
  {
    title: 'Batch Transactions',
    widget: BatchTransactions,
    description:
      'For complex scenarios transactions can be sent in the desired group/sequence',
    reference:
      'https://github.com/multiversx/mx-sdk-dapp#sending-transactions-synchronously-in-batches',
    anchor: 'batch-transactions'
  },
  {
    title: 'Transactions (All)',
    widget: Transactions,
    description: 'List transactions for the connected account',
    reference:
      'https://api.elrond.com/#/accounts/AccountController_getAccountTransactions'
  },
  {
    title: 'Transactions (Ping & Pong)',
    widget: Transactions,
    props: { receiver: contractAddress },
    description: 'List transactions filtered for a given Smart Contract',
    reference:
      'https://api.elrond.com/#/accounts/AccountController_getAccountTransactions'
  }
];

export const Dashboard = () => {
  useScrollToElement();

  return (
    <AuthRedirectWrapper>
      <div className='flex justify-center'>
        <div className='flex flex-col gap-6 max-w-3xl w-3/4'>
          {WIDGETS.map((element) => (
            <Widget key={element.title} {...element} />
          ))}
        </div>
        <nav className='p-4 fixed right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-lg mr-4'>
          <ul className='space-y-2 max-h-96 overflow-y-auto'>
            {WIDGETS.map((element) => (
              <li key={element.title} className='hover:bg-gray-200 p-2 rounded'>
                <a href={`#${element.anchor || element.title.replace(/\s+/g, '-').toLowerCase()}`} className='text-blue-500 text-sm underline'>
                  {element.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </AuthRedirectWrapper>
  );
};
