import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { GATEWAY_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { SessionEnum } from 'localConstants';
import { Candidate, useSendElectionTransaction } from 'hooks';

export const Results = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [elections, setElections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { getElectionResults, getElectionIdList } = useSendElectionTransaction({ type: SessionEnum.abiElectionSessionId });

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

  useEffect(() => {
    const fetchElectionResults = async () => {
      if (!electionId) return;
      try {
        const res = await getElectionResults({ electionId });
        setCandidate(res);
      } catch (error: any) {
        console.error('Error fetching results:', error);
        setError(error.response?.data?.error || 'Failed to fetch results. Please try again.');
      }
    }
    fetchElectionResults();
  }, [electionId, getElectionResults]);

  const fetchResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      const res = await axios.get('/results', {
        params: { electionId },
        baseURL: GATEWAY_URL
      });
      const sortedResults = res.data.results.sort((a: any, b: any) => b.total_rating - a.total_rating);
      setCandidate({ ...res.data, results: sortedResults });
      console.log('Election results:', sortedResults);
    } catch (error: any) {
      console.error('Error fetching results:', error);
      setError(error.response?.data?.error || 'Failed to fetch results. Please try again.');
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={fetchResults} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
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
        <Button type='submit' className='mt-4 bg-purple-500 text-white p-2 rounded-md hover:bg-purple-600'>
          Fetch Results
        </Button>
      </form>
      <OutputContainer>
        {candidate && (
          <div className='rounded-md'>
            <h3 className='font-semibold mb-2'>Election Results</h3>
            <pre>{JSON.stringify(candidate, null, 2)}</pre>
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