import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, AlertCircle, RefreshCw, Activity, Cpu } from "lucide-react";
import { ModelManagementAPI } from "../../api/modelManagement.api.ts";

interface ProviderHealth {
  provider: string;
  status: string;
  latencyMs: number;
  model: string;
  error?: string;
  details?: any;
}

interface HealthData {
  activeProvider: string;
  timestamp: string;
  providers: ProviderHealth[];
}

const ModelHealthPage: React.FC = () => {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setError("");
      const res = await ModelManagementAPI.getHealth();
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="text-green-500 w-6 h-6" />;
      case "degraded": return <AlertTriangle className="text-yellow-500 w-6 h-6" />;
      case "unhealthy": return <AlertCircle className="text-red-500 w-6 h-6" />;
      default: return <AlertCircle className="text-gray-400 w-6 h-6" />;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-700 bg-green-100 border-green-300";
      case "degraded": return "text-yellow-700 bg-yellow-100 border-yellow-300";
      case "unhealthy": return "text-red-700 bg-red-100 border-red-300";
      default: return "text-gray-700 bg-gray-100 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <RefreshCw className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Model Health & Switching</h1>
          <p className="text-gray-500">Monitor and manage LLM provider availability and performance.</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="p-3 bg-white rounded-full shadow hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Refresh Health Check"
        >
          <RefreshCw className={`w-6 h-6 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Active Provider</p>
                <div className="flex items-center gap-2">
                  <Cpu className="text-blue-600 w-8 h-8" />
                  <span className="text-2xl font-bold text-blue-700 capitalize">{data.activeProvider}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Global Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${data.providers.some(p => p.status === "unhealthy") ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                  {data.providers.some(p => p.status === "unhealthy") ? "Degraded" : "Healthy"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Checked</p>
                <p className="text-xl font-semibold text-gray-800">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Provider Nodes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.providers.map((provider) => (
              <div 
                key={provider.provider}
                className={`bg-white rounded-xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  provider.provider === data.activeProvider 
                    ? 'ring-2 ring-blue-500 shadow-md' 
                    : 'border border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 capitalize flex items-center gap-2">
                      {provider.provider}
                      {provider.provider === data.activeProvider && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Model: {provider.model}</p>
                  </div>
                  {getStatusIcon(provider.status)}
                </div>

                <div className="my-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColorClass(provider.status)}`}>
                    Status: {provider.status}
                  </span>
                </div>

                <div className={`flex items-center gap-2 text-sm ${provider.error ? 'mb-4' : ''}`}>
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    Latency: <span className="font-bold text-gray-900">{provider.latencyMs} ms</span>
                  </span>
                </div>

                {provider.error && (
                  <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md">
                    <p className="text-sm text-red-700 break-words font-medium">
                      {provider.error}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelHealthPage;
