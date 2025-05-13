'use client';

import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useSession } from '@/app/contexts/SessionContext';
// Importing icons from public folder
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
  const session = useSession();
  const router = useRouter();
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

  const classes = `flex flex-row items-center py-2 px-4 text-sm transition rounded-lg w-full ${hoverColor} ${active ? `${activeBackground} ${activeFontColor} font-bold` : ''}`;

  return (
    <button
      className={classes}
      onClick={() => {
        if (!session.isAiInferenceLoading) {
          router.push(url);
        } else {
          toast.info('Please wait for the current generation to finish.');
        }
      }}
    >
      <img src={icon.src} alt={alt} className="w-8 h-8 mr-2" />
      <div className="flex flex-col items-start">
        <div>{title}</div>
        {description && (
          <div className="text-xs text-gray-500">{description}</div>
        )}
      </div>
    </button>
  );
};

export const NavbarAIDropdown = () => {
  const pathname = usePathname();

  return (
    <div className="p-3">
      <div className="font-medium text-sm mb-2">BUILD WITH AI</div>

      <SidebarItem
        title="Image to video"
        active={pathname.includes('/video')}
        icon={VideoIcon}
        alt="Video icon"
        url="/video"
        description="Convert an image to a video"
      />

      <SidebarItem
        title="Image to 3D"
        active={pathname.includes('/3d')}
        icon={MultichainIcon}
        alt="3D icon"
        url="/3d"
        description="Convert an image to 3D"
      />

      <SidebarItem
        title="Text to Image"
        active={pathname.includes('/image')}
        icon={ImageIcon}
        alt="Image icon"
        url="/image"
        description="Convert text to an image"
      />

      <SidebarItem
        title="Text to Text"
        active={pathname.includes('/chat')}
        icon={ChatIcon}
        alt="Chat icon"
        url="/chat"
        description="Convert text to text"
      />
    </div>
  );
};
