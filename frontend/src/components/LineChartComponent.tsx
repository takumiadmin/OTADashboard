import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';

// Define interfaces for type safety
interface DataPoint {
  x: number | string;
  y: number;
}

interface LineChartComponentProps {
  title: string;
  data: DataPoint[];
  color?: string;
  unit?: string;
  isCategorical?: boolean;
  categories?: string[];
  xLabel?: string;
  yLabel?: string;
}

// Custom tooltip with explicit types
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string | number;
  unit?: string;
  isCategorical?: boolean;
  categories?: string[];
}

const CustomTooltip: React.FC<TooltipProps> = ({
  active,
  payload,
  label,
  unit,
  isCategorical,
  categories,
}) => {
  if (active && payload && payload.length && label !== undefined) {
    const value = payload[0].value;
    const displayValue = isCategorical
      ? (categories && categories[value]) || value
      : `${value.toFixed(2)}${unit || ''}`;
    const displayLabel = isCategorical
      ? label
      : typeof label === 'number'
      ? new Date(label).toLocaleString()
      : label;

    return (
      <div className="bg-white p-2 border border-gray-300 shadow-md rounded-md text-sm">
        <p className="text-gray-600">{displayLabel}</p>
        <p className="font-semibold text-gray-800">{displayValue}</p>
      </div>
    );
  }
  return null;
};

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  title,
  data,
  color = '#1f77b4',
  unit = '',
  isCategorical = false,
  categories = [],
  xLabel = 'Time',
  yLabel = 'Value',
}) => {
  // Format data for numerical or categorical
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      x: isCategorical ? d.x : typeof d.x === 'string' ? new Date(d.x).getTime() : d.x,
      y: d.y,
    }));
  }, [data, isCategorical]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (isCategorical) {
      return [0, categories.length - 1];
    }
    const values = formattedData.map((d) => d.y);
    if (values.length === 0) return [0, 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = 0.1 * (max - min) || 0.1;
    return [min - padding, max + padding];
  }, [formattedData, isCategorical, categories]);

  // Tick formatters
  const formatXTick = (value: string | number): string => {
    if (isCategorical) return value.toString();
    return typeof value === 'number' ? new Date(value).toLocaleTimeString() : value.toString();
  };

  const formatYTick = (value: number) => {
    if (isCategorical) return (categories[value] || value).toString();
    return value.toFixed(1);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

      <div style={{ height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" />
            <XAxis
              dataKey="x"
              type={isCategorical ? 'category' : 'number'}
              domain={isCategorical ? undefined : ['dataMin', 'dataMax']}
              tickFormatter={formatXTick}
              label={{ value: xLabel, position: 'bottom', offset: 0 }}
              tick={{ fill: '#666', fontSize: 12 }}
              allowDuplicatedCategory={false}
            />
            <YAxis
              dataKey="y"
              domain={yDomain}
              tickFormatter={formatYTick}
              label={{
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                offset: -10,
              }}
              tick={{ fill: '#666', fontSize: 12 }}
            />
            <Tooltip
              content={
                <CustomTooltip
                  unit={unit}
                  isCategorical={isCategorical}
                  categories={categories}
                />
              }
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey="y"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name={title}
            />
            <Brush dataKey="x" height={20} stroke={color} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {formattedData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="p-2 bg-gray-50 rounded text-center">
            <span className="text-gray-600">Latest Value: </span>
            <span className="font-semibold">
              {isCategorical
                ? (categories[formattedData[formattedData.length - 1].y] || 'N/A')
                : `${formattedData[formattedData.length - 1].y.toFixed(2)} ${unit}`}
            </span>
          </div>
          <div className="p-2 bg-gray-50 rounded text-center">
            <span className="text-gray-600">Data Points: </span>
            <span className="font-semibold">{formattedData.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};