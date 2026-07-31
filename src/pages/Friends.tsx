import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Check, Search, UserMinus, UserPlus, Users, X } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { friendApi, type FriendUser, type Friendship } from "@/lib/api"
import { useFriendStore } from "@/store/useFriendStore"
import { usePresenceStore } from "@/store/usePresenceStore"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

type TabId = "friends" | "incoming" | "outgoing"

const TABS: Array<{ id: TabId; labelKey: string }> = [
  { id: "friends", labelKey: "nav.friends" },
  { id: "incoming", labelKey: "friends.invitation" },
  { id: "outgoing", labelKey: "friends.sent" },
]

const makeHandle = (value: string) => `@${value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`

const avatarFor = (user: FriendUser) => user.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email || user.id)}`

interface PersonRowProps {
  user: FriendUser
  subtitle?: string
  online?: boolean
  children?: ReactNode
}

function PersonRow({ user, subtitle, online, children }: PersonRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-panel/60">
      <div className="relative shrink-0">
        <Avatar src={avatarFor(user)} fallback={user.displayName[0] || "U"} className="h-12 w-12" />
        {online && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-panel bg-green-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-bold text-foreground truncate">{user.displayName}</div>
          {online && <span className="text-xs font-semibold text-green-400">Online</span>}
        </div>
        <div className="text-sm text-muted font-mono truncate">{subtitle || makeHandle(user.displayName || user.email)}</div>
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  )
}

interface FriendshipRowProps {
  friendship: Friendship
  kind: TabId
  online?: boolean
  onAccept: (id: string) => void
  onDeleteRequest: (id: string) => void
  onRemoveFriend: (id: string) => void
  isBusy: boolean
}

function FriendshipRow({ friendship, kind, online, onAccept, onDeleteRequest, onRemoveFriend, isBusy }: FriendshipRowProps) {
  const { t } = useTranslation()

  if (kind === "friends") {
    return (
      <PersonRow user={friendship.user} subtitle={t("friends.connected")} online={online}>
        <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onRemoveFriend(friendship.id)}>
          <UserMinus className="w-4 h-4 mr-2" />
          {t("friends.cancel")}
        </Button>
      </PersonRow>
    )
  }

  if (kind === "incoming") {
    return (
      <PersonRow user={friendship.user} subtitle="Đã gửi lời mời cho bạn">
        <Button size="sm" variant="neon-blue" disabled={isBusy} onClick={() => onAccept(friendship.id)}>
          <Check className="w-4 h-4 mr-2" />
          {t("friends.accept")}
        </Button>
        <Button size="icon" variant="outline" disabled={isBusy} onClick={() => onDeleteRequest(friendship.id)} title="Từ chối">
          <X className="w-4 h-4" />
        </Button>
      </PersonRow>
    )
  }

  return (
    <PersonRow user={friendship.user} subtitle={t("friends.pendingRes")}>
      <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onDeleteRequest(friendship.id)}>
        <X className="w-4 h-4 mr-2" />
        {t("friends.cancelRequest")}
      </Button>
    </PersonRow>
  )
}

export function Friends() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>("friends")
  const [friends, setFriends] = useState<Friendship[]>([])
  const [incoming, setIncoming] = useState<Friendship[]>([])
  const [outgoing, setOutgoing] = useState<Friendship[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<FriendUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const loadIncomingRequestCount = useFriendStore((state) => state.loadIncomingRequestCount)
  const onlineIds = usePresenceStore((state) => state.onlineIds)
  const isFriendOnline = usePresenceStore((state) => state.isOnline)
  const activeList = useMemo(() => {
    if (activeTab === "incoming") return incoming
    if (activeTab === "outgoing") return outgoing
    return friends
  }, [activeTab, friends, incoming, outgoing])

  const loadFriends = async () => {
    setError(null)
    try {
      const [friendsData, incomingData, outgoingData] = await Promise.all([
        friendApi.list(),
        friendApi.incomingRequests(),
        friendApi.outgoingRequests(),
      ])
      setFriends(friendsData)
      setIncoming(incomingData)
      setOutgoing(outgoingData)
      loadIncomingRequestCount()
    } catch (error) {
      setError(error instanceof Error ? error.message : t("friends.noDownload"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFriends()
  }, [])

  useEffect(() => {
    const query = searchQuery.trim()
    if (!query) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await friendApi.search(query)
        setSearchResults(response.content)
      } catch (error) {
        setError(error instanceof Error ? error.message : t("friends.noFound"))
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  const refreshAfterAction = async () => {
    await loadFriends()
    if (searchQuery.trim()) {
      const response = await friendApi.search(searchQuery.trim())
      setSearchResults(response.content)
    }
  }

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id)
    setError(null)
    try {
      await action()
      await refreshAfterAction()
    } catch (error) {
      setError(error instanceof Error ? error.message : t("friends.noAcceptInvitation"))
    } finally {
      setBusyId(null)
    }
  }

  const renderSearchAction = (user: FriendUser) => {
    if (user.relationshipStatus === "ACCEPTED") {
      return <span className="text-sm text-green-400 font-bold">{t("nav.friends")}</span>
    }

    if (user.relationshipStatus === "PENDING") {
      return (
        <Button size="sm" variant="outline" disabled={busyId === user.friendshipId} onClick={() => user.friendshipId && runAction(user.friendshipId, () => friendApi.deleteRequest(user.friendshipId!))}>
          <X className="w-4 h-4 mr-2" />
          {t("friends.cancelRequest")}
        </Button>
      )
    }

    return (
      <Button size="sm" variant="neon-blue" disabled={busyId === user.id} onClick={() => runAction(user.id, () => friendApi.sendRequest(user.id))}>
        <UserPlus className="w-4 h-4 mr-2" />
        {t("friends.addFriend")}
      </Button>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-wider flex items-center gap-3">
          <Users className="w-6 h-6 text-accent-blue" />
          {t("nav.friends")}
        </h1>
        <p className="text-muted mt-2">{t("friends.description")}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t("friends.findPlaceholder")}
          className="w-full bg-panel border border-border rounded-lg pl-12 pr-4 py-3 text-foreground outline-none focus:border-accent-blue focus:shadow-[var(--shadow-neon-blue)]"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-sm text-foreground">
          {error}
        </div>
      )}

      {searchQuery.trim() && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{t("friends.findResults")}</h2>
            {isSearching && <span className="text-sm text-muted font-mono">{t("friends.finding")}</span>}
          </div>
          <div className="space-y-3">
            {searchResults.map((user) => (
              <PersonRow key={user.id} user={user}>
                {renderSearchAction(user)}
              </PersonRow>
            ))}
            {!isSearching && searchResults.length === 0 && (
              <div className="text-center py-6 text-muted font-mono border border-border rounded-lg bg-panel/50">
                {t("friends.noFound")}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="flex gap-2 border-b border-border overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-3 border-b-2 font-bold tracking-wider text-sm transition-colors shrink-0",
              activeTab === tab.id
                ? "border-accent-blue text-accent-blue"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t(tab.labelKey)}
            <span className="ml-2 text-xs text-muted">
              {tab.id === "friends" ? friends.length : tab.id === "incoming" ? incoming.length : outgoing.length}
            </span>
          </button>
        ))}
      </div>

      <section className="space-y-3">
        {isLoading && (
          <div className="text-center py-8 text-muted font-mono">{t("friends.downloading")}</div>
        )}

        {!isLoading && activeList.map((friendship) => (
          <FriendshipRow
            key={friendship.id}
            friendship={friendship}
            kind={activeTab}
            online={activeTab === "friends" && (isFriendOnline(friendship.user.id) || onlineIds.has(friendship.user.id))}
            isBusy={busyId === friendship.id}
            onAccept={(id) => runAction(id, () => friendApi.acceptRequest(id))}
            onDeleteRequest={(id) => runAction(id, () => friendApi.deleteRequest(id))}
            onRemoveFriend={(id) => runAction(id, () => friendApi.removeFriend(id))}
          />
        ))}

        {!isLoading && activeList.length === 0 && (
          <div className="text-center py-8 text-muted font-mono border border-border rounded-lg bg-panel/50">
            {activeTab === "friends" && t("friends.noFriends")}
            {activeTab === "incoming" && t("friends.noInvitations")}
            {activeTab === "outgoing" && t("friends.noSent")}
          </div>
        )}
      </section>
    </div>
  )
}
