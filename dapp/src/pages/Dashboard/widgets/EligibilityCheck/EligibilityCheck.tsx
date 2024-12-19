import { useEffect, useState } from 'react';
import { API_URL } from 'config';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import { MissingNativeAuthError } from 'components/MissingNativeAuthError';
import { useGetLoginInfo, useGetAccountInfo } from 'hooks/sdkDappHooks';
import { WidgetProps } from 'types';
import axios from 'axios';
import { ContractAddress, OutputContainer } from 'components';

export const EligibilityCheck = ({ callbackRoute }: WidgetProps) => {
  const [fullName, setFullName] = useState<string>('John Doe');
  const [birthdate, setBirthdate] = useState<string>('1990-01-01');
  const [phoneNumber, setPhoneNumber] = useState<string>('1234567890');
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { tokenLogin } = useGetLoginInfo();
  const { address: voterAddress } = useGetAccountInfo();

  const checkUserEligibility = async () => {
    setError(null); // Reset error state
    try {
      const response = await axios.post('/eligibility_check', {
        id_info: {
          fullName,
          birthdate,
          phoneNumber
        },
        voter_address: voterAddress
      },
        {
          baseURL: API_URL
        });
      setEligibilityResult(response.data);
      console.log('Eligibility response:', response.data);
    } catch (error: any) {
      console.error('Error checking eligibility:', error);
      setError(error.response?.data?.error || 'Failed to check eligibility. Please try again.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkUserEligibility();
  };

  if (!tokenLogin?.nativeAuthToken) {
    return <MissingNativeAuthError />;
  }

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleFormSubmit} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Full Name</Label>
          <input
            type='text'
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Birthdate</Label>
          <input
            type='date'
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Phone Number</Label>
          <input
            type='tel'
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <Button type='submit' data-testid='btnSubmitForm' className='mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600'>
          Submit
        </Button>
      </form>

      <OutputContainer>
        {eligibilityResult && (
          <div className='rounded-md'>
            <h3 className='font-semibold mb-2'>Eligibility Result</h3>
            <pre>{JSON.stringify(eligibilityResult, null, 2)}</pre>
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
