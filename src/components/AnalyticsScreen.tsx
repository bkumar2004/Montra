'use client';

import { AnalyticsData } from '@/lib/types';
import { CategoryDoughnutChart, TrendLineChart, WeeklyBarChart } from './Charts';
import { useState, useEffect } from 'react';

interface AnalyticsScreenProps {
  data: AnalyticsData | null;
  loading: boolean;
}

export default function AnalyticsScreen({ data, loading }: AnalyticsScreenProps) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading && !data) {
    return (
      <div className="page-content">
        <div style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Loading insights...</p>
        </div>
        <div className="loading-spinner"><div className="spinner" /></div>
      </div>
    );
  }

  if (!data) return null;

  const isDark = theme === 'dark';

  return (
    <div className="page-content">
      <div style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Your spending insights this month</p>
      </div>

      {/* Stat Cards */}
      <div className="analytics-stat-row">
        <div className="analytics-stat">
          <div className="stat-value">{data.totalTransactions}</div>
          <div className="stat-label">Transactions</div>
        </div>
        <div className="analytics-stat">
          <div className="stat-value">{formatCurrency(data.dailyAverage)}</div>
          <div className="stat-label">Daily Avg</div>
        </div>
        <div className="analytics-stat">
          <div className="stat-value" style={{ fontSize: 14 }}>{data.topCategory}</div>
          <div className="stat-label">Top Category</div>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      {data.categoryBreakdown.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-title">Category Breakdown</h2>
          </div>

          <div className="spending-card">
            <CategoryDoughnutChart
              labels={data.categoryBreakdown.map(c => c.name)}
              data={data.categoryBreakdown.map(c => c.amount)}
              colors={data.categoryBreakdown.map(c => c.color)}
              darkMode={isDark}
            />
          </div>

          {/* Category List */}
          <div className="spending-card" style={{ padding: '8px 20px' }}>
            {data.categoryBreakdown.map(cat => (
              <div className="category-list-item" key={cat.name}>
                <div className="category-list-icon" style={{ background: cat.color + '18' }}>
                  {cat.icon}
                </div>
                <div className="category-list-info">
                  <div className="category-list-name">{cat.name}</div>
                  <div className="category-list-bar">
                    <div
                      className="category-list-bar-fill"
                      style={{ width: `${cat.percentage}%`, background: cat.color }}
                    />
                  </div>
                </div>
                <div className="category-list-right">
                  <div className="category-list-amount">{formatCurrency(cat.amount)}</div>
                  <div className="category-list-pct">{cat.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Weekly Trend */}
      {data.weeklyTrend.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 24 }}>
            <h2 className="section-title">Weekly Trend</h2>
          </div>
          <div className="spending-card">
            <WeeklyBarChart
              labels={data.weeklyTrend.map(w => w.week)}
              data={data.weeklyTrend.map(w => w.amount)}
              darkMode={isDark}
            />
          </div>
        </>
      )}

      {/* Monthly Trend */}
      {data.monthlyTrend.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 24 }}>
            <h2 className="section-title">Monthly Overview</h2>
          </div>
          <div className="spending-card">
            <TrendLineChart
              labels={data.monthlyTrend.map(m => m.month)}
              datasets={[
                {
                  label: 'Income',
                  data: data.monthlyTrend.map(m => m.income),
                  color: '#34C759',
                },
                {
                  label: 'Expenses',
                  data: data.monthlyTrend.map(m => m.expense),
                  color: isDark ? '#FFFFFF' : '#0A0A0A',
                },
              ]}
              darkMode={isDark}
            />
          </div>
        </>
      )}

      {data.categoryBreakdown.length === 0 && (
        <div className="empty-state">
          <div className="emoji">📊</div>
          <div className="title">No data yet</div>
          <div className="subtitle">Start adding transactions to see your analytics</div>
        </div>
      )}
    </div>
  );
}
