"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useApiKeys, useAddApiKey, useDeleteApiKey } from "@/hooks/use-api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { SkeletonList } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2 } from "lucide-react";

const providers = [
	{ value: "openai", label: "OpenAI" },
	{ value: "anthropic", label: "Anthropic" },
	{ value: "ollama", label: "Ollama (Local)" },
];

export default function SettingsPage() {
	const { user, updateProfile, updatePreferences } = useAuthStore();
	const { data: apiKeysData, isLoading: keysLoading } = useApiKeys();
	const addKeyMutation = useAddApiKey();
	const deleteKeyMutation = useDeleteApiKey();

	const [name, setName] = useState(user?.name ?? "");
	const [profileSaving, setProfileSaving] = useState(false);
	const [profileSuccess, setProfileSuccess] = useState(false);

	const [newProvider, setNewProvider] = useState("openai");
	const [newApiKey, setNewApiKey] = useState("");
	const [newModelName, setNewModelName] = useState("");
	const [newLabel, setNewLabel] = useState("");

	const [tonePreference, setTonePreference] = useState(
		(user?.preferences as Record<string, string>)?.tonePreference ?? "",
	);
	const [preferredTopics, setPreferredTopics] = useState(
		((user?.preferences as Record<string, string[]>)?.preferredTopics ?? []).join(", "),
	);
	const [writingStyle, setWritingStyle] = useState(
		(user?.preferences as Record<string, string>)?.writingStyle ?? "",
	);
	const [prefPostingFrequency, setPrefPostingFrequency] = useState(
		String((user?.preferences as Record<string, number>)?.postingFrequency ?? 3),
	);
	const [prefTargetAudience, setPrefTargetAudience] = useState(
		(user?.preferences as Record<string, string>)?.targetAudience ?? "",
	);
	const [prefSaving, setPrefSaving] = useState(false);
	const [prefSuccess, setPrefSuccess] = useState(false);

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
			{
				provider: newProvider,
				apiKey: newApiKey,
				modelName: newModelName,
				label: newLabel || undefined,
			},
			{
				onSuccess: () => {
					setNewApiKey("");
					setNewModelName("");
					setNewLabel("");
				},
			},
		);
	};

	const handleSavePreferences = async () => {
		setPrefSaving(true);
		try {
			await updatePreferences({
				...(tonePreference && { tonePreference }),
				...(writingStyle && { writingStyle }),
				...(preferredTopics && {
					preferredTopics: preferredTopics
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean),
				}),
				...(prefPostingFrequency && {
					postingFrequency: parseInt(prefPostingFrequency),
				}),
				...(prefTargetAudience && { targetAudience: prefTargetAudience }),
			});
			setPrefSuccess(true);
			setTimeout(() => setPrefSuccess(false), 3000);
		} catch {
			// handled
		}
		setPrefSaving(false);
	};

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h1 className="text-lg font-semibold">Settings</h1>
				<p className="text-sm text-muted-foreground">
					Account, API keys, and preferences.
				</p>
			</div>

			<Tabs defaultValue="apikeys">
				<TabsList>
					<TabsTrigger value="apikeys">API Keys</TabsTrigger>
					<TabsTrigger value="profile">Profile</TabsTrigger>
					<TabsTrigger value="preferences">Preferences</TabsTrigger>
				</TabsList>

				{/* API Keys */}
				<TabsContent value="apikeys">
					<div className="space-y-6">
						{/* Add Key Form */}
						<div className="rounded-lg border p-5 space-y-4">
							<div>
								<p className="text-sm font-medium">Add API Key</p>
								<p className="text-xs text-muted-foreground mt-1">
									Keys are encrypted with AES-256-GCM.
								</p>
							</div>
							{addKeyMutation.isSuccess && (
								<Alert variant="success">API key added.</Alert>
							)}
							{addKeyMutation.isError && (
								<Alert variant="error">Failed to add API key.</Alert>
							)}
							<div className="grid gap-3 sm:grid-cols-3">
								<div className="space-y-1.5">
									<Label className="text-xs">Provider</Label>
									<Select
										options={providers}
										value={newProvider}
										onChange={(e) => setNewProvider(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs">API Key</Label>
									<Input
										type="password"
										placeholder="sk-..."
										value={newApiKey}
										onChange={(e) => setNewApiKey(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs">Model</Label>
									<Input
										placeholder="e.g., gpt-4o, claude-sonnet-4"
										value={newModelName}
										onChange={(e) => setNewModelName(e.target.value)}
									/>
								</div>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Label (optional)</Label>
								<Input
									placeholder="e.g., Production key"
									value={newLabel}
									onChange={(e) => setNewLabel(e.target.value)}
								/>
							</div>
							<Button
								size="sm"
								onClick={handleAddKey}
								isLoading={addKeyMutation.isPending}
								disabled={!newApiKey || !newModelName}>
								Add Key
							</Button>
						</div>

						{/* Stored Keys */}
						<div className="rounded-lg border p-5 space-y-3">
							<p className="text-sm font-medium">Stored Keys</p>
							{keysLoading ? (
								<SkeletonList count={2} />
							) : apiKeys.length === 0 ? (
								<p className="text-xs text-muted-foreground">
									No API keys configured.
								</p>
							) : (
								<div className="space-y-px overflow-hidden rounded border bg-border">
									{apiKeys.map((key: Record<string, unknown>) => (
										<div
											key={key.id as string}
											className="flex items-center justify-between bg-card px-3 py-2.5">
											<div className="flex items-center gap-2">
												<Badge variant="outline">
													{String(key.provider)}
												</Badge>
												{key.label ? (
													<span className="text-xs text-muted-foreground">
														{String(key.label)}
													</span>
												) : null}
												<span className="font-mono text-[11px] text-muted-foreground">
													{key.maskedKey as string}
												</span>
											</div>
											<button
												onClick={() =>
													deleteKeyMutation.mutate(
														key.id as string,
													)
												}
												className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground">
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</TabsContent>

				{/* Profile */}
				<TabsContent value="profile">
					<div className="rounded-lg border p-5 space-y-4">
						<p className="text-sm font-medium">Profile</p>
						{profileSuccess && <Alert variant="success">Profile updated.</Alert>}
						<div className="space-y-1.5">
							<Label className="text-xs">Name</Label>
							<Input value={name} onChange={(e) => setName(e.target.value)} />
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Email</Label>
							<Input value={user?.email ?? ""} disabled />
						</div>
						<Button
							size="sm"
							onClick={handleSaveProfile}
							isLoading={profileSaving}>
							Save
						</Button>
					</div>
				</TabsContent>

				{/* Preferences */}
				<TabsContent value="preferences">
					<div className="rounded-lg border p-5 space-y-4">
						<div>
							<p className="text-sm font-medium">AI Preferences</p>
							<p className="text-xs text-muted-foreground mt-1">
								Content preferences for AI generation.
							</p>
						</div>
						{prefSuccess && <Alert variant="success">Preferences updated.</Alert>}
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label className="text-xs">Writing Style</Label>
								<Input
									placeholder="e.g., conversational, formal"
									value={writingStyle}
									onChange={(e) => setWritingStyle(e.target.value)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Tone</Label>
								<Input
									placeholder="e.g., professional, casual"
									value={tonePreference}
									onChange={(e) => setTonePreference(e.target.value)}
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">
								Preferred Topics (comma-separated)
							</Label>
							<Input
								placeholder="e.g., AI, leadership, productivity"
								value={preferredTopics}
								onChange={(e) => setPreferredTopics(e.target.value)}
							/>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label className="text-xs">Posts per Week</Label>
								<Input
									type="number"
									min="1"
									max="14"
									value={prefPostingFrequency}
									onChange={(e) =>
										setPrefPostingFrequency(e.target.value)
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Target Audience</Label>
								<Input
									placeholder="e.g., tech professionals"
									value={prefTargetAudience}
									onChange={(e) => setPrefTargetAudience(e.target.value)}
								/>
							</div>
						</div>
						<Button
							size="sm"
							onClick={handleSavePreferences}
							isLoading={prefSaving}>
							Save
						</Button>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
