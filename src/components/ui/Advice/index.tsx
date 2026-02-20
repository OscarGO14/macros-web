import { MdInfo } from 'react-icons/md';

export const Advice = ({ information }: { information: string }) => {
  return (
    <div className="flex bg-accent w-full rounded-lg justify-center items-center min-h-24">
      <div className="flex items-start pl-1 py-1 h-full">
        <MdInfo size={18} color="black" />
      </div>
      <p className="flex-1 text-secondary text-base text-left p-4">{information}</p>
    </div>
  );
};
