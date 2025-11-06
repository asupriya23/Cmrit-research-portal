import React from 'react';
import Leaderboard from '../components/Leaderboard';

const LeaderboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Research Leaderboard
          </h1>
          <p className="text-xl text-gray-400">
            Recognizing excellence in research and academic achievement
          </p>
        </div>
        
        <Leaderboard limit={10} />
      </div>
    </div>
  );
};

export default LeaderboardPage;
