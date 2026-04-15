'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface BarChartProps {
  labels: string[];
  data: number[];
  color?: string;
  darkMode?: boolean;
}

export function WeeklyBarChart({ labels, data, darkMode }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const maxVal = Math.max(...data, 1);
    const gridColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = darkMode ? '#666' : '#999';
    const barColor = darkMode ? '#FFFFFF' : '#0A0A0A';

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: data.map((_, i) => {
            const isHighest = data[i] === maxVal && maxVal > 0;
            return isHighest ? barColor : (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)');
          }),
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.55,
          categoryPercentage: 0.7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: darkMode ? '#333' : '#0A0A0A',
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 10,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (ctx) => `₹${ctx.parsed.y.toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { size: 11, family: 'Inter', weight: 500 },
            },
            border: { display: false },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 11, family: 'Inter' },
              callback: (v) => `₹${v}`,
              maxTicksLimit: 5,
            },
            border: { display: false },
            beginAtZero: true,
          },
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [labels, data, darkMode]);

  return (
    <div className="chart-container">
      <canvas ref={canvasRef} />
    </div>
  );
}

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors: string[];
  darkMode?: boolean;
}

export function CategoryDoughnutChart({ labels, data, colors, darkMode }: DoughnutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: darkMode ? '#333' : '#0A0A0A',
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 10,
            padding: 10,
            displayColors: true,
            callbacks: {
              label: (ctx) => ` ₹${ctx.parsed.toFixed(2)}`,
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [labels, data, colors, darkMode]);

  return (
    <div className="chart-container" style={{ height: 200 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

interface LineChartProps {
  labels: string[];
  datasets: { label: string; data: number[]; color: string }[];
  darkMode?: boolean;
}

export function TrendLineChart({ labels, datasets, darkMode }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const gridColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = darkMode ? '#666' : '#999';

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map(ds => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.color,
          backgroundColor: ds.color + '15',
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: ds.color,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: datasets.length > 1,
            position: 'top',
            labels: {
              color: darkMode ? '#ccc' : '#666',
              font: { size: 11, family: 'Inter', weight: 600 },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: darkMode ? '#333' : '#0A0A0A',
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 10,
            padding: 10,
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { size: 11, family: 'Inter' },
            },
            border: { display: false },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 11, family: 'Inter' },
              callback: (v) => `₹${v}`,
              maxTicksLimit: 5,
            },
            border: { display: false },
            beginAtZero: true,
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [labels, datasets, darkMode]);

  return (
    <div className="chart-container" style={{ height: 220 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
