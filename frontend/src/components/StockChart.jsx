import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StockChart = ({ data }) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-pink)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--accent-pink)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-secondary)" 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value}`}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(5, 9, 20, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
            itemStyle={{ color: 'var(--accent-pink)' }}
          />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="var(--accent-pink)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorClose)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
