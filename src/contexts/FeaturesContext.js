import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// Default feature flags (fallback when API unavailable)
const defaultFlags = {
  live_tracking: true,
  eld_integration: false,
  ai_rate_confirmation: true,
  docs_versioning: true,
  apps_marketplace: true,
  brand_adaptive_theme: true,
  export_downloads: true,
  driver_app: false,
  advanced_analytics: false,
  api_access: false,
  multi_company: false,
};

const FeaturesContext = createContext({
  flags: defaultFlags,
  loading: true,
  refreshFeatures: () => {},
  hasFeature: () => false,
});

export const useFeatures = () => useContext(FeaturesContext);

export const FeaturesProvider = ({ flags: propFlags, children }) => {
  const [flags, setFlags] = useState(defaultFlags);
  const [loading, setLoading] = useState(true);

  // Fetch user's enabled features from the backend
  const fetchUserFeatures = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setFlags({ ...defaultFlags, ...(propFlags || {}) });
        setLoading(false);
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/features/user-flags`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Merge API flags with defaults (API takes precedence)
        setFlags({ ...defaultFlags, ...data.flags });
      } else {
        // Fallback to defaults + props
        setFlags({ ...defaultFlags, ...(propFlags || {}) });
      }
    } catch (error) {
      console.log('Using default feature flags');
      setFlags({ ...defaultFlags, ...(propFlags || {}) });
    } finally {
      setLoading(false);
    }
  }, [propFlags]);

  // Fetch features on mount and when token changes
  useEffect(() => {
    fetchUserFeatures();

    // Listen for auth changes
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token') {
        fetchUserFeatures();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUserFeatures]);

  // Merge prop flags when they change
  useEffect(() => {
    if (propFlags) {
      setFlags(prev => ({ ...prev, ...propFlags }));
    }
  }, [propFlags]);

  // Check if a feature is enabled
  const hasFeature = useCallback((featureKey) => {
    return flags[featureKey] === true;
  }, [flags]);

  // Allow manual refresh
  const refreshFeatures = useCallback(() => {
    setLoading(true);
    fetchUserFeatures();
  }, [fetchUserFeatures]);

  const value = useMemo(() => ({
    flags,
    loading,
    refreshFeatures,
    hasFeature,
  }), [flags, loading, refreshFeatures, hasFeature]);

  return (
    <FeaturesContext.Provider value={value}>
      {children}
    </FeaturesContext.Provider>
  );
};

// Higher-order component for feature gating
export const withFeature = (featureKey, FallbackComponent = null) => (WrappedComponent) => {
  return function FeatureGatedComponent(props) {
    const { hasFeature, loading } = useFeatures();

    if (loading) {
      return <div className="animate-pulse h-full bg-muted rounded"></div>;
    }

    if (!hasFeature(featureKey)) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }

    return <WrappedComponent {...props} />;
  };
};

// Hook for checking multiple features
export const useHasFeatures = (featureKeys) => {
  const { flags, loading } = useFeatures();
  
  const results = useMemo(() => {
    return featureKeys.reduce((acc, key) => {
      acc[key] = flags[key] === true;
      return acc;
    }, {});
  }, [flags, featureKeys]);

  return { features: results, loading };
};
