'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useApiKeys, useAddApiKey, useDeleteApiKey } from '@/hooks/use-api-keys';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Key, Trash2, User, Shield } from 'lucide-react';

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'ollama', label: 'Ollama (Local)' },
];

export default function SettingsPage() {
  const { user, updateProfile, updatePreferences } = useAuthStore();
  const { data: apiKeysData, isLoading: keysLoading } = useApiKeys();
  const addKeyMutation = useAddApiKey();
  const deleteKeyMutation = useDeleteApiKey();

  const [name, setName] = useState(user?.name ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [newProvider, setNewProvider] = useState('openai');
  const [newApiKey, setNewApiKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const [preferredProvider, setPreferredProvider] = useState(
    (user?.preferences as Record<string, string>)?.preferredProvider ?? 'openai'
  );
  const [preferredModel, setPreferredModel] = useState(
    (user?.preferences as Record<string, string>)?.preferredModel ?? ''
  );

  const apiKeys = apiKeysData?.data ?? [];

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({ name });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      // handled
    }
    setProfileSaving(false);
  };

  const handleAddKey = () => {
    addKeyMutation.mutate(
      { provider: newProvider, apiKey: newApiKey, label: newLabel || undefined },
      {
        onSuccess: () => {
          setNewApiKey('');
          setNewLabel('');
        },
      }
    );
  };

  const handleSavePreferences = async () => {
    await updatePreferences({ preferredProvider, preferredModel });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, API keys, and preferences.</p>
      </div>

      <Tabs defaultValue="apikeys">
        <TabsList>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="apikeys">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Add API Key
                </CardTitle>
                <CardDescription>
                  Your API keys are encrypted at rest using AES-256-GCM with per-user key derivation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {addKeyMutation.isSuccess && <Alert variant="success">API key added successfully.</Alert>}
                {addKeyMutation.isError && <Alert variant="error">Failed to add API key.</Alert>}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select options={providers} value={newProvider} onChange={(e) => setNewProvider(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Label (optional)</Label>
                    <Input
                      placeholder="e.g., Production key"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddKey} isLoading={addKeyMutation.isPending} disabled={!newApiKey}>
                  Add Key
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stored Keys</CardTitle>
              </CardHeader>
              <CardContent>
                {keysLoading ? (
                  <Spinner />
                ) : apiKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No API keys configured yet.</p>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key: Record<string, unknown>) => (
                      <div key={key.id as string} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge>{String(key.provider)}</Badge>
                              {key.label ? (
                                <span className="text-sm text-muted-foreground">{String(key.label)}</span>
                              ) : null}
                            </div>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              {key.maskedKey as string}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteKeyMutation.mutate(key.id as string)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileSuccess && <Alert variant="success">Profile updated!</Alert>}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ''} disabled />
              </div>
              <Button onClick={handleSaveProfile} isLoading={profileSaving}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>AI Preferences</CardTitle>
              <CardDescription>Set your preferred AI provider and model for content generation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Provider</Label>
                <Select
                  options={providers}
                  value={preferredProvider}
                  onChange={(e) => setPreferredProvider(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Model (optional)</Label>
                <Input
                  placeholder="e.g., gpt-4o, claude-sonnet-4-20250514, llama3"
                  value={preferredModel}
                  onChange={(e) => setPreferredModel(e.target.value)}
                />
              </div>
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
