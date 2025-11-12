import React, { FC, useEffect, useState } from "react";
import { cn } from "../utils";

export type TabsElement = {
  key: string;
  label: React.ReactNode;
}

export type TabsProps = {
  options: TabsElement[];
  selected: TabsElement;
  onSelect: (tab: TabsElement) => void;
  skeleton?: boolean;
  disabled?: boolean;
  className?: string;
}

const Tabs: FC<TabsProps> = ({
  options,
  selected,
  onSelect,
  skeleton = false,
  disabled = false,
  className = ""
}) => {

  const [selectedTab, setSelectedTab] = useState<TabsElement>(selected);

  useEffect(() => {
    setSelectedTab(selected);
  }, [selected]);

  const handleTabClick = (tab: TabsElement) => {
    setSelectedTab(tab);
    onSelect(tab);
  }

  const tabsClassName = cn(
    "flex flex-row w-fit items-center justify-center gap-[8px] py-[4px] px-[6px] rounded-[8px] bg-[#F7F7F7]",
    className,
    skeleton ? 'bg-gray-300 animate-pulse text-transparent !cursor-progress' : '',
    disabled ? 'opacity-50 !cursor-not-allowed' : ''
  )
  
  const tabClassName = (option: TabsElement) => cn(
    "px-[12px] py-[6px] rounded-[8px] cursor-pointer text-sm font-medium font-nunito",
    `${selectedTab.key === option.key ? 'bg-white font-bold' : 'hover:bg-gray-200/40'}`,
    skeleton ? 'bg-gray-100 animate-pulse text-transparent !cursor-progress' : '',
    disabled ? 'opacity-50 !cursor-not-allowed' : ''
  )

  return (
    <div className={tabsClassName}>
      {options.map((option) => (
        <div
          key={option.key}
          className={tabClassName(option)}
          onClick={() => handleTabClick(option)}
        >
          {option.label}
        </div>
      ))}
    </div>
  )
}

export default Tabs;