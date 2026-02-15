"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
	activeTab: string;
	setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
	const context = React.useContext(TabsContext);
	if (!context) throw new Error("Tabs components must be used within <Tabs>");
	return context;
}

interface TabsProps {
	defaultValue: string;
	value?: string;
	onValueChange?: (value: string) => void;
	children: React.ReactNode;
	className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
	const [internalTab, setInternalTab] = React.useState(defaultValue);
	const activeTab = value ?? internalTab;
	const setActiveTab = React.useCallback(
		(v: string) => {
			if (onValueChange) onValueChange(v);
			setInternalTab(v);
		},
		[onValueChange],
	);
	return (
		<TabsContext.Provider value={{ activeTab, setActiveTab }}>
			<div className={className}>{children}</div>
		</TabsContext.Provider>
	);
}

export function TabsList({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"inline-flex h-9 items-center justify-center rounded-md bg-secondary p-1 text-muted-foreground",
				className,
			)}>
			{children}
		</div>
	);
}

export function TabsTrigger({
	value,
	children,
	className,
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
}) {
	const { activeTab, setActiveTab } = useTabs();
	return (
		<button
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
				activeTab === value && "bg-background text-foreground shadow-sm",
				className,
			)}
			onClick={() => setActiveTab(value)}>
			{children}
		</button>
	);
}

export function TabsContent({
	value,
	children,
	className,
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
}) {
	const { activeTab } = useTabs();
	if (activeTab !== value) return null;
	return <div className={cn("mt-2 focus-visible:outline-none", className)}>{children}</div>;
}
