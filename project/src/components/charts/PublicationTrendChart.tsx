import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PublicationTrendChartProps {
  data: Array<{ year: number; count: number }>;
  title?: string;
}

const PublicationTrendChart: React.FC<PublicationTrendChartProps> = ({ data, title }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      {title && <h3 className="text-xl font-semibold text-gray-100 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="year" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
            labelStyle={{ color: '#f3f4f6' }}
            itemStyle={{ color: '#60a5fa' }}
          />
          <Legend wrapperStyle={{ color: '#9ca3af' }} />
          <Bar dataKey="count" fill="#2563eb" name="Publications" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PublicationTrendChart;
