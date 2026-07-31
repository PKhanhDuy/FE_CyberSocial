import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { ArrowLeft, Hand, ImagePlus, Link as LinkIcon, Loader2, MessageCircle, Send, Smile, Video, X } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { friendApi, messageApi, uploadApi, type BackendMessage, type FriendUser, type Friendship, type MessageConversation, type MessageReaction, type MessageSocketEvent, type MessageType } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"
import { usePresenceStore } from "@/store/usePresenceStore"
import { useThemeStore } from "@/store/useThemeStore"
import { useTranslation } from "react-i18next"
import { optimizeCloudinaryImage } from "@/lib/media"

const WAVE_EMOJI = "\uD83D\uDC4B"
const reactionEmojis = ["\u2764\uFE0F", "\uD83D\uDE02", "\uD83D\uDE2E", "\uD83D\uDE22", "\uD83D\uDC4D", WAVE_EMOJI]

const avatarFor = (user: { id: string; displayName?: string; avatarUrl?: string; email?: string }) => (
  user.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email || user.id)}`
)

const messagePreview = (message?: BackendMessage) => {
  if (!message) return "Hay bat dau cuoc tro chuyen"
  if (message.messageType === "IMAGE") return "Da gui mot anh"
  if (message.messageType === "VIDEO") return "Da gui mot video"
  if (message.messageType === "LINK") return message.linkUrl || "Da gui mot lien ket"
  return message.content || ""
}

type DraftMode = "TEXT" | "LINK"

type PendingMedia = {
  file: File
  previewUrl: string
  messageType: "IMAGE" | "VIDEO"
}

export function Messages() {
  const { t } = useTranslation()
  const currentUser = useAuthStore((state) => state.user)
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  const isFriendOnline = usePresenceStore((state) => state.isOnline)
  const onlineIds = usePresenceStore((state) => state.onlineIds)
  const subscribeRealtime = usePresenceStore((state) => state.subscribe)
  const [friends, setFriends] = useState<Friendship[]>([])
  const [conversations, setConversations] = useState<MessageConversation[]>([])
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<MessageConversation | null>(null)
  const [messages, setMessages] = useState<BackendMessage[]>([])
  const [draft, setDraft] = useState("")
  const [draftMode, setDraftMode] = useState<DraftMode>("TEXT")
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpeningConversation, setIsOpeningConversation] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedConversationIdRef = useRef<string | null>(null)
  const conversationIdsRef = useRef<Set<string>>(new Set())

  const conversationByFriendId = useMemo(() => {
    return new Map(conversations.map((conversation) => [conversation.friend.id, conversation]))
  }, [conversations])

  const sortedFriends = useMemo(() => {
    return [...friends].sort((first, second) => {
      const firstConversation = conversationByFriendId.get(first.user.id)
      const secondConversation = conversationByFriendId.get(second.user.id)
      return new Date(secondConversation?.updatedAt || second.updatedAt).getTime() - new Date(firstConversation?.updatedAt || first.updatedAt).getTime()
    })
  }, [conversationByFriendId, friends])

  const loadInitialData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [friendData, conversationData] = await Promise.all([
        friendApi.list(),
        messageApi.conversations(),
      ])
      setFriends(friendData)
      setConversations(conversationData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("message.failedLoadData"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id ?? null
  }, [selectedConversation?.id])

  useEffect(() => {
    conversationIdsRef.current = new Set(conversations.map((conversation) => conversation.id))
  }, [conversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, selectedConversation?.id])

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(await messageApi.conversations())
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : t("message.failedRefresh"))
    }
  }, [])

  const openConversation = async (friend: FriendUser) => {
    setSelectedFriend(friend)
    setSelectedConversation(null)
    setMessages([])
    setIsOpeningConversation(true)
    setError(null)
    try {
      const conversation = conversationByFriendId.get(friend.id) ?? await messageApi.getOrCreateConversation(friend.id)
      setSelectedConversation(conversation)
      setConversations((current) => {
        const exists = current.some((item) => item.id === conversation.id)
        return exists ? current.map((item) => item.id === conversation.id ? conversation : item) : [conversation, ...current]
      })
      const response = await messageApi.messages(conversation.id)
      setMessages([...response.content].reverse())
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Khong mo duoc cuoc tro chuyen")
    } finally {
      setIsOpeningConversation(false)
    }
  }

  const clearPendingMedia = useCallback(() => {
    setPendingMedia((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return null
    })
  }, [])

  const closeConversation = () => {
    setSelectedFriend(null)
    setSelectedConversation(null)
    setMessages([])
    setDraft("")
    setDraftMode("TEXT")
    setIsEmojiOpen(false)
    clearPendingMedia()
    setError(null)
  }

  useEffect(() => {
    return () => {
      if (pendingMedia) {
        URL.revokeObjectURL(pendingMedia.previewUrl)
      }
    }
  }, [pendingMedia])

  const updateLatestMessage = (message: BackendMessage) => {
    setConversations((current) => current.map((conversation) => (
      conversation.id === message.conversationId
        ? { ...conversation, latestMessage: message, updatedAt: message.createdAt }
        : conversation
    )))
  }

  const upsertMessage = useCallback((message: BackendMessage) => {
    setMessages((current) => {
      const exists = current.some((item) => item.id === message.id)
      return exists
        ? current.map((item) => item.id === message.id ? message : item)
        : [...current, message]
    })
  }, [])

  const upsertRealtimeMessage = useCallback((message: BackendMessage) => {
    if (selectedConversationIdRef.current === message.conversationId) {
      upsertMessage(message)
    }

    setConversations((current) => current.map((conversation) => (
      conversation.id === message.conversationId
        ? { ...conversation, latestMessage: message, updatedAt: message.createdAt }
        : conversation
    )))

    if (!conversationIdsRef.current.has(message.conversationId)) {
      void refreshConversations()
    }
  }, [refreshConversations, upsertMessage])

  const updateRealtimeReaction = useCallback((event: MessageSocketEvent) => {
    if (event.type !== "REACTION_UPDATED" || !event.reaction) return

    const applyReaction = (message: BackendMessage) => {
      if (message.id !== event.messageId) return message
      const reactions = message.reactions.some((item) => item.userId === event.reaction.userId)
        ? message.reactions.map((item) => item.userId === event.reaction.userId ? event.reaction : item)
        : [...message.reactions, event.reaction]
      return { ...message, reactions }
    }

    setMessages((current) => current.map(applyReaction))
    setConversations((current) => current.map((conversation) => (
      conversation.latestMessage?.id === event.messageId
        ? { ...conversation, latestMessage: applyReaction(conversation.latestMessage) }
        : conversation
    )))
  }, [])

  const deleteRealtimeReaction = useCallback((event: MessageSocketEvent) => {
    if (event.type !== "REACTION_DELETED") return

    const removeReaction = (message: BackendMessage) => (
      message.id === event.messageId
        ? { ...message, reactions: message.reactions.filter((reaction) => reaction.userId !== event.userId) }
        : message
    )

    setMessages((current) => current.map(removeReaction))
    setConversations((current) => current.map((conversation) => (
      conversation.latestMessage?.id === event.messageId
        ? { ...conversation, latestMessage: removeReaction(conversation.latestMessage) }
        : conversation
    )))
  }, [])

  const handleRealtimeEvent = useCallback((event: MessageSocketEvent) => {
    if (event.type === "MESSAGE_CREATED" && event.message) {
      upsertRealtimeMessage(event.message)
      return
    }
    if (event.type === "REACTION_UPDATED") {
      updateRealtimeReaction(event)
      return
    }
    if (event.type === "REACTION_DELETED") {
      deleteRealtimeReaction(event)
    }
  }, [deleteRealtimeReaction, updateRealtimeReaction, upsertRealtimeMessage])

  useEffect(() => {
    return subscribeRealtime(handleRealtimeEvent)
  }, [handleRealtimeEvent, subscribeRealtime])

  const sendMessage = async (payload: { messageType: MessageType; content?: string; mediaUrl?: string; linkUrl?: string }) => {
    if (!selectedConversation || isSending) return
    setIsSending(true)
    setError(null)
    try {
      const message = await messageApi.sendMessage(selectedConversation.id, payload)
      updateLatestMessage(message)
      upsertMessage(message)
      setDraft("")
      setDraftMode("TEXT")
      setIsEmojiOpen(false)
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : t("message.failedSendMessages"))
    } finally {
      setIsSending(false)
    }
  }

  const submitDraft = async () => {
    if (pendingMedia) {
      await sendPendingMedia()
      return
    }

    const value = draft.trim()
    if (!value) return
    if (draftMode === "LINK") {
      sendMessage({ messageType: "LINK", linkUrl: value })
      return
    }
    sendMessage({ messageType: "TEXT", content: value })
  }

  const sendPendingMedia = async () => {
    if (!pendingMedia || !selectedConversation || isSending) return

    const { file, messageType } = pendingMedia
    setIsSending(true)
    setError(null)
    try {
      const uploaded = messageType === "VIDEO"
        ? await uploadApi.video(file)
        : await uploadApi.image(file)
      const message = await messageApi.sendMessage(selectedConversation.id, {
        messageType,
        mediaUrl: uploaded.url,
      })
      updateLatestMessage(message)
      upsertMessage(message)
      clearPendingMedia()
      setDraft("")
      setDraftMode("TEXT")
      setIsEmojiOpen(false)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("message.failedSendFile"))
    } finally {
      setIsSending(false)
    }
  }

  const sendWave = () => {
    sendMessage({ messageType: "TEXT", content: WAVE_EMOJI })
  }

  const openFilePicker = (accept: string) => {
    if (!fileInputRef.current) return
    fileInputRef.current.accept = accept
    fileInputRef.current.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !selectedConversation) return

    const isVideo = file.type.startsWith("video/")
    if (!isVideo && !file.type.startsWith("image/")) {
      setError(t("message.failedSendFile"))
      return
    }

    setPendingMedia((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        messageType: isVideo ? "VIDEO" : "IMAGE",
      }
    })
    setDraftMode("TEXT")
    setError(null)
  }

  const reactToMessage = async (messageId: string, emoji: string) => {
    try {
      const reaction = await messageApi.react(messageId, emoji)
      setMessages((current) => current.map((message) => {
        if (message.id !== messageId) return message
        const reactions = message.reactions.some((item) => item.userId === reaction.userId)
          ? message.reactions.map((item) => item.userId === reaction.userId ? reaction : item)
          : [...message.reactions, reaction]
        return { ...message, reactions }
      }))
    } catch (reactionError) {
      setError(reactionError instanceof Error ? reactionError.message : t("message.failedSendEmoji"))
    }
  }

  const renderMessageContent = (message: BackendMessage) => {
    if (message.messageType === "IMAGE" && message.mediaUrl) {
      return (
        <img
          src={optimizeCloudinaryImage(message.mediaUrl, 800)}
          alt=""
          loading="lazy"
          decoding="async"
          className="max-h-64 rounded-lg object-cover"
        />
      )
    }
    if (message.messageType === "VIDEO" && message.mediaUrl) {
      return <video src={message.mediaUrl} controls className="max-h-64 rounded-lg bg-black" />
    }
    if (message.messageType === "LINK" && message.linkUrl) {
      return (
        <a href={message.linkUrl} target="_blank" rel="noreferrer" className="break-all text-accent-blue underline underline-offset-4">
          {message.linkUrl}
        </a>
      )
    }
    return <span className="whitespace-pre-wrap break-words">{message.content}</span>
  }

  if (!selectedFriend) {
    return (
      <div className="space-y-5 py-4 text-foreground">
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold tracking-wider text-foreground flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-accent-blue" />
            {t("nav.messages")}
          </h1>
        </div>

        {error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-foreground">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-border bg-panel/45">
          <div className="border-b border-border p-4">
            <div className="text-sm font-bold uppercase tracking-wider text-muted">{t("message.listFriend")}</div>
          </div>
          <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-2">
            {isLoading && (
              <div className="flex items-center justify-center py-10 text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {!isLoading && sortedFriends.length === 0 && (
              <div className="px-3 py-10 text-center text-sm text-muted">{t("message.noFriends")}</div>
            )}
            {sortedFriends.map((friendship) => {
              const friend = friendship.user
              const conversation = conversationByFriendId.get(friend.id)
              const online = isFriendOnline(friend.id)
              return (
                <button
                  key={friendship.id}
                  type="button"
                  onClick={() => openConversation(friend)}
                  className="flex w-full items-center gap-4 rounded-lg p-4 text-left transition-colors hover:bg-panel-hover"
                >
                  <div className="relative shrink-0">
                    <Avatar src={avatarFor(friend)} fallback={friend.displayName[0] || "U"} className="h-12 w-12" />
                    {online && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-panel bg-green-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-foreground">{friend.displayName}</div>
                    <div className="truncate text-sm text-muted">{messagePreview(conversation?.latestMessage)}</div>
                  </div>
                  {online && <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]" />}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="py-4">
      <section className="flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] min-h-[32rem] overflow-hidden rounded-xl border border-border bg-background/60 shadow-xl">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 flex items-center gap-3 border-b border-border bg-background/95 p-4 backdrop-blur">
            <button
              type="button"
              onClick={closeConversation}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:bg-panel-hover hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="relative shrink-0">
              <Avatar src={avatarFor(selectedFriend)} fallback={selectedFriend.displayName[0] || "U"} className="h-11 w-11" />
              {isFriendOnline(selectedFriend.id) && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-400" />}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate font-bold text-foreground">{selectedFriend.displayName}</div>
              <div className="text-xs text-muted">
                {isFriendOnline(selectedFriend.id) || onlineIds.has(selectedFriend.id) ? "Đang online" : "Offline"}
              </div>
            </div>
          </div>

          {error && (
            <div className="m-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-foreground">
              {error}
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-4">
            {isOpeningConversation && (
              <div className="flex justify-center py-8 text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {!isOpeningConversation && messages.length === 0 && (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-muted">
                <button
                  type="button"
                  onClick={sendWave}
                  disabled={isSending || !selectedConversation}
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-accent-blue/40 bg-accent-blue/10 text-accent-blue transition-colors hover:bg-accent-blue/20 disabled:opacity-50"
                >
                  <Hand className="h-8 w-8" />
                </button>
                <div className="font-bold text-foreground">{t("message.startChat")}</div>
              </div>
            )}
            {messages.map((message) => {
              const isOwn = message.sender.id === currentUser?.id
              return (
                <div key={message.id} className={cn("group relative flex", isOwn ? "justify-end" : "justify-start")}>
                  <div className={cn("relative flex max-w-[78%] flex-col", isOwn && "items-end")}>
                    <div className={cn(
                      "rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-md ring-1",
                      isOwn
                        ? "bg-gradient-to-br from-accent-blue to-cyan-400 text-white shadow-accent-blue/20 ring-white/10"
                        : "bg-panel text-foreground shadow-black/5 ring-border"
                    )}>
                      {renderMessageContent(message)}
                    </div>
                    {message.reactions.length > 0 && (
                      <div className={cn("mt-1 flex flex-wrap gap-1", isOwn ? "justify-end" : "justify-start")}>
                        {message.reactions.map((reaction: MessageReaction) => (
                          <span key={reaction.id} className="rounded-full border border-border bg-background px-2 py-0.5 text-xs">
                            {reaction.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                    <div
                      className={cn(
                        "pointer-events-none absolute top-full z-20 mt-1 flex w-max gap-1 rounded-full border border-border bg-background/95 px-2 py-1 opacity-0 shadow-lg backdrop-blur transition-opacity group-hover:pointer-events-auto group-hover:opacity-100",
                        isOwn ? "right-0" : "left-0"
                      )}
                    >
                      {reactionEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => reactToMessage(message.id, emoji)}
                          className="rounded-full px-1.5 py-0.5 text-xs transition-colors hover:bg-panel-hover"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-auto shrink-0 border-t border-border bg-background/95 p-4 backdrop-blur">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {pendingMedia && (
              <div className="mb-3">
                <div className="relative inline-block">
                  <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
                    {pendingMedia.messageType === "IMAGE" ? (
                      <img
                        src={pendingMedia.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <video
                        src={pendingMedia.previewUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearPendingMedia}
                    disabled={isSending}
                    aria-label={t("message.removeAttachment")}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="mb-2 flex items-center gap-2">
              <button type="button" onClick={() => openFilePicker("image/*")} className="rounded-lg p-2 text-accent-blue hover:bg-accent-blue/10">
                <ImagePlus className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => openFilePicker("video/*")} className="rounded-lg p-2 text-accent-pink hover:bg-accent-pink/10">
                <Video className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setDraftMode((mode) => mode === "LINK" ? "TEXT" : "LINK")}
                className={cn("rounded-lg p-2 hover:bg-panel-hover", draftMode === "LINK" ? "text-accent-blue" : "text-muted")}
              >
                <LinkIcon className="h-5 w-5" />
              </button>
              <div className="relative">
                <button type="button" onClick={() => setIsEmojiOpen((open) => !open)} className="rounded-lg p-2 text-yellow-400 hover:bg-yellow-400/10">
                  <Smile className="h-5 w-5" />
                </button>
                {isEmojiOpen && (
                  <div className="absolute bottom-11 left-0 z-20 overflow-hidden rounded-lg border border-border bg-panel shadow-xl">
                    <EmojiPicker
                      theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                      onEmojiClick={(emojiObject) => setDraft((value) => value + emojiObject.emoji)}
                      autoFocusSearch={false}
                      width={320}
                      height={360}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    submitDraft()
                  }
                }}
                placeholder={draftMode === "LINK" ? t("message.linkPlaceholder") : t("message.inputPlaceholder")}
                className="h-11 flex-1 rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent-blue"
              />
              <Button
                type="button"
                variant="neon-blue"
                className="gap-2"
                onClick={submitDraft}
                disabled={isSending || !selectedConversation || (!draft.trim() && !pendingMedia)}
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
