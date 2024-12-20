import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';

export const Explorer = ({ callbackRoute }: WidgetProps) => {
  const [elections, setElections] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [voters, setVoters] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [electionsRes, candidatesRes, votersRes, disputesRes] = await Promise.all([
          axios.get('/elections', { baseURL: API_URL }),
          axios.get('/candidates', { baseURL: API_URL }),
          axios.get('/voters', { baseURL: API_URL }),
          axios.get('/disputes', { baseURL: API_URL })
        ]);

        setElections(electionsRes.data.elections);
        setCandidates(candidatesRes.data.candidates);
        setVoters(votersRes.data.voters);
        setDisputes(disputesRes.data.disputes);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again.');
      }
    };

    fetchData();
  }, []);

  return (
    <div className='flex flex-col gap-6'>
      <OutputContainer>
        {error && (
          <div className='rounded-md text-red-500'>
            <h3 className='font-semibold mb-2'>Error</h3>
            <p>{error}</p>
          </div>
        )}
        <div className='rounded-md'>
          <h3 className='font-semibold mb-2'>Elections</h3>
          <pre>{JSON.stringify(elections, null, 2)}</pre>
        </div>
        <div className='rounded-md'>
          <h3 className='font-semibold mb-2'>Candidates</h3>
          <pre>{JSON.stringify(candidates, null, 2)}</pre>
        </div>
        <div className='rounded-md'>
          <h3 className='font-semibold mb-2'>Voters</h3>
          <pre>{JSON.stringify(voters, null, 2)}</pre>
        </div>
        <div className='rounded-md'>
          <h3 className='font-semibold mb-2'>Disputes</h3>
          <pre>{JSON.stringify(disputes, null, 2)}</pre>
        </div>
      </OutputContainer>
    </div>
  );
};
