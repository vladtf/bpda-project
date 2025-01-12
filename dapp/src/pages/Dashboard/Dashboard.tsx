import { AuthRedirectWrapper } from 'wrappers';
import {
  RegisterElection,
  RegisterCandidate,
  Vote,
  EndElection,
  Results,
  Dispute,
  ResolveDispute,
  Explorer,
  SubmitCandidacy,
  RegisterVoter,
  Transactions
} from './widgets';
import { useScrollToElement } from 'hooks';
import { Widget } from './components';
import { WidgetType } from 'types/widget.types';

const WIDGETS: WidgetType[] = [
  {
    title: 'Register Election',
    widget: RegisterElection,
    description: 'Register a new election',
    reference: 'https://yourdocs.com/register-election',
    anchor: 'register-election',
    role: 'admin',
    step: 1
  },
  {
    title: 'Submit Candidacy',
    widget: SubmitCandidacy,
    description: 'Submit your candidacy for an election',
    reference: 'https://yourdocs.com/submit-candidacy',
    anchor: 'submit-candidacy',
    role: 'voter',
    step: 2
  },
  {
    title: 'Register Candidate',
    widget: RegisterCandidate,
    description: 'Register a new candidate for an election',
    reference: 'https://yourdocs.com/register-candidate',
    anchor: 'register-candidate',
    role: 'admin',
    step: 2
  },
  {
    title: 'Register Voter',
    widget: RegisterVoter,
    description: 'Register a voter or self to an election',
    reference: 'https://yourdocs.com/register-voter',
    anchor: 'register-voter',
    role: 'voter',
    step: 2
  },
  {
    title: 'Vote',
    widget: Vote,
    description: 'Cast your vote in an election',
    reference: 'https://yourdocs.com/vote',
    anchor: 'vote',
    role: 'voter',
    step: 3
  },
  {
    title: 'End Election',
    widget: EndElection,
    description: 'End an ongoing election',
    reference: 'https://yourdocs.com/end-election',
    anchor: 'end-election',
    role: 'admin',
    step: 4
  },
  {
    title: 'Results',
    widget: Results,
    description: 'View election results',
    reference: 'https://yourdocs.com/results',
    anchor: 'results',
    role: 'voter',
    step: 4
  },
  {
    title: 'Dispute',
    widget: Dispute,
    description: 'File a dispute for an election',
    reference: 'https://yourdocs.com/dispute',
    anchor: 'dispute',
    role: 'voter',
    step: 5
  },
  {
    title: 'Resolve Dispute',
    widget: ResolveDispute,
    description: 'Resolve an existing dispute',
    reference: 'https://yourdocs.com/resolve-dispute',
    anchor: 'resolve-dispute',
    role: 'admin',
    step: 5
  },
  {
    title: 'Explorer',
    widget: Explorer,
    description: 'Explore all items from the smart contract',
    reference: 'https://yourdocs.com/explorer',
    anchor: 'explorer',
    role: 'admin',
    step: 6
  },
  {
    title: 'Transactions',
    widget: Transactions,
    description: 'Explore all transactions from the smart contract',
    reference: 'https://yourdocs.com/explorer',
    anchor: 'explorer',
    role: 'admin',
    step: 6
  }
];

export const Dashboard = () => {
  useScrollToElement();

  return (
    <AuthRedirectWrapper>
      <div className='flex justify-center'>
        <div className='flex flex-col gap-6 max-w-3xl w-full p-4'>
          {WIDGETS.map((element) => (
            <div key={element.title}>
              <div className='text-gray-500 text-sm'>
                Role: {element.role}, Step: {element.step}
              </div>
              <Widget {...element} />
            </div>
          ))}
        </div>
        <nav className='p-4 fixed right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-lg mr-4'>
          <ul className='space-y-2 max-h-192 overflow-y-auto'>
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
