import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import {
  X,
  Search,
  Plus,
  Send,
  Smile,
  Loader2,
  Users,
  UserRound,
  AlertCircle,
  MessageSquare,
  ChevronLeft,
  Check,
} from "lucide-react";

import { apiRequest, API_URL } from "../../lib/api";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function initialsOf(name) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (isToday) return "Today";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤔","😴",
  "👍","👎","👏","🙏","💪","🔥","✅","❌","⭐","🎉",
  "❤️","💯","😢","😭","😅","😳","🥳","🤝","👀","💡",
  "📌","📎","📅","⏰","☕","🍕","🚀","💰","📈","🎯",
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ChatPanel({ currentUser }) {
  const myId = currentUser?.id;

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState("all"); // "all" | "unread"

  // New-chat modal state
  const [newOpen, setNewOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const socketRef = useRef(null);
  const threadEndRef = useRef(null);
  const activeIdRef = useRef(null);

  activeIdRef.current = activeId;

  /* ---- Socket lifecycle ------------------------------------------ */

  useEffect(() => {
    const socket = io(API_URL, {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.error("Chat socket error:", err.message);
    });

    // New message in a conversation we're viewing.
    socket.on("message:new", (msg) => {
      if (msg.conversationId === activeIdRef.current) {
        setMessages((current) => {
          if (current.some((m) => m.id === msg.id)) return current;
          return [...current, msg];
        });
      }
    });

    // Any conversation got a new message — bump it in the list.
    socket.on("conversation:activity", ({ conversationId, lastMessage }) => {
      setConversations((current) => {
        const idx = current.findIndex((c) => c.id === conversationId);
        if (idx === -1) {
          // A conversation we didn't know about — refetch the list.
          loadConversations();
          return current;
        }
        const isOpen = conversationId === activeIdRef.current;
        const updated = {
          ...current[idx],
          lastMessage,
          updatedAt: lastMessage.createdAt,
          unreadCount: isOpen
            ? 0
            : (current[idx].unreadCount || 0) + 1,
        };
        const next = current.slice();
        next.splice(idx, 1);
        return [updated, ...next];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Data loading ---------------------------------------------- */

  async function loadConversations() {
    setLoadingList(true);
    setError("");
    try {
      const data = await apiRequest("/api/client/chat");
      setConversations(
        Array.isArray(data.conversations) ? data.conversations : []
      );
    } catch (err) {
      setError(err?.data?.message || "Unable to load chats");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadMessages(conversationId) {
    setLoadingThread(true);
    setError("");
    try {
      const data = await apiRequest(
        `/api/client/chat/${conversationId}/messages`
      );
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      setError(err?.data?.message || "Unable to load messages");
    } finally {
      setLoadingThread(false);
    }
  }

  async function loadUsers() {
    try {
      const data = await apiRequest("/api/client/chat/users");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("Unable to load users:", err);
    }
  }

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join/leave conversation rooms as the active conversation changes.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeId) return undefined;
    socket.emit("conversation:join", activeId);
    loadMessages(activeId);
    // Clear unread badge for the opened conversation.
    setConversations((current) =>
      current.map((c) =>
        c.id === activeId ? { ...c, unreadCount: 0 } : c
      )
    );
    return () => {
      socket.emit("conversation:leave", activeId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Auto-scroll to newest message.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---- Actions --------------------------------------------------- */

  function insertEmoji(emoji) {
    setDraft((current) => current + emoji);
  }

  function sendMessage() {
    const body = draft.trim();
    if (!body || !activeId || sending) return;
    const socket = socketRef.current;
    if (!socket) return;

    setSending(true);
    socket.emit("message:send", { conversationId: activeId, body }, (resp) => {
      setSending(false);
      if (resp?.ok) {
        setDraft("");
        // The message will arrive via message:new; add optimistically too.
        setMessages((current) => {
          if (current.some((m) => m.id === resp.message.id)) return current;
          return [...current, resp.message];
        });
      } else {
        setError(resp?.error || "Message failed to send");
      }
    });
  }

  function openNewChat() {
    setSelectedIds([]);
    setGroupName("");
    setUserSearch("");
    setNewOpen(true);
    loadUsers();
  }

  function toggleUser(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  }

  async function createConversation() {
    if (selectedIds.length === 0 || creating) return;
    const isGroup = selectedIds.length > 1;
    if (isGroup && !groupName.trim()) {
      setError("Group name is required");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const data = await apiRequest("/api/client/chat", {
        method: "POST",
        body: JSON.stringify({
          isGroup,
          name: isGroup ? groupName.trim() : null,
          memberIds: selectedIds,
        }),
      });
      setNewOpen(false);
      await loadConversations();
      if (data.conversation?.id) {
        setActiveId(data.conversation.id);
      }
    } catch (err) {
      setError(err?.data?.message || "Unable to start chat");
    } finally {
      setCreating(false);
    }
  }

  /* ---- Derived --------------------------------------------------- */

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (listFilter === "unread") {
      list = list.filter((c) => (c.unreadCount || 0) > 0);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        String(c.title).toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, search, listFilter]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  // Group messages by day for date separators.
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDay = null;
    messages.forEach((m) => {
      const day = formatDay(m.createdAt);
      if (day !== currentDay) {
        groups.push({ type: "day", day, key: `day-${m.id}` });
        currentDay = day;
      }
      groups.push({ type: "msg", message: m, key: m.id });
    });
    return groups;
  }, [messages]);

  /* ---- Render ---------------------------------------------------- */

  return (
    <div className="flex h-[calc(100vh-104px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <MessageSquare size={17} />
            </span>
            <div>
              <div className="text-sm font-black text-slate-950">Chats</div>
              <div className="text-[11px] text-slate-500">
                Message your team in real time.
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* BODY */}
        <div className="flex min-h-0 flex-1">
          {/* LEFT: conversation list */}
          <div
            className={`flex w-full flex-shrink-0 flex-col border-r border-slate-200 lg:w-[300px] ${
              activeId ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="border-b border-slate-100 p-3">
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-brand-400"
                />
              </div>
              <button
                type="button"
                onClick={openNewChat}
                className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-xs font-bold text-white hover:bg-brand-700"
              >
                <Plus size={14} />
                New chat
              </button>

              <div className="mt-2 flex gap-1">
                {[
                  ["all", "All"],
                  ["unread", "Unread"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setListFilter(value)}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      listFilter === value
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Loading...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-slate-500">
                  No chats yet. Start one with “New chat”.
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const active = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={`flex w-full items-center gap-3 border-b border-slate-50 px-3 py-3 text-left transition-colors ${
                        active ? "bg-brand-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          c.isGroup
                            ? "bg-violet-100 text-violet-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {c.isGroup ? <Users size={16} /> : initialsOf(c.title)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-bold text-slate-900">
                          {c.title}
                        </div>
                        <div className="truncate text-[11px] text-slate-500">
                          {c.lastMessage
                            ? c.lastMessage.body
                            : c.isGroup
                            ? `${c.members.length} members`
                            : "No messages yet"}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        {c.lastMessage && (
                          <span className="text-[9px] font-semibold text-slate-400">
                            {formatTime(c.lastMessage.createdAt)}
                          </span>
                        )}
                        {(c.unreadCount || 0) > 0 && (
                          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                            {c.unreadCount > 9 ? "9+" : c.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: thread */}
          <div
            className={`flex min-h-0 min-w-0 flex-1 flex-col ${
              activeId ? "flex" : "hidden lg:flex"
            }`}
          >
            {activeConversation ? (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
                    aria-label="Back"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${
                      activeConversation.isGroup
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {activeConversation.isGroup ? (
                      <Users size={15} />
                    ) : (
                      initialsOf(activeConversation.title)
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-950">
                      {activeConversation.title}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      {activeConversation.isGroup
                        ? activeConversation.members
                            .map((m) => m.name)
                            .join(", ")
                        : activeConversation.otherMembers[0]?.email || ""}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 px-4 py-4">
                  {loadingThread ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
                      <Loader2 size={14} className="animate-spin" />
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
                      No messages yet. Say hello 👋
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groupedMessages.map((item) => {
                        if (item.type === "day") {
                          return (
                            <div
                              key={item.key}
                              className="my-3 flex items-center justify-center"
                            >
                              <span className="rounded-full bg-slate-200/70 px-3 py-1 text-[10px] font-bold text-slate-500">
                                {item.day}
                              </span>
                            </div>
                          );
                        }

                        const m = item.message;
                        const mine = m.sender?.id === myId;
                        return (
                          <div
                            key={item.key}
                            className={`flex ${
                              mine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                                mine
                                  ? "bg-brand-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-800"
                              }`}
                            >
                              {!mine && activeConversation.isGroup && (
                                <div className="mb-0.5 text-[10px] font-bold text-brand-600">
                                  {m.sender?.name}
                                </div>
                              )}
                              <div className="whitespace-pre-wrap break-words text-[13px] leading-snug">
                                {m.body}
                              </div>
                              <div
                                className={`mt-0.5 text-right text-[9px] ${
                                  mine ? "text-white/70" : "text-slate-400"
                                }`}
                              >
                                {formatTime(m.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={threadEndRef} />
                    </div>
                  )}
                </div>

                {/* Composer */}
                <div className="border-t border-slate-100 p-3">
                  <div className="flex items-end gap-2">
                    {/* Emoji picker */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEmojiOpen((o) => !o)}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Emoji"
                      >
                        <Smile size={18} />
                      </button>

                      {emojiOpen && (
                        <>
                          <button
                            type="button"
                            aria-label="Close emoji picker"
                            onClick={() => setEmojiOpen(false)}
                            className="fixed inset-0 z-[10] cursor-default"
                          />
                          <div className="absolute bottom-12 left-0 z-[20] w-[280px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                            <div className="grid grid-cols-8 gap-1">
                              {EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => insertEmoji(emoji)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-slate-100"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={1}
                      placeholder="Type a message"
                      className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending || !draft.trim()}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
                      aria-label="Send"
                    >
                      {sending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                <MessageSquare size={40} strokeWidth={1.5} />
                <div className="text-sm font-semibold">
                  Select a chat to start messaging
                </div>
              </div>
            )}
          </div>
        </div>

      {/* NEW CHAT MODAL */}
      {newOpen && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="text-sm font-black text-slate-950">New chat</div>
              <button
                type="button"
                onClick={() => setNewOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-slate-100 p-3">
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search people"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-brand-400"
                />
              </div>
              {selectedIds.length > 1 && (
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-400"
                />
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {filteredUsers.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-slate-500">
                  No people found.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const selected = selectedIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selected ? "bg-brand-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-black text-slate-700">
                        {initialsOf(u.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-bold text-slate-900">
                          {u.name}
                        </div>
                        <div className="truncate text-[11px] text-slate-500">
                          {u.email}
                        </div>
                      </div>
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {selected && <Check size={12} />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
              <span className="text-[11px] font-semibold text-slate-500">
                {selectedIds.length === 0
                  ? "Select people"
                  : selectedIds.length === 1
                  ? "1-to-1 chat"
                  : `Group of ${selectedIds.length}`}
              </span>
              <button
                type="button"
                onClick={createConversation}
                disabled={selectedIds.length === 0 || creating}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Start chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
