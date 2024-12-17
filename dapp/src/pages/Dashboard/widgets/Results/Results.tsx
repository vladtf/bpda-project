
import { useState } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { API_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';

export const Results = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [results, setResults] = useState<any>(null);

  const fetchResults = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.get('/results', {
        params: { electionId },
        baseURL: API_URL
      });
      setResults(res.data);
      console.log('Election results:', res.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={fetchResults} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Election ID</Label>
          <input
            type='text'
            value={electionId}
            onChange={(e) => setElectionId(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <Button type='submit' className='mt-4 bg-purple-500 text-white p-2 rounded-md hover:bg-purple-600'>
          Fetch Results
        </Button>
      </form>
      <OutputContainer>
        {results && (
          <div className='rounded-md'>
            <h3 className='font-semibold mb-2'>Election Results</h3>
            <pre>{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </OutputContainer>
    </div>
  );
};