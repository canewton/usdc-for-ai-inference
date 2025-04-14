import Link from "next/link";
import React from "react";

type SidebarItemProps = {
  title: string;
  active?: boolean;
};

const SidebarItem = ({ title, active = false }: SidebarItemProps) => {
  return (
    <Link
      href="#"
      className={`block py-2 px-4 text-sm hover:bg-gray-100 rounded-md ${active ? "bg-gray-100 text-blue-500 font-medium" : ""}`}
    >
      {title}
    </Link>
  );
};

type SidebarSectionProps = {
  title: string;
  children: React.ReactNode;
};

const SidebarSection = ({ title, children }: SidebarSectionProps) => {
  return (
    <div className="mb-6">
      <h3 className="text-xs uppercase text-gray-500 font-medium mb-2 px-4">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
};

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full p-4 flex flex-col">
      <div className="space-y-2 mb-8">
        <SidebarItem title="Image to Video" active={true} />
        <SidebarItem title="Image to 3-d" />
        <SidebarItem title="Text to Image" />
        <SidebarItem title="Text to Text" />
      </div>

      <div className="flex-1 overflow-auto pr-1 rounded-md bg-gray-50 p-3">
        <SidebarSection title="YESTERDAY">
          <SidebarItem title="New Chat" />
          <SidebarItem title="Bunny in orange outfit" />
          <SidebarItem title="Digital Wallet" />
          <SidebarItem title="Duck in Water Icon" />
          <SidebarItem title="Weather Icon" />
        </SidebarSection>

        <SidebarSection title="PAST WEEK">
          <SidebarItem title="Bunny in orange outfit" />
          <SidebarItem title="Lorem ipsum dolor sit amet" />
          <SidebarItem title="Magna donec ornare tempus" />
          <SidebarItem title="Magna donec ornare tempus" />
          <SidebarItem title="More sample item 1" />
          <SidebarItem title="More sample item 2" />
          <SidebarItem title="More sample item 3" />
          <SidebarItem title="More sample item 4" />
          <SidebarItem title="More sample item 5" />
        </SidebarSection>
      </div>
    </div>
  );
}
