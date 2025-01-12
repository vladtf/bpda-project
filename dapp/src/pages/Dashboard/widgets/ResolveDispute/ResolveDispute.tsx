import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { GATEWAY_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { useSendElectionTransaction } from 'hooks';
import { SessionEnum } from 'localConstants';

export const ResolveDispute = ({ callbackRoute }: WidgetProps) => {
  const [disputeId, setDisputeId] = useState<string>('');
  const [valid, setValid] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [elections, setElections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [electionId, setElectionId] = useState<string>('');

  const {
    getElectionIdList,
    getDisputeIDList,
  } = useSendElectionTransaction({
    type: SessionEnum.abiElectionSessionId
  });

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const electionList = await getElectionIdList();
        setElections(electionList);
      } catch (error) {
        console.error('Error fetching elections:', error);
      }
    };

    fetchElections();
  }, []);

  useEffect(() => {
    const fetchDisputes = async () => {
      if (electionId) {
        try {
          setDisputes(await getDisputeIDList(electionId));
        } catch (error) {
          console.error('Error fetching disputes:', error);
          setError(error.response?.data?.error || 'Failed to fetch disputes. Please try again.');
        }
      }
    };

    fetchDisputes();
  }, [electionId]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      const res = await axios.post('/resolve_dispute', {
        disputeId,
        valid
      }, { baseURL: GATEWAY_URL });
      setResponse(res.data);
      console.log('Dispute resolved:', res.data);
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      setError(error.response?.data?.error || 'Failed to resolve dispute. Please try again.');
    }
  };

  const handleDisputeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setDisputeId(selectedId);
    const dispute = disputes.find(d => d.id === selectedId);
    setSelectedDispute(dispute);
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleResolve} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Election ID</Label>
          <select
            value={electionId}
            onChange={(e) => setElectionId(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          >
            <option value=''>Select Election</option>
            {elections.map((election) => (
              <option key={election} value={election}>
                {election}
              </option>
            ))}
          </select>
        </div>
        {electionId && (
          <>
            <div className='flex flex-col gap-2'>
              <Label className='font-semibold'>Dispute ID</Label>
              <select
                value={disputeId}
                onChange={handleDisputeChange}
                className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                required
              >
                <option value=''>Select Dispute</option>
                {disputes.map((dispute) => (
                  <option key={dispute.id} value={dispute.id}>
                    {dispute.id}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-center gap-2'>
              <Label className='font-semibold'>Is the dispute valid?</Label>
              <input
                type='checkbox'
                checked={valid}
                onChange={(e) => setValid(e.target.checked)}
                className='h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded'
              />
            </div>
            <Button type='submit' className='mt-4 bg-teal-500 text-white p-2 rounded-md hover:bg-teal-600'>
              Resolve Dispute
            </Button>
          </>
        )}
      </form>
      {selectedDispute && (
        <div className='mt-4 p-4 bg-gray-100 rounded-md'>
          <h4 className='font-semibold'>Dispute Details</h4>
          <p><strong>Reason:</strong> {selectedDispute.reason}</p>
          <p><strong>Resolved:</strong> {selectedDispute.resolved ? 'Yes' : 'No'}</p>
          <p><strong>Result Adjusted:</strong> {selectedDispute.result_adjusted ? 'Yes' : 'No'}</p>
        </div>
      )}
      <OutputContainer>
        {response && (
          <div className='rounded-md'>
            <h3 className='font-semibold mb-2'>Response</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
        {error && (
          <div className='rounded-md text-red-500'>
            <h3 className='font-semibold mb-2'>Error</h3>
            <p>{error}</p>
          </div>
        )}
      </OutputContainer>
    </div>
  );
};