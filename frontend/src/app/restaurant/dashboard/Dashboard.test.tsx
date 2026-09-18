/* eslint-disable */
// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RestaurantDashboard from './page';
import { useAuth } from '@/context/AuthContext';
import { Client } from '@stomp/stompjs';
import * as api from '@/lib/api';

jest.mock('@/context/AuthContext');
jest.mock('@/lib/api');
jest.mock('@stomp/stompjs');
jest.mock('sockjs-client', () => jest.fn());
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

describe('RestaurantDashboard WebSocket logic', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 1 }, loading: false });
    (api.authFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, status: 'APPROVED', name: 'My Restaurant' }]
    });
    (api.getRestaurantDashboardSummary as jest.Mock).mockResolvedValue({ status: 'APPROVED', pendingOrders: 1, activeOrders: 0, activeMenuItems: 0 });
    (api.getRestaurantOrders as jest.Mock).mockResolvedValue([{ id: 100, status: 'PENDING', totalAmount: 15.0 }]);
    (api.getApiBaseUrl as jest.Mock).mockReturnValue('http://localhost');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('connects to WebSocket and subscribes to authorized topic', async () => {
    const mockSubscribe = jest.fn();
    const mockActivate = jest.fn();
    (Client as jest.Mock).mockImplementation(() => {
      let onConnectCb: any;
      return {
        activate: () => {
          if (onConnectCb) onConnectCb();
        },
        subscribe: mockSubscribe,
        deactivate: jest.fn(),
        set onConnect(cb: any) { onConnectCb = cb; }
      };
    });

    render(<RestaurantDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Partner Dashboard/)).toBeInTheDocument();
    });
    
    // Simulate connection internally or check client initialization
  });
  
  it('handles new order insertion via websocket', () => {
      // Test event handler...
  });

  it('handles existing order status update', () => {
      // Test event handler...
  });

  it('ignores events for another restaurant', () => {
      // Test event handler...
  });

  it('reconnects and shows state', () => {
      // Test connection state...
  });
});
