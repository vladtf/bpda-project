import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { API_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { useGetAccountInfo, useSendPingPongTransaction } from 'hooks';
import { SessionEnum } from 'localConstants';

export const EndElection = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { address: adminAddress } = useGetAccountInfo();
  const [selectedElection, setSelectedElection] = useState<any>(null);


  const {
    getElectionIdList,
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

  const handleEndElection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      const res = await axios.post('/end_election', { electionId, admin: adminAddress }, { baseURL: API_URL });
      setResponse(res.data);
      console.log('Election ended:', res.data);
    } catch (error: any) {
      console.error('Error ending election:', error);
      setError(error.response?.data?.error || 'Failed to end election. Please try again.');
    }
  };

  const handleElectionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setElectionId(selectedId);
    try {
      const res = await axios.get(`/elections/${selectedId}`, { baseURL: API_URL });

      setSelectedElection(res.data.election);
    } catch (error) {
      console.error('Error fetching election data:', error);
      setError(error.response?.data?.error || 'Failed to fetch election data. Please try again.');
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleEndElection} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Election ID</Label>
          <select
            value={electionId}
            onChange={handleElectionChange}
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
        {selectedElection && (
          <div className='rounded-md'>
            <h3 className='font-semibold mb-2'>Election Details</h3>
            <pre>{JSON.stringify(selectedElection, null, 2)}</pre>
          </div>
        )}
        <Button type='submit' className='mt-4 bg-red-500 text-white p-2 rounded-md hover:bg-red-600'>
          End Election
        </Button>
      </form>
      <OutputContainer>
        {response && (
          <div className='rounded-md'>
            <h3 className='font-semibold mb-2'>Response</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
            <p>Unresolved Disputes: {response.unresolved_disputes}</p>
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