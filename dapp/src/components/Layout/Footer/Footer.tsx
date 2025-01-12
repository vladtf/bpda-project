export const Footer = () => {
  return (
    <footer className='mx-auto w-full max-w-prose pb-6 pl-6 pr-6 text-center text-gray-400'>
      <div className='flex flex-col items-center text sm text-gray-400'>
        <a
          target='_blank'
          className='flex items-center text-sm hover:underline'
          href='https://github.com/vladtf/election-app-multiversx'
        >
          Election App on MultiversX Blockchain
          <br />
          Dapp based on Multiversx Template
        </a>
      </div>
    </footer>
  );
};
