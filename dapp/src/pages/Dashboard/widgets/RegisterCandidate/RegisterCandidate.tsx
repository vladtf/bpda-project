import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { API_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';

export const RegisterCandidate = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [manifesto, setManifesto] = useState<string>('');
  const [fee, setFee] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<any[]>([]);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await axios.get('/elections', { baseURL: API_URL });
        setElections(res.data.elections);
      } catch (error) {
        console.error('Error fetching elections:', error);
      }
    };

    fetchElections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/register_candidate', {
        electionId,
        name,
        manifesto,
        fee
      }, {
        baseURL: API_URL
      });
      setResponse(res.data);
      console.log('Candidate registered:', res.data);
    } catch (error) {
      console.error('Error registering candidate:', error);
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
              <option key={election.id} value={election.id}>
                {election.name}
              </option>
            ))}
          </select>
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Candidate Name</Label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Manifesto</Label>
          <textarea
            value={manifesto}
            onChange={(e) => setManifesto(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Fee</Label>
          <input
            type='text'
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <Button type='submit' className='mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600'>
          Register Candidate
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