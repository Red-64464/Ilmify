'use client';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'bg-ilm-teal/20 text-ilm-teal'
              : 'text-ilm-sage hover:text-ilm-ivory hover:bg-ilm-accent/10'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
