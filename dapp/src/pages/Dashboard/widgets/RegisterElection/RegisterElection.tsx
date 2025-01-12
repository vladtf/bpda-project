import { useState } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { useGetAccountInfo, useSendElectionTransaction } from 'hooks';
import { SessionEnum } from 'localConstants';

export const RegisterElection = ({ callbackRoute }: WidgetProps) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [response, setResponse] = useState<any>(null);

  const {
    registerElection
  } = useSendElectionTransaction({
    type: SessionEnum.abiElectionSessionId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await registerElection({
        name,
        description,
        start_time: new Date(startTime).getTime(),
        end_time: new Date(endTime).getTime() ,
      });

      setResponse(res);
      console.log('Election registered:', res);
    } catch (error) {
      console.error('Error registering election:', error);
    }
  };

  const setPredefinedPeriod = (days: number) => {
    const now = new Date();
    const start = now.toISOString().slice(0, 16);
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    setStartTime(start);
    setEndTime(end);
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
        <div className='flex flex-col gap-2'>
          <Label>Election Name</Label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label>Start Time</Label>
          <input
            type='datetime-local'
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label>End Time</Label>
          <input
            type='datetime-local'
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-row gap-2'>
          <Button type='button' onClick={() => setPredefinedPeriod(3)} className='bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600'>
            1 Day
          </Button>          <Button type='button' onClick={() => setPredefinedPeriod(3)} className='bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600'>
            3 Days
          </Button>
          <Button type='button' onClick={() => setPredefinedPeriod(5)} className='bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600'>
            5 Days
          </Button>
          <Button type='button' onClick={() => setPredefinedPeriod(7)} className='bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600'>
            7 Days
          </Button>
          <Button type='button' onClick={() => setPredefinedPeriod(14)} className='bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600'>
            14 Days
          </Button>
          <Button type='button' onClick={() => setPredefinedPeriod(21)} className='bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600'>
            21 Days
          </Button>
        </div>
        {/* <div className='flex flex-col gap-2'>
          <Label>Sign Threshold</Label>
          <input
            type='number'
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div> */}
        {/* <div className='flex flex-col gap-2'>
          <Label>Fee</Label>
          <input
            type='number'
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div> */}
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