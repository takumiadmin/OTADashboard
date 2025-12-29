import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
  labels: string[];
  values: number[];
  title: string;
  colors: string[];
}

export function DonutChart({ labels, values, title, colors }: DonutChartProps) {
  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12,
            family: 'Arial, sans-serif',
          },
          padding: 10,
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const dataTotal = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = dataTotal > 0 ? Math.round((value / dataTotal) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '65%',
    maintainAspectRatio: false,
    responsive: true,
  };

  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart: any) => {
      const { ctx, chartArea } = chart;
      
      // Calculate the center point of the chart area
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;

      const data = chart.data.datasets[0].data;
      const total = data.reduce((sum: number, val: number) => sum + val, 0);
      const val = data[0];
      const percentage = total > 0 ? Math.round((val / total) * 100) : 0;

      // Clear the center area
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      const radius = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 4;
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      ctx.restore();

      // Draw percentage text
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#333333';
      ctx.fillText(`${percentage}%`, centerX, centerY);
      ctx.restore();
    },
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="w-56 h-56 relative">
        <Doughnut 
          data={data} 
          options={options}
          plugins={[centerTextPlugin]}
        />
      </div>
    </div>
  );
}