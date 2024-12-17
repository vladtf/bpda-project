
import { useState } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { API_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';

export const RegisterElection = ({ callbackRoute }: WidgetProps) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(10);
  const [admin, setAdmin] = useState<string>('');
  const [fee, setFee] = useState<string>('');
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/register_election', {
        name,
        description,
        start_time: startTime,
        end_time: endTime,
        threshold,
        admin,
        fee
      }, {
        baseURL: API_URL
      });
      setResponse(res.data);
      console.log('Election registered:', res.data);
    } catch (error) {
      console.error('Error registering election:', error);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Election Name</Label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Start Time</Label>
          <input
            type='datetime-local'
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>End Time</Label>
          <input
            type='datetime-local'
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Threshold</Label>
          <input
            type='number'
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Admin Address</Label>
          <input
            type='text'
            value={admin}
            onChange={(e) => setAdmin(e.target.value)}
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
          Register Election
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