import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { ElectionData, ElectionType, useSendElectionTransaction } from 'hooks';
import { SessionEnum } from 'localConstants';

export const SubmitCandidacy = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [feePaid, setFeePaid] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [electionFee, setElectionFee] = useState<string>('');
  const [electionDetails, setElectionDetails] = useState<ElectionData | null>(null);
  const [isElectionStarted, setIsElectionStarted] = useState<boolean>(false);

  const {
    getElectionIdList,
    getCandidateFee,
    getElectionList,
    submitCandidancy,
    getElectionData
  } = useSendElectionTransaction({
    type: SessionEnum.abiPingPongSessionId
  });

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const electionList = await getElectionIdList()
        console.log('Election List:', electionList);
        setElections(electionList);
      } catch (error) {
        console.error('Error fetching elections:', error);
      }
    };

    const fetchElectionFee = async () => {
      try {
        const electionFeeRes = await getCandidateFee();
        console.log('Election Fee:', electionFeeRes);
        setElectionFee(electionFeeRes);
      } catch (error) {
        console.error('Error fetching election fee:', error);
      }
    };

    fetchElections();
    fetchElectionFee();
  }, []);

  useEffect(() => {
    const fetchElectionDetails = async () => {
      if (electionId) {
        try {
          const details = await getElectionData({ electionId });
          console.log('Election Details:', details);
          setElectionDetails(details);
          setIsElectionStarted(Date.now() >= details.start_time);
        } catch (error) {
          console.error('Error fetching election details:', error);
        }
      } else {
        setElectionDetails(null);
        setIsElectionStarted(false);
      }
    };

    fetchElectionDetails();
  }, [electionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      await submitCandidancy({
        electionId,
        name,
        description,
        fee: electionFee
      });

      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error registering candidate');
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
              <option key={election} value={election}>
                {election}
              </option>
            ))}
          </select>
        </div>
        {electionDetails && (
          <div className='flex flex-col gap-2'>
            <Label className='font-semibold'>Election Details</Label>
            <div className='p-2 border border-gray-300 rounded-md'>
              <p><strong>Name:</strong> {electionDetails.name}</p>
              <p><strong>Description:</strong> {electionDetails.description}</p>
              <p><strong>Start Time:</strong> {new Date(electionDetails.start_time).toLocaleString()}</p>
              <p><strong>End Time:</strong> {new Date(electionDetails.end_time).toLocaleString()}</p>
              <p><strong>Type:</strong> {electionDetails.election_type}</p>
              <p><strong>Ended:</strong> {electionDetails.ended ? 'Yes' : 'No'}</p>
              <p><strong>Admin:</strong> {electionDetails.admin}</p>
              {isElectionStarted && (
                <p className='text-orange-500'><strong>Note:</strong> This election has already started.</p>
              )}
            </div>
          </div>
        )}
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
          <Label className='font-semibold'>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex items-center gap-2'>
          <input
            type='checkbox'
            id='feePaid'
            checked={feePaid}
            onChange={(e) => setFeePaid(e.target.checked)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
          <Label className='font-semibold cursor-pointer'>
            I agree to pay the fee of {electionFee}
          </Label>
        </div>
        <Button
          type='submit'
          className={`mt-4 p-2 rounded-md ${isElectionStarted ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          disabled={isElectionStarted}
        >
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