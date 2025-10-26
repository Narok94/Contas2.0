import * as React from 'react';

const AccountCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg shadow-md p-4 border-l-4 border-gray-200 dark:border-dark-surface-light bg-surface dark:bg-dark-surface animate-skeleton-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-6 w-3/5 bg-gray-200 dark:bg-dark-surface-light rounded-md"></div>
        <div className="h-5 w-12 bg-gray-200 dark:bg-dark-surface-light rounded-full"></div>
      </div>
      <div className="h-7 w-2/5 bg-gray-200 dark:bg-dark-surface-light rounded-md mt-2"></div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-4/5 bg-gray-200 dark:bg-dark-surface-light rounded-md"></div>
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-dark-surface-light rounded-md"></div>
      </div>
       <div className="flex justify-end space-x-2 mt-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-dark-surface-light rounded-full"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-dark-surface-light rounded-full"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-dark-surface-light rounded-full"></div>
        </div>
    </div>
  );
};

export default AccountCardSkeleton;