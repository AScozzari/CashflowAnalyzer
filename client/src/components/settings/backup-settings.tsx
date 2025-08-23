import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Database, 
  Cloud, 
  Shield, 
  Clock, 
  Server, 
  Download, 
  Upload, 
  Settings, 
  Calendar, 
  HardDrive,
  Plus,
  Save,
  TestTube2 as TestTube,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Archive,
  RotateCcw,
  Trash2,
  Eye
} from "lucide-react";

export function BackupSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Real API queries for backup functionality
  const { data: backupConfigs = [], isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['/api/backup/configurations'],
    queryFn: async () => {
      const response = await fetch('/api/backup/configurations');
      return response.json();
    }
  });

  const { data: backupJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/backup/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/backup/jobs');
      return response.json();
    }
  });

  const { data: restorePoints = [], isLoading: isLoadingRestorePoints } = useQuery({
    queryKey: ['/api/backup/restore-points'],
    queryFn: async () => {
      const response = await fetch('/api/backup/restore-points');
      return response.json();
    }
  });

  const { data: backupStats = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/backup/stats'],
    queryFn: async () => {
      const response = await fetch('/api/backup/stats');
      return response.json();
    }
  });

  // Mutations for backup operations
  const createConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/backup/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backup/configurations'] });
      toast({ title: "Success", description: "Backup configuration created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create backup configuration", variant: "destructive" });
    }
  });

  const createManualBackupMutation = useMutation({
    mutationFn: async (configId: string) => {
      const response = await fetch('/api/backup/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backup/jobs'] });
      toast({ title: "Success", description: "Manual backup started successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start manual backup", variant: "destructive" });
    }
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/backup/configurations/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backup/configurations'] });
      toast({ title: "Success", description: "Backup configuration deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete backup configuration", variant: "destructive" });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'queued': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Play className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'queued': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoadingStats || isLoadingConfigs) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="backup-settings">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Backup Settings</h2>
        <p className="text-muted-foreground">
          Configure and manage system backups, restore points, and recovery options.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
          <TabsTrigger value="restore">Restore Points</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backupStats.totalBackups || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {backupStats.successfulBackups || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backupStats.storageUsed || "0 GB"}</div>
                <p className="text-xs text-muted-foreground">
                  of {backupStats.storageQuota || "100 GB"} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backupStats.lastBackup 
                    ? new Date(backupStats.lastBackup).toLocaleDateString()
                    : "Never"
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Next: {backupStats.nextScheduledBackup 
                    ? new Date(backupStats.nextScheduledBackup).toLocaleDateString()
                    : "Not scheduled"
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backupStats.totalBackups 
                    ? Math.round((backupStats.successfulBackups / backupStats.totalBackups) * 100)
                    : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  {backupStats.failedBackups || 0} failed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Backup Activity</CardTitle>
              <CardDescription>Latest backup jobs and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingJobs ? (
                <div className="text-center py-4">Loading...</div>
              ) : backupJobs.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No backup jobs found</div>
              ) : (
                <div className="space-y-3">
                  {backupJobs.slice(0, 5).map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={getStatusColor(job.status)}>
                          {getStatusIcon(job.status)}
                        </div>
                        <div>
                          <p className="font-medium">Job {job.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.startTime ? new Date(job.startTime).toLocaleString() : "Unknown time"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                        {job.size && (
                          <p className="text-sm text-muted-foreground mt-1">{job.size}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configurations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Backup Configurations</h3>
              <p className="text-sm text-muted-foreground">Manage your backup configurations and schedules</p>
            </div>
            <Button onClick={() => toast({ title: "Info", description: "Configuration dialog would open here" })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </div>

          <div className="grid gap-4">
            {backupConfigs.map((config: any) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch checked={config.enabled} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createManualBackupMutation.mutate(config.id)}
                        disabled={createManualBackupMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteConfigMutation.mutate(config.id)}
                        disabled={deleteConfigMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {config.type} backup - {config.frequency} - Provider: {config.provider}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Last Backup:</span>
                      <span>{config.lastBackup ? new Date(config.lastBackup).toLocaleString() : "Never"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retention:</span>
                      <span>{config.retention} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Encryption:</span>
                      <span>{config.encryption ? "Enabled" : "Disabled"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Recent Backup Jobs</h3>
            <p className="text-sm text-muted-foreground">View all recent backup job executions</p>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingJobs ? (
                <div className="text-center py-8">Loading jobs...</div>
              ) : backupJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No backup jobs found</div>
              ) : (
                <div className="divide-y">
                  {backupJobs.map((job: any) => (
                    <div key={job.id} className="p-4 hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={getStatusColor(job.status)}>
                            {getStatusIcon(job.status)}
                          </div>
                          <div>
                            <p className="font-medium">Job {job.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {job.startTime ? new Date(job.startTime).toLocaleString() : "Unknown time"}
                              {job.endTime && ` - ${new Date(job.endTime).toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                          {job.size && (
                            <p className="text-sm text-muted-foreground mt-1">{job.size}</p>
                          )}
                          {job.message && (
                            <p className="text-sm text-muted-foreground mt-1">{job.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Restore Points</h3>
              <p className="text-sm text-muted-foreground">Available restoration points for system recovery</p>
            </div>
            <Button onClick={() => toast({ title: "Info", description: "Create restore point dialog would open here" })}>
              <Archive className="h-4 w-4 mr-2" />
              Create Restore Point
            </Button>
          </div>

          <div className="grid gap-4">
            {isLoadingRestorePoints ? (
              <div className="text-center py-8">Loading restore points...</div>
            ) : restorePoints.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Restore Points</h3>
                  <p className="text-muted-foreground mb-4">Create your first restore point to enable system recovery</p>
                  <Button>Create Restore Point</Button>
                </CardContent>
              </Card>
            ) : (
              restorePoints.map((point: any) => (
                <Card key={point.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{point.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {point.verified && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="outline">{point.type}</Badge>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(point.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{point.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={point.verified ? "text-green-600" : "text-yellow-600"}>
                          {point.verified ? "Verified" : "Pending Verification"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}