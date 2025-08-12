import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { 
  Company, InsertCompany,
  Core, InsertCore,
  Resource, InsertResource,
  Iban, InsertIban,
  Office, InsertOffice,
  Tag, InsertTag,
  MovementStatus, InsertMovementStatus
} from "@shared/schema";

// Companies
export function useCompanies() {
  return useQuery({
    queryKey: ["/api/companies"],
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ["/api/companies", id],
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertCompany) => {
      return await apiRequest("POST", "/api/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
  });
}

// Cores
export function useCores(companyId?: string) {
  return useQuery({
    queryKey: ["/api/cores", companyId],
    queryFn: () => companyId ? 
      fetch(`/api/cores?companyId=${companyId}`).then(res => res.json()) : 
      fetch("/api/cores").then(res => res.json()),
  });
}

export function useCreateCore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertCore) => {
      return await apiRequest("POST", "/api/cores", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cores"] });
    },
  });
}

// Resources
export function useResources(companyId?: string) {
  return useQuery({
    queryKey: ["/api/resources", companyId],
    queryFn: () => companyId ? 
      fetch(`/api/resources?companyId=${companyId}`).then(res => res.json()) : 
      fetch("/api/resources").then(res => res.json()),
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertResource) => {
      return await apiRequest("POST", "/api/resources", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    },
  });
}

// IBANs
export function useIbans(companyId?: string) {
  return useQuery({
    queryKey: ["/api/ibans", companyId],
    queryFn: () => companyId ? 
      fetch(`/api/ibans?companyId=${companyId}`).then(res => res.json()) : 
      fetch("/api/ibans").then(res => res.json()),
  });
}

export function useCreateIban() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertIban) => {
      return await apiRequest("POST", "/api/ibans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ibans"] });
    },
  });
}

// Offices
export function useOffices(companyId?: string) {
  return useQuery({
    queryKey: ["/api/offices", companyId],
    queryFn: () => companyId ? 
      fetch(`/api/offices?companyId=${companyId}`).then(res => res.json()) : 
      fetch("/api/offices").then(res => res.json()),
  });
}

export function useCreateOffice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertOffice) => {
      return await apiRequest("POST", "/api/offices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
    },
  });
}

// Tags
export function useTags() {
  return useQuery({
    queryKey: ["/api/tags"],
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertTag) => {
      return await apiRequest("POST", "/api/tags", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    },
  });
}

// Movement Statuses
export function useMovementStatuses() {
  return useQuery({
    queryKey: ["/api/movement-statuses"],
  });
}

export function useCreateMovementStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertMovementStatus) => {
      return await apiRequest("POST", "/api/movement-statuses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movement-statuses"] });
    },
  });
}
