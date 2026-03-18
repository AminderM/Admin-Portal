import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Package, 
  Users, 
  Zap, 
  Check, 
  X,
  Search,
  Settings,
  ToggleLeft,
  ToggleRight,
  Link,
  History
} from 'lucide-react';

// Default feature categories
const FEATURE_CATEGORIES = [
  { value: 'core', label: 'Core Features' },
  { value: 'analytics', label: 'Analytics & Reports' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'advanced', label: 'Advanced Features' },
  { value: 'mobile', label: 'Mobile App' },
  { value: 'admin', label: 'Admin Tools' }
];

// System roles for mapping
const SYSTEM_ROLES = [
  { value: 'platform_admin', label: 'Platform Admin' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'driver', label: 'Driver' }
];

// Default features for initial setup (moved outside component)
const DEFAULT_FEATURES = [
  { id: '1', key: 'live_tracking', name: 'Live Tracking', description: 'Real-time GPS tracking of fleet', category: 'core', is_active: true, is_premium: false },
  { id: '2', key: 'eld_integration', name: 'ELD Integration', description: 'Electronic Logging Device integration', category: 'integrations', is_active: true, is_premium: true },
  { id: '3', key: 'ai_rate_confirmation', name: 'AI Rate Confirmation', description: 'AI-powered rate analysis and confirmation', category: 'advanced', is_active: true, is_premium: true },
  { id: '4', key: 'docs_versioning', name: 'Document Versioning', description: 'Version control for documents', category: 'core', is_active: true, is_premium: false },
  { id: '5', key: 'apps_marketplace', name: 'Apps Marketplace', description: 'Access to third-party integrations', category: 'integrations', is_active: true, is_premium: false },
  { id: '6', key: 'export_downloads', name: 'Export & Downloads', description: 'Export data to CSV/PDF', category: 'analytics', is_active: true, is_premium: false },
  { id: '7', key: 'driver_app', name: 'Driver Mobile App', description: 'Mobile app access for drivers', category: 'mobile', is_active: true, is_premium: false },
  { id: '8', key: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed analytics and reports', category: 'analytics', is_active: true, is_premium: true },
  { id: '9', key: 'api_access', name: 'API Access', description: 'REST API access for integrations', category: 'integrations', is_active: true, is_premium: true },
  { id: '10', key: 'multi_company', name: 'Multi-Company Support', description: 'Manage multiple companies', category: 'admin', is_active: true, is_premium: true }
];

// Default role mappings (moved outside component)
const DEFAULT_ROLE_MAPPINGS = {
  platform_admin: ['live_tracking', 'eld_integration', 'ai_rate_confirmation', 'docs_versioning', 'apps_marketplace', 'export_downloads', 'driver_app', 'advanced_analytics', 'api_access', 'multi_company'],
  company_admin: ['live_tracking', 'eld_integration', 'ai_rate_confirmation', 'docs_versioning', 'apps_marketplace', 'export_downloads', 'driver_app', 'advanced_analytics'],
  manager: ['live_tracking', 'docs_versioning', 'export_downloads', 'advanced_analytics'],
  dispatcher: ['live_tracking', 'docs_versioning', 'export_downloads'],
  accountant: ['docs_versioning', 'export_downloads', 'advanced_analytics'],
  hr_manager: ['docs_versioning', 'export_downloads'],
  sales_manager: ['docs_versioning', 'export_downloads', 'advanced_analytics'],
  fleet_manager: ['live_tracking', 'eld_integration', 'docs_versioning', 'export_downloads'],
  driver: ['live_tracking', 'driver_app', 'docs_versioning']
};

const FeatureManager = ({ fetchWithAuth, BACKEND_URL }) => {
  const [activeTab, setActiveTab] = useState('features');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [features, setFeatures] = useState([]);
  const [roleMappings, setRoleMappings] = useState({});
  const [productMappings, setProductMappings] = useState([]);
  const [products, setProducts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Modal states
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showRoleMappingModal, setShowRoleMappingModal] = useState(false);
  const [showProductMappingModal, setShowProductMappingModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  
  // Form states
  const [featureForm, setFeatureForm] = useState({
    key: '',
    name: '',
    description: '',
    category: 'core',
    is_active: true,
    is_premium: false
  });
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const loadFeatures = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/features`);
      if (response.ok) {
        const data = await response.json();
        setFeatures(data.features || []);
      } else {
        // Use default features if endpoint not available
        setFeatures([...DEFAULT_FEATURES]);
      }
    } catch (error) {
      console.log('Using default features');
      setFeatures([...DEFAULT_FEATURES]);
    }
  }, [fetchWithAuth, BACKEND_URL]);

  const loadRoleMappings = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/features/role-mappings`);
      if (response.ok) {
        const data = await response.json();
        setRoleMappings(data.mappings || {});
      } else {
        setRoleMappings({ ...DEFAULT_ROLE_MAPPINGS });
      }
    } catch (error) {
      console.log('Using default role mappings');
      setRoleMappings({ ...DEFAULT_ROLE_MAPPINGS });
    }
  }, [fetchWithAuth, BACKEND_URL]);

  const loadProductMappings = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/features/product-mappings`);
      if (response.ok) {
        const data = await response.json();
        setProductMappings(data.mappings || []);
      }
    } catch (error) {
      console.log('No product mappings available');
    }
  }, [fetchWithAuth, BACKEND_URL]);

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bundles/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.log('No products available');
    }
  }, [fetchWithAuth, BACKEND_URL]);

  const loadAuditLogs = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/features/audit-logs?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.log('No audit logs available');
    }
  }, [fetchWithAuth, BACKEND_URL]);

  // Fetch all data on mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        loadFeatures(),
        loadRoleMappings(),
        loadProductMappings(),
        loadProducts(),
        loadAuditLogs()
      ]);
      setLoading(false);
    };
    loadAllData();
  }, [loadFeatures, loadRoleMappings, loadProductMappings, loadProducts, loadAuditLogs]);

  // ID counter for local mode
  const idCounterRef = React.useRef(100);

  // CRUD Operations
  const handleCreateFeature = async () => {
    if (!featureForm.key || !featureForm.name) {
      toast.error('Feature key and name are required');
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/features`, {
        method: 'POST',
        body: JSON.stringify(featureForm)
      });

      if (response.ok) {
        toast.success('Feature created successfully');
        setShowFeatureModal(false);
        resetFeatureForm();
        loadFeatures();
        loadAuditLogs();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create feature');
      }
    } catch (error) {
      // For demo, add locally with incrementing ID
      idCounterRef.current += 1;
      const newFeature = {
        id: String(idCounterRef.current),
        ...featureForm
      };
      setFeatures(prev => [...prev, newFeature]);
      toast.success('Feature created (local mode)');
      setShowFeatureModal(false);
      resetFeatureForm();
    }
  };

  const handleUpdateFeature = async () => {
    if (!editingFeature) return;

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/features/${editingFeature.id}`, {
        method: 'PUT',
        body: JSON.stringify(featureForm)
      });

      if (response.ok) {
        toast.success('Feature updated successfully');
        setShowFeatureModal(false);
        setEditingFeature(null);
        resetFeatureForm();
        loadFeatures();
        loadAuditLogs();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update feature');
      }
    } catch (error) {
      // For demo, update locally
      setFeatures(prev => prev.map(f => f.id === editingFeature.id ? { ...f, ...featureForm } : f));
      toast.success('Feature updated (local mode)');
      setShowFeatureModal(false);
      setEditingFeature(null);
      resetFeatureForm();
    }
  };

  const handleDeleteFeature = async (featureId) => {
    if (!window.confirm('Are you sure you want to delete this feature?')) return;

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/features/${featureId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Feature deleted');
        loadFeatures();
        loadAuditLogs();
      } else {
        toast.error('Failed to delete feature');
      }
    } catch (error) {
      // For demo, delete locally
      setFeatures(prev => prev.filter(f => f.id !== featureId));
      toast.success('Feature deleted (local mode)');
    }
  };

  const handleToggleFeatureForRole = async (role, featureKey, enabled) => {
    const currentFeatures = roleMappings[role] || [];
    let newFeatures;
    
    if (enabled) {
      newFeatures = [...currentFeatures, featureKey];
    } else {
      newFeatures = currentFeatures.filter(f => f !== featureKey);
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/features/role-mapping`, {
        method: 'POST',
        body: JSON.stringify({
          role,
          features: newFeatures
        })
      });

      if (response.ok) {
        toast.success(`Feature ${enabled ? 'enabled' : 'disabled'} for ${role}`);
        loadRoleMappings();
        loadAuditLogs();
      } else {
        toast.error('Failed to update role mapping');
      }
    } catch (error) {
      // Update locally
      setRoleMappings({
        ...roleMappings,
        [role]: newFeatures
      });
      toast.success(`Feature ${enabled ? 'enabled' : 'disabled'} for ${role} (local mode)`);
    }
  };

  const handleProductFeatureMapping = async (productId, featureKeys) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/features/product-mapping`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          features: featureKeys
        })
      });

      if (response.ok) {
        toast.success('Product features updated');
        loadProductMappings();
        loadAuditLogs();
      } else {
        toast.error('Failed to update product mapping');
      }
    } catch (error) {
      toast.error('Failed to update product mapping');
    }
  };

  const resetFeatureForm = () => {
    setFeatureForm({
      key: '',
      name: '',
      description: '',
      category: 'core',
      is_active: true,
      is_premium: false
    });
  };

  const openEditFeature = (feature) => {
    setEditingFeature(feature);
    setFeatureForm({
      key: feature.key,
      name: feature.name,
      description: feature.description || '',
      category: feature.category || 'core',
      is_active: feature.is_active !== false,
      is_premium: feature.is_premium || false
    });
    setShowFeatureModal(true);
  };

  // Filter features
  const filteredFeatures = features.filter(f => {
    const query = searchQuery.toLowerCase();
    return f.name?.toLowerCase().includes(query) || 
           f.key?.toLowerCase().includes(query) ||
           f.description?.toLowerCase().includes(query);
  });

  // Check if role has feature
  const roleHasFeature = (role, featureKey) => {
    return (roleMappings[role] || []).includes(featureKey);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="feature-manager-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading feature manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="feature-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Feature Manager</h2>
          <p className="text-muted-foreground mt-2">
            Manage features, role permissions, and product mappings
          </p>
        </div>
        <Button onClick={() => { resetFeatureForm(); setEditingFeature(null); setShowFeatureModal(true); }} data-testid="add-feature-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Feature
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{features.length}</p>
                <p className="text-sm text-muted-foreground">Total Features</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{features.filter(f => f.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Features</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{features.filter(f => f.is_premium).length}</p>
                <p className="text-sm text-muted-foreground">Premium Features</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{SYSTEM_ROLES.length}</p>
                <p className="text-sm text-muted-foreground">System Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="features" data-testid="features-tab">
            <Zap className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="role-mapping" data-testid="role-mapping-tab">
            <Shield className="w-4 h-4 mr-2" />
            Role Mapping
          </TabsTrigger>
          <TabsTrigger value="product-mapping" data-testid="product-mapping-tab">
            <Package className="w-4 h-4 mr-2" />
            Product Mapping
          </TabsTrigger>
          <TabsTrigger value="audit-log" data-testid="audit-log-tab">
            <History className="w-4 h-4 mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Features</CardTitle>
                <div className="w-64">
                  <Input
                    placeholder="Search features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeatures.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{feature.name}</p>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{feature.key}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {FEATURE_CATEGORIES.find(c => c.value === feature.category)?.label || feature.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {feature.is_active ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {feature.is_premium ? (
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            Premium
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditFeature(feature)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteFeature(feature.id)} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Mapping Tab */}
        <TabsContent value="role-mapping" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature-to-Role Mapping</CardTitle>
              <CardDescription>
                Configure which features are available for each system role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">Feature</TableHead>
                      {SYSTEM_ROLES.map(role => (
                        <TableHead key={role.value} className="text-center min-w-[100px]">
                          {role.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {features.map((feature) => (
                      <TableRow key={feature.id}>
                        <TableCell className="sticky left-0 bg-background font-medium">
                          <div className="flex items-center gap-2">
                            {feature.is_premium && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">PRO</Badge>
                            )}
                            {feature.name}
                          </div>
                        </TableCell>
                        {SYSTEM_ROLES.map(role => (
                          <TableCell key={role.value} className="text-center">
                            <Switch
                              checked={roleHasFeature(role.value, feature.key)}
                              onCheckedChange={(checked) => handleToggleFeatureForRole(role.value, feature.key, checked)}
                              data-testid={`toggle-${feature.key}-${role.value}`}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Mapping Tab */}
        <TabsContent value="product-mapping" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Product-to-Feature Mapping</CardTitle>
              <CardDescription>
                Define which features are included with each product/bundle subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Products Found</h3>
                  <p className="text-muted-foreground">
                    Products need to be created in the Subscription Manager first.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {products.map(product => {
                    const mapping = productMappings.find(m => m.product_id === product.id);
                    const productFeatures = mapping?.features || [];
                    
                    return (
                      <Card key={product.id} className="border-2">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Package className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{product.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{product.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {productFeatures.length} features
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {features.map(feature => (
                              <div key={feature.id} className="flex items-center gap-2 p-2 rounded border">
                                <Switch
                                  checked={productFeatures.includes(feature.key)}
                                  onCheckedChange={(checked) => {
                                    const newFeatures = checked
                                      ? [...productFeatures, feature.key]
                                      : productFeatures.filter(f => f !== feature.key);
                                    handleProductFeatureMapping(product.id, newFeatures);
                                  }}
                                />
                                <span className="text-sm">{feature.name}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit-log" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Audit Log</CardTitle>
              <CardDescription>
                Track all changes to features, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Audit Logs</h3>
                  <p className="text-muted-foreground">
                    Feature changes will be recorded here once the backend endpoint is implemented.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.target}</TableCell>
                        <TableCell>{log.user_email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Feature Modal */}
      <Dialog open={showFeatureModal} onOpenChange={setShowFeatureModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFeature ? 'Edit Feature' : 'Create New Feature'}</DialogTitle>
            <DialogDescription>
              {editingFeature ? 'Update feature configuration' : 'Add a new feature to the system'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Feature Key *</Label>
                <Input
                  value={featureForm.key}
                  onChange={(e) => setFeatureForm({ ...featureForm, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="feature_key"
                  className="mt-1"
                  disabled={!!editingFeature}
                  data-testid="feature-key-input"
                />
                <p className="text-xs text-muted-foreground mt-1">Unique identifier (snake_case)</p>
              </div>
              <div>
                <Label>Feature Name *</Label>
                <Input
                  value={featureForm.name}
                  onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
                  placeholder="Feature Name"
                  className="mt-1"
                  data-testid="feature-name-input"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={featureForm.description}
                onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                placeholder="Describe what this feature does..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={featureForm.category}
                onValueChange={(value) => setFeatureForm({ ...featureForm, category: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEATURE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={featureForm.is_active}
                  onCheckedChange={(checked) => setFeatureForm({ ...featureForm, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={featureForm.is_premium}
                  onCheckedChange={(checked) => setFeatureForm({ ...featureForm, is_premium: checked })}
                />
                <Label>Premium Feature</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowFeatureModal(false); setEditingFeature(null); }}>
              Cancel
            </Button>
            <Button onClick={editingFeature ? handleUpdateFeature : handleCreateFeature} data-testid="save-feature-btn">
              {editingFeature ? 'Update Feature' : 'Create Feature'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeatureManager;
