import React from "react";

type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "default" | "pills";
};

export function Tabs({
  items,
  defaultTab = items[0]?.id,
  onChange,
  variant = "default",
}: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = items.find((item) => item.id === activeTab)?.content;

  const isPills = variant === "pills";

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div
        className={`
          flex gap-1 mb-6
          ${isPills ? "" : "border-b border-aq"}
        `}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`
              flex items-center gap-2
              px-4 py-2
              font-medium
              transition-all duration-200
              ${
                activeTab === item.id
                  ? isPills
                    ? "bg-aq-accent text-aq-bg-deep rounded-aq"
                    : "text-aq-title border-b-2 border-aq-accent"
                  : "text-aq-text-muted hover:text-aq-text"
              }
            `}
          >
            {item.icon && <span>{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">{activeContent}</div>
    </div>
  );
}
