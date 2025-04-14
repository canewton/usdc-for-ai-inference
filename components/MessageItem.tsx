import { useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ChainIcon from "@/public/chain-icon.svg";
import CloseIcon from "@/public/close.svg";
import EditHoveredIcon from "@/public/edit-hovered.svg";
import EditIcon from "@/public/edit-icon.svg";
import SendIcon from "@/public/plane.svg";
import UsdcIcon from "@/public/usdc-circle.svg";
import { TEXT_MODEL_PRICING } from "@/utils/constants";
import type { Message } from "@/utils/types";

interface MessageItemProps {
  message: Message;
  isLoading: boolean;
  editingMessageId: string | null;
  editedContent: string;
  setEditedContent: (content: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleInputChange: any;
  hoveredMessageId: string | null;
  setHoveredMessageId: any;
}

export function MessageItem({
  message,
  isLoading,
  editingMessageId,
  editedContent,
  setEditedContent,
  onEditMessage,
  onCancelEdit,
  onSubmitEdit,
  handleInputChange,
  hoveredMessageId,
  setHoveredMessageId,
}: MessageItemProps) {
  const [editHovered, setEditHovered] = useState(false);

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      key={message.id}
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} w-full`}
    >
      <div
        className={`flex flex-col ${editingMessageId === message.id && "w-full"}`}
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
              message.role === "user" && setHoveredMessageId(message.id)
            }
            onMouseLeave={() => setHoveredMessageId(null)}
          >
            <div
              className={`${message.role !== "user" && "border-none"} p-2 rounded-3xl bg-white border border-blue-200 px-4 py-2`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {/* Edit Message */}
            <div
              className={`${message.role === "user" && "h-6"} flex justify-end ${hoveredMessageId === message.id ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
            >
              {message.role === "user" && hoveredMessageId === message.id && (
                <div className="flex flex-row space-x-1">
                  <button onClick={() => handleCopy(message.content)}>
                    <img
                      src={ChainIcon.src}
                      alt="Chain icon"
                      className="w-6 h-6"
                    />
                  </button>
                  <button
                    onClick={() => onEditMessage(message.id, message.content)}
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
        {message.role === "assistant" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mr-auto border border-blue-200 mt-2 pl-2 pr-3 py-1 rounded-3xl flex flex-row items-center text-sm">
                  <img
                    src={UsdcIcon.src}
                    alt="USDC symbol"
                    className="h-6 w-6 mr-1"
                  />
                  {isNaN(message.completionTokens) ? (
                    <p className="text-sub">Calculating...</p>
                  ) : (
                    `$ -${(message.promptTokens * TEXT_MODEL_PRICING[message.provider].userBilledInputPrice + message.completionTokens * TEXT_MODEL_PRICING[message.provider].userBilledOutputPrice).toFixed(4)}`
                  )}
                </div>
              </TooltipTrigger>
              {message.provider && (
                <TooltipContent side="bottom" align="start">
                  <p>
                    {message.promptTokens} prompt tokens ≡ $
                    {(
                      message.promptTokens *
                      TEXT_MODEL_PRICING[message.provider].userBilledInputPrice
                    ).toFixed(4)}
                  </p>
                  <p>
                    {message.completionTokens} completion tokens ≡ $
                    {(
                      message.completionTokens *
                      TEXT_MODEL_PRICING[message.provider].userBilledOutputPrice
                    ).toFixed(4)}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
