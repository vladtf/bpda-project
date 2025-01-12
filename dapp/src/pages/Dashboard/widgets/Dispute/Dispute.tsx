import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { GATEWAY_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { useSendElectionTransaction } from 'hooks';
import { SessionEnum } from 'localConstants';

export const Dispute = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<string[]>([]);

  const {
    getElectionIdList,
  } = useSendElectionTransaction({
    type: SessionEnum.abiPingPongSessionId
  });

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setElections(await getElectionIdList());
      } catch (error) {
        console.error('Error fetching elections:', error);
      }
    };

    fetchElections();
  }, []);

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/dispute', {
        electionId,
        reason
      }, { baseURL: GATEWAY_URL });
      setResponse(res.data);
      console.log('Dispute filed:', res.data);
    } catch (error) {
      console.error('Error filing dispute:', error);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleDispute} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
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
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Reason for Dispute</Label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <Button type='submit' className='mt-4 bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600'>
          File Dispute
        </Button>
      </form>
      <OutputContainer>
        {response && (
          <div className='rounded-md'>
            <h3 className='font-semibold mb-2'>Response</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </OutputContainer>
    </div>
  );
};