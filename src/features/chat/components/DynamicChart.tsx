import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const DynamicChart = ({ config, index }: { config: any, index: number }) => {
  if (!config) return null;

  let finalLabels = config.labels || [];
  let finalDatasets = config.datasets || [];

  if (finalLabels.length === 0 && config.data && config.xKey && config.yKey) {
    finalLabels = config.data.map((d: any) => String(d[config.xKey]));
    finalDatasets = [{
      label: config.yKey,
      data: config.data.map((d: any) => {
        const val = d[config.yKey];
        return typeof val === 'number' ? val : parseFloat(val) || 0;
      })
    }];
  }

  if (finalLabels.length === 0 || finalDatasets.length === 0) return null;

  const data = finalLabels.map((label: string, i: number) => {
    const dataObj: any = { name: label };
    finalDatasets.forEach((ds: any, dsIdx: number) => {
      dataObj[`value${dsIdx}`] = ds.data[i];
    });
    return dataObj;
  });

  const activeDatasets = finalDatasets;

  return (
    <div className="border border-[var(--border)] shadow-sm bg-[var(--surface)] rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 pb-2 border-b border-[var(--border)]">
        <h3 className="font-bold text-sm text-[var(--text-primary)]">{config.title || 'Chart'}</h3>
        {config.description && <p className="text-xs text-[var(--text-secondary)] mt-1">{config.description}</p>}
      </div>
      <div className="p-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {config.chart_type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" fontSize={10} tick={{ fill: 'var(--text-secondary)' }} />
              <YAxis fontSize={10} tick={{ fill: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }} />
              {activeDatasets.map((ds: any, dsIdx: number) => (
                <Line key={dsIdx} type="monotone" dataKey={`value${dsIdx}`} stroke={COLORS[dsIdx % COLORS.length]} name={ds.label || `Dataset ${dsIdx + 1}`} />
              ))}
            </LineChart>
          ) : config.chart_type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey="value0" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {data.map((entry: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }} />
            </PieChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" fontSize={10} tick={{ fill: 'var(--text-secondary)' }} />
              <YAxis fontSize={10} tick={{ fill: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }} />
              {activeDatasets.map((ds: any, dsIdx: number) => (
                <Bar key={dsIdx} dataKey={`value${dsIdx}`} fill={COLORS[dsIdx % COLORS.length]} name={ds.label || `Dataset ${dsIdx + 1}`} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
