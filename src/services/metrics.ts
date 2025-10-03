// Metrics Service
import { MetricsSummary, TimeseriesPoint, IntentMetric, ProductMetric, SessionFilter } from '@/types';
import { authService } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

class MetricsService {
  async getSummary(): Promise<MetricsSummary> {
    const response = await fetch(`${API_BASE}/api/metrics/summary`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get metrics summary');
    }

    return response.json();
  }

  async getTimeseries(metric: string, timeRange: string): Promise<TimeseriesPoint[]> {
    const response = await fetch(`${API_BASE}/api/metrics/timeseries?metric=${metric}&range=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get timeseries data');
    }

    return response.json();
  }

  async getIntents(): Promise<IntentMetric[]> {
    const response = await fetch(`${API_BASE}/api/metrics/intents`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get intent metrics');
    }

    return response.json();
  }

  async getTopProducts(): Promise<ProductMetric[]> {
    const response = await fetch(`${API_BASE}/api/metrics/products`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get product metrics');
    }

    return response.json();
  }

  async getSessions(filters?: SessionFilter): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE}/api/sessions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get sessions');
    }

    return response.json();
  }

  async exportSessions(filters?: SessionFilter): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE}/api/sessions/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export sessions');
    }

    return response.blob();
  }
}

export const metricsService = new MetricsService();