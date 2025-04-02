import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import ChatIcon from '@/public/chat-jelly.svg';
import VideoIcon from '@/public/entertainment-bazooka.svg';
import ImageIcon from '@/public/image-julius.svg';
import MultichainIcon from '@/public/multichain-apple.svg';

type SidebarItemProps = {
  title: string;
  active?: boolean;
  icon: any;
  alt: string;
  url: string;
};

const SidebarItem = ({
  title,
  active = false,
  icon,
  alt,
  url,
}: SidebarItemProps) => {
  let hoverColor = '';
  let activeBackground = '';
  let activeFontColor = '';

  if (url === '/video') {
    hoverColor = 'hover:bg-[#FEF5FE80]';
    activeBackground = 'bg-[#FEF5FE80]';
    activeFontColor = 'text-[#EF8DF8]';
  } else if (url === '/3d') {
    hoverColor = 'hover:bg-[#EEFFFA80]';
    activeBackground = 'bg-[#EEFFFA80]';
    activeFontColor = 'text-[#1ED67D]';
  } else if (url === '/image') {
    hoverColor = 'hover:bg-[#FFF7EA80]';
    activeBackground = 'bg-[#FFF7EA80]';
    activeFontColor = 'text-[#FFA876]';
  } else if (url === '/chat') {
    hoverColor = 'hover:bg-[#F6F2FF80]';
    activeBackground = 'bg-[#F6F2FF80]';
    activeFontColor = 'text-[#9F72FF]';
  }

  // Combine classes for hover, active state, and regular state
  const classes = `flex flex-row items-center py-2 px-4 text-sm transition rounded-lg ${hoverColor} ${active ? `${activeBackground} ${activeFontColor} font-bold` : ''}`;

  return (
    <Link href={url} className={classes}>
      <img src={icon.src} alt={alt} className="w-8 h-8 mr-2" />
      {title}
    </Link>
  );
};

export default function AiTabs() {
  const pathname = usePathname();
  const tool = pathname.split('/')[1];
  return (
    <div className="space-y-2 h-fit p-2 flex flex-col justify-center">
      <SidebarItem
        title="Image to Video"
        active={tool === 'video'}
        icon={VideoIcon}
        alt="Video icon"
        url="/video"
      />
      <SidebarItem
        title="Image to 3D"
        active={tool === '3d'}
        icon={MultichainIcon}
        alt="Multichain block icon"
        url="/3d"
      />
      <SidebarItem
        title="Text to Image"
        active={tool === 'image'}
        icon={ImageIcon}
        alt="Image icon"
        url="/image-generator"
      />
      <SidebarItem
        title="Text to Text"
        active={tool === 'chat'}
        icon={ChatIcon}
        alt="Text bubble icon"
        url="/chat"
      />
    </div>
  );
}
