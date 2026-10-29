"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export type SettingsTab = "connections" | "studio" | "data";

export function SettingsTabsClient({
  connectionsNode,
  studioNode,
  dataNode,
}: {
  connectionsNode: React.ReactNode;
  studioNode: React.ReactNode;
  dataNode: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("connections");

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex justify-center sm:justify-start">
        <SegmentedControl
          value={activeTab}
          aria-label="Settings categories"
          options={[
            { value: "connections", label: "Connections & Storage" },
            { value: "studio", label: "Studio & Security" },
            { value: "data", label: "Data & Domain" },
          ]}
          onChange={(val) => setActiveTab(val as SettingsTab)}
        />
      </div>

      <div className="space-y-6">
        {activeTab === "connections" && connectionsNode}
        {activeTab === "studio" && studioNode}
        {activeTab === "data" && dataNode}
      </div>
    </div>
  );
}
