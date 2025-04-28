import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ChainIcon from '@/public/chain-icon.svg';
import CloseIcon from '@/public/close.svg';
import DownloadIcon from '@/public/download.svg';
import EditHoveredIcon from '@/public/edit-hovered.svg';
import EditIcon from '@/public/edit-icon.svg';
import SendIcon from '@/public/plane.svg';
import RefreshIcon from '@/public/refresh.svg';
import UsdcIcon from '@/public/usdc-circle.svg';
import { TEXT_MODEL_PRICING } from '@/utils/constants';
import type { BaseMessage } from '@/utils/types';

interface MessageItemProps<M extends BaseMessage> {
  message: M;
  editingMessageId: string | null;
  editedContent: string;
  setEditedContent: (content: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleInputChange: any;
  hoveredMessageId: string | null;
  setHoveredMessageId: any;
  aiGenerate?: (input: string) => Promise<void>;
}

export function MessageItem<M extends BaseMessage>({
  message,
  editingMessageId,
  editedContent,
  setEditedContent,
  onEditMessage,
  onCancelEdit,
  onSubmitEdit,
  handleInputChange,
  hoveredMessageId,
  setHoveredMessageId,
  aiGenerate,
}: MessageItemProps<M>) {
  const [editHovered, setEditHovered] = useState(false);

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  function isMessage(item: unknown) {
    return (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      typeof item.id === 'string' &&
      'role' in item
    );
  }

  if (!isMessage(message)) {
    console.error('Invalid message object:', message);
    return <div />;
  }

  const handleDownload = (url: string, fileName: string) => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => console.error('Error downloading image:', error));
  };

  return (
    <div
      key={message.id}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
    >
      <div
        className={`flex flex-col ${editingMessageId === message.id && 'w-full'}`}
      >
        {editingMessageId === message.id ? (
          <div className="border-gray-200 rounded-xl shadow-md w-full">
            <form onSubmit={onSubmitEdit} className="flex space-x-2">
              <input
                type="text"
                value={editedContent}
                onChange={(e: any) => {
                  setEditedContent(e.target.value);
                  handleInputChange(e);
                }}
                className="flex-1 py-8 px-6 bg-white rounded-xl placeholder-transparent outline-none text-body"
              />
              <button className="" onClick={onCancelEdit}>
                <img src={CloseIcon.src} alt="Send icon" className="w-6 h-6" />
              </button>
              <button type="submit" className="pr-8">
                <img src={SendIcon.src} alt="Send icon" className="w-10 h-10" />
              </button>
            </form>
          </div>
        ) : (
          <div
            className="flex flex-col"
            onMouseEnter={() =>
              message.role === 'user' && setHoveredMessageId(message.id)
            }
            onMouseLeave={() => setHoveredMessageId(null)}
          >
            {((message.role == 'user' && message.content != undefined) ||
              message.imageUrl == undefined) && (
              <div
                className={`${message.role !== 'user' && 'border-none'} p-2 rounded-3xl bg-white border border-blue-200 px-4 py-2`}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
            {message.role == 'user' && message.prompt && (
              <div
                className={`${message.role !== 'user' && 'border-none'} p-2 rounded-3xl bg-white border border-blue-200 px-4 py-2`}
              >
                <ReactMarkdown>{message.prompt}</ReactMarkdown>
              </div>
            )}
            {message.role == 'assistant' && message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Generated"
                className="rounded-md shadow-sm max-w-[300px] max-h-[300px] object-contain"
              />
            )}
            {/* Edit Message */}
            <div
              className={`${message.role === 'user' && 'h-6'} flex justify-end ${hoveredMessageId === message.id ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            >
              {message.role === 'user' && hoveredMessageId === message.id && (
                <div className="flex flex-row space-x-1">
                  <button onClick={() => handleCopy(message?.content ?? '')}>
                    <img
                      src={ChainIcon.src}
                      alt="Chain icon"
                      className="w-6 h-6"
                    />
                  </button>
                  <button
                    onClick={() =>
                      onEditMessage(
                        message.id,
                        message?.content ?? message?.prompt ?? '',
                      )
                    }
                    onMouseEnter={() => setEditHovered(true)}
                    onMouseLeave={() => setEditHovered(false)}
                  >
                    <img
                      src={editHovered ? EditHoveredIcon.src : EditIcon.src}
                      alt="Pencil and ruler icon"
                      className="w-6 h-6"
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cost tool tip */}
        <div className="flex flex-row space-between items-center">
          {message.role === 'assistant' &&
            (message.content || message.imageUrl) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mr-auto border border-blue-200 mt-2 pl-2 pr-3 py-1 rounded-3xl flex flex-row items-center text-sm">
                      <img
                        src={UsdcIcon.src}
                        alt="USDC symbol"
                        className="h-6 w-6 mr-1"
                      />
                      {!message.provider ? (
                        <p className="text-sub">Calculating...</p>
                      ) : (
                        <>
                          {message.promptTokens && message.completionTokens && (
                            <>
                              - $
                              {Math.max(
                                message.promptTokens *
                                  TEXT_MODEL_PRICING[message.provider]
                                    .userBilledInputPrice +
                                  message.completionTokens *
                                    TEXT_MODEL_PRICING[message.provider]
                                      .userBilledOutputPrice,
                                0.01,
                              ).toFixed(2)}
                            </>
                          )}
                          {message.cost && <>- ${message.cost.toFixed(2)}</>}
                        </>
                      )}
                    </div>
                  </TooltipTrigger>
                  {message.provider &&
                    message.promptTokens &&
                    message.completionTokens && (
                      <TooltipContent side="bottom" align="start">
                        <p>
                          {message.promptTokens} prompt tokens ≡ $
                          {(
                            message.promptTokens *
                            TEXT_MODEL_PRICING[message.provider]
                              .userBilledInputPrice
                          ).toFixed(4)}
                        </p>
                        <p>
                          {message.completionTokens} completion tokens ≡ $
                          {(
                            message.completionTokens *
                            TEXT_MODEL_PRICING[message.provider]
                              .userBilledOutputPrice
                          ).toFixed(4)}
                        </p>
                      </TooltipContent>
                    )}
                </Tooltip>
              </TooltipProvider>
            )}
          {message.downloadable && message.imageUrl && (
            <div className="flex flex-row items-center space-x-2">
              <img
                src={RefreshIcon.src}
                alt="Refresh image"
                className="h-5 w-5 mr-1"
                onClick={() => {
                  if (aiGenerate) {
                    aiGenerate(message.prompt ?? message.content ?? '');
                  }
                }}
              />
              <img
                src={DownloadIcon.src}
                alt="Download"
                className="h-5 w-5 mr-1"
                onClick={() => {
                  if (message.imageUrl) {
                    handleDownload(message.imageUrl, 'generated-image.webp');
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
