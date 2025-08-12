import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QUERY_KEYS } from "@/lib/constants";
import type { MovementWithRelations, InsertMovement } from "@shared/schema";

interface MovementFilters {
  companyId?: string;
  coreId?: string;
  resourceId?: string;
  officeId?: string;
  statusId?: string;
  type?: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface MovementsResponse {
  data: MovementWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useMovements(filters?: MovementFilters) {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }

  return useQuery({
    queryKey: [...QUERY_KEYS.MOVEMENTS, filters],
    queryFn: async (): Promise<MovementsResponse> => {
      const response = await fetch(`/api/movements?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch movements: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Handle both paginated and non-paginated responses
      if (data.data && data.pagination) {
        return data;
      } else if (Array.isArray(data)) {
        // Legacy response format
        return {
          data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1,
          }
        };
      } else {
        throw new Error('Invalid response format');
      }
    },
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useMovement(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.MOVEMENT(id),
    queryFn: async (): Promise<MovementWithRelations> => {
      const response = await fetch(`/api/movements/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Movimento non trovato');
        }
        throw new Error(`Failed to fetch movement: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
    retry: false, // Don't retry for individual movement fetches
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData): Promise<MovementWithRelations> => {
      const response = await fetch("/api/movements", {
        method: "POST",
        body: data,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create movement: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (newMovement) => {
      // Invalidate and refetch movements list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MOVEMENTS });
      
      // Invalidate analytics data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_STATS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_CASH_FLOW });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_STATUS_DISTRIBUTION });
      
      // Optionally add the new movement to cache
      queryClient.setQueryData(QUERY_KEYS.MOVEMENT(newMovement.id), newMovement);
    },
    onError: (error) => {
      console.error('Failed to create movement:', error);
    },
  });
}

export function useUpdateMovement(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData): Promise<MovementWithRelations> => {
      const response = await fetch(`/api/movements/${id}`, {
        method: "PUT",
        body: data,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update movement: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (updatedMovement) => {
      // Update the specific movement in cache
      queryClient.setQueryData(QUERY_KEYS.MOVEMENT(id), updatedMovement);
      
      // Invalidate movements list to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MOVEMENTS });
      
      // Invalidate analytics data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_STATS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_CASH_FLOW });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_STATUS_DISTRIBUTION });
    },
    onError: (error) => {
      console.error('Failed to update movement:', error);
    },
  });
}

export function useDeleteMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/movements/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Movimento non trovato');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete movement: ${response.statusText}`);
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove the movement from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.MOVEMENT(deletedId) });
      
      // Invalidate movements list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MOVEMENTS });
      
      // Invalidate analytics data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_STATS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_CASH_FLOW });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_STATUS_DISTRIBUTION });
    },
    onError: (error) => {
      console.error('Failed to delete movement:', error);
    },
  });
}

// Helper hook for recent movements (used in dashboard)
export function useRecentMovements(limit: number = 5) {
  return useMovements({ 
    limit,
    page: 1 
  });
}

// Helper hook for movement statistics
export function useMovementStats(period?: { startDate: string; endDate: string }) {
  const params = new URLSearchParams();
  if (period?.startDate) params.append('startDate', period.startDate);
  if (period?.endDate) params.append('endDate', period.endDate);

  return useQuery({
    queryKey: [...QUERY_KEYS.ANALYTICS_STATS, period],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}
