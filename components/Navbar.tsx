"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// Importing icons from public folder
import ChatIcon from "@/public/chat-jelly.svg";
import VideoIcon from "@/public/entertainment-bazooka.svg";
import ImageIcon from "@/public/image-julius.svg";
import MultichainIcon from "@/public/multichain-apple.svg";

type SidebarItemProps = {
  title: string;
  active?: boolean;
  icon: any;
  alt: string;
  url: string;
  description?: string;
};

const SidebarItem = ({
  title,
  active = false,
  icon,
  alt,
  url,
  description,
}: SidebarItemProps) => {
  let hoverColor = "";
  let activeBackground = "";
  let activeFontColor = "";

  if (url === "/video") {
    hoverColor = "hover:bg-[#FEF5FE80]";
    activeBackground = "bg-[#FEF5FE80]";
    activeFontColor = "text-[#EF8DF8]";
  } else if (url === "/3d") {
    hoverColor = "hover:bg-[#EEFFFA80]";
    activeBackground = "bg-[#EEFFFA80]";
    activeFontColor = "text-[#1ED67D]";
  } else if (url === "/image") {
    hoverColor = "hover:bg-[#FFF7EA80]";
    activeBackground = "bg-[#FFF7EA80]";
    activeFontColor = "text-[#FFA876]";
  } else if (url === "/chat") {
    hoverColor = "hover:bg-[#F6F2FF80]";
    activeBackground = "bg-[#F6F2FF80]";
    activeFontColor = "text-[#9F72FF]";
  }

  const classes = `flex flex-row items-center py-2 px-4 text-sm transition rounded-lg ${hoverColor} ${active ? `${activeBackground} ${activeFontColor} font-bold` : ""}`;

  return (
    <Link href={url} className={classes}>
      <img src={icon.src} alt={alt} className="w-8 h-8 mr-2" />
      <div>
        <div>{title}</div>
        {description && (
          <div className="text-xs text-gray-500">{description}</div>
        )}
      </div>
    </Link>
  );
};

const Navbar = ({ userInitials = "CL" }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="flex justify-between items-center py-2 px-36 border-b border-gray-200 shadow-lg">
      <div className="flex items-center space-x-16">
        <Link href="/dashboard">
          <div className="flex items-center">
            <div className="w-8 h-8 relative">
              <Image
                src="/circle-logo.svg"
                alt="Circle Logo"
                layout="fill"
                objectFit="contain"
              />
            </div>
            <span className="ml-2 text-2xl font-bold">CIRCLE</span>
          </div>
        </Link>
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
          Manage Wallet
        </Link>
        <div className="relative">
          <Link
            href="/video"
            ref={buttonRef}
            className="text-blue-500 hover:text-blue-700 flex items-center"
            onMouseEnter={() => setShowDropdown(true)}
          >
            Build with AI
          </Link>

          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-72"
              onMouseLeave={() => setShowDropdown(false)}
            >
              <div className="p-3">
                <div className="font-medium text-sm mb-2">BUILD WITH AI</div>

                <SidebarItem
                  title="Image to video"
                  active={pathname.includes("/video")}
                  icon={VideoIcon}
                  alt="Video icon"
                  url="/video"
                  description="Convert an image to a video"
                />

                <SidebarItem
                  title="Image to 3D"
                  active={pathname.includes("/3d")}
                  icon={MultichainIcon}
                  alt="3D icon"
                  url="/3d"
                  description="Convert an image to 3D"
                />

                <SidebarItem
                  title="Text to Image"
                  active={pathname.includes("/image")}
                  icon={ImageIcon}
                  alt="Image icon"
                  url="/image"
                  description="Convert text to an image"
                />

                <SidebarItem
                  title="Text to Text"
                  active={pathname.includes("/chat")}
                  icon={ChatIcon}
                  alt="Chat icon"
                  url="/chat"
                  description="Convert text to text"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center">
        {userInitials}
      </div>
    </nav>
  );
};

export default Navbar;
