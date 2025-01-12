import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { useSendPingPongTransaction } from 'hooks';
import { SessionEnum } from 'localConstants';

export const EndElection = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    getElectionIdList,
    endElection
  } = useSendPingPongTransaction({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      await endElection({
        electionId
      });
      setResponse('Sent end election transaction');
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error ending election');
      console.error('Error ending election:', error);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
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
        <Button type='submit' className='mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600'>
          End Election
        </Button>
      </form>
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