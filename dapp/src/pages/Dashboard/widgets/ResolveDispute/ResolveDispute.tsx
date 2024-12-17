
import { useState } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { API_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';

export const ResolveDispute = ({ callbackRoute }: WidgetProps) => {
  const [disputeId, setDisputeId] = useState<string>('');
  const [valid, setValid] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/resolve_dispute', {
        disputeId,
        valid
      }, { baseURL: API_URL });
      setResponse(res.data);
      console.log('Dispute resolved:', res.data);
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleResolve} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Dispute ID</Label>
          <input
            type='text'
            value={disputeId}
            onChange={(e) => setDisputeId(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
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