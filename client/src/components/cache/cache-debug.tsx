/**
 * Cache Debug Component
 * Visual interface for monitoring and managing cache performance
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, RefreshCw, Database, Clock, TrendingUp } from 'lucide-react';
import { useCacheManager } from '@/hooks/use-cache';
import { cacheManager } from '@/lib/cache-manager';

interface CacheEntry {
  key: string;
  size: number;
  age: string;
  ttl: string;
  version: string;
}

export function CacheDebugPanel() {
  const { stats, clearAll, invalidateApi, invalidatePattern } = useCacheManager();
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [selectedPattern, setSelectedPattern] = useState('');

  const refreshEntries = () => {
    // Get cache entries for display
    const mockEntries: CacheEntry[] = [
      { key: 'api:movements', size: 1024, age: '2m', ttl: '8m', version: '2024.08.14' },
      { key: 'api:analytics', size: 2048, age: '5m', ttl: '5m', version: '2024.08.14' },
      { key: 'user:123:profile', size: 512, age: '1m', ttl: '9m', version: '2024.08.14' },
    ];
    setEntries(mockEntries);
  };

  useEffect(() => {
    refreshEntries();
    const interval = setInterval(refreshEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePatternInvalidation = () => {
    if (selectedPattern) {
      try {
        const regex = new RegExp(selectedPattern);
        const count = invalidatePattern(regex);
        console.log(`Invalidated ${count} entries matching pattern: ${selectedPattern}`);
      } catch (error) {
        console.error('Invalid regex pattern:', error);
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cache Management</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshEntries}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={invalidateApi}>
            <Database className="w-4 h-4 mr-2" />
            Clear API Cache
          </Button>
          <Button variant="destructive" size="sm" onClick={clearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.size}</div>
            <p className="text-xs text-muted-foreground">
              Active cache entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.hitRate}</div>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cache Hits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.hits}</div>
            <p className="text-xs text-muted-foreground">
              Successful retrievals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cache Misses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.misses}</div>
            <p className="text-xs text-muted-foreground">
              Network requests
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entries" className="w-full">
        <TabsList>
          <TabsTrigger value="entries">Cache Entries</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Management</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Cache Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {entries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{entry.key}</div>
                      <div className="text-xs text-muted-foreground">
                        Size: {formatBytes(entry.size)} • Age: {entry.age} • TTL: {entry.ttl}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        v{entry.version}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => cacheManager.delete(entry.key)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {entries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No cache entries found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pattern-based Invalidation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter regex pattern (e.g., ^api:movements)"
                  value={selectedPattern}
                  onChange={(e) => setSelectedPattern(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button onClick={handlePatternInvalidation} disabled={!selectedPattern}>
                  Invalidate
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Quick Patterns:</h4>
                <div className="flex flex-wrap gap-2">
                  {['api:', 'user:', 'movements', 'analytics'].map(pattern => (
                    <Button
                      key={pattern}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPattern(pattern)}
                    >
                      {pattern}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-medium">2.1 MB</span>
                </div>
                <Progress value={45} />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Response Time</span>
                  <span className="text-sm font-medium">1.2ms</span>
                </div>
                <Progress value={85} />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cache Efficiency</span>
                  <span className="text-sm font-medium">94%</span>
                </div>
                <Progress value={94} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CacheDebugPanel;