import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TopicDistributionChartProps {
  data: Array<{ topic: string; count: number }>;
  title?: string;
}

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#6366f1', '#14b8a6', '#a855f7'];

const TopicDistributionChart: React.FC<TopicDistributionChartProps> = ({ data, title }) => {
  // Transform data for pie chart
  const chartData = data.map(item => ({
    name: item.topic.charAt(0).toUpperCase() + item.topic.slice(1),
    value: item.count
  }));

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      {title && <h3 className="text-xl font-semibold text-gray-100 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
            itemStyle={{ color: '#f3f4f6' }}
          />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopicDistributionChart;
