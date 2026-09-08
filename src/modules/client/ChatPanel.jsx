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
  Video,
  Smile,
  PinOff,
  Pin,
  Bell,
  BellOff,
  Star,
  Loader2,
  Users,
  AlertCircle,
  MessageSquare,
  ChevronLeft,
  Check,
  Archive,
  Mail,
} from "lucide-react";

import MeetingRoom from "./MeetingRoom";
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

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-fuchsia-400 to-purple-500",
  "from-cyan-400 to-sky-500",
];

function avatarGradient(name) {
  const str = String(name || "?");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
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

const MEETING_PREFIX = "\uD83D\uDCF9 Meeting started \u2014 join: ";
const JITSI_BASE = "https://meet.jit.si/";

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
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingRoom, setMeetingRoom] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

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

    socket.on("message:new", (msg) => {
      if (msg.conversationId === activeIdRef.current) {
        setMessages((current) => {
          if (current.some((m) => m.id === msg.id)) return current;
          return [...current, msg];
        });
      }
    });

    socket.on("conversation:activity", ({ conversationId, lastMessage }) => {
      setConversations((current) => {
        const idx = current.findIndex((c) => c.id === conversationId);
        if (idx === -1) {
          loadConversations();
          return current;
        }
        const isOpen = conversationId === activeIdRef.current;
        const updated = {
          ...current[idx],
          lastMessage,
          updatedAt: lastMessage.createdAt,
          unreadCount: isOpen ? 0 : (current[idx].unreadCount || 0) + 1,
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

  async function loadConversations() {
    setLoadingList(true);
    setError("");
    try {
      const data = await apiRequest("/api/client/chat");
      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
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
      const data = await apiRequest(`/api/client/chat/${conversationId}/messages`);
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

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeId) return undefined;
    socket.emit("conversation:join", activeId);
    loadMessages(activeId);
    setConversations((current) =>
      current.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
    );
    return () => socket.emit("conversation:leave", activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function insertEmoji(emoji) {
    setDraft((current) => current + emoji);
  }

  async function toggleFavorite(conv, e) {
    e?.stopPropagation();
    const next = !conv.isFavorite;
    setConversations((current) =>
      current.map((c) => (c.id === conv.id ? { ...c, isFavorite: next } : c))
    );
    try {
      await apiRequest(`/api/client/chat/${conv.id}/favorite`, {
        method: "PATCH",
        body: JSON.stringify({ isFavorite: next }),
      });
    } catch {
      setConversations((current) =>
        current.map((c) => (c.id === conv.id ? { ...c, isFavorite: !next } : c))
      );
    }
  }

  async function toggleMute(conv) {
    const next = !conv.isMuted;
    setConversations((current) =>
      current.map((c) => (c.id === conv.id ? { ...c, isMuted: next } : c))
    );
    try {
      await apiRequest(`/api/client/chat/${conv.id}/mute`, {
        method: "PATCH",
        body: JSON.stringify({ isMuted: next }),
      });
    } catch {
      setConversations((current) =>
        current.map((c) => (c.id === conv.id ? { ...c, isMuted: !next } : c))
      );
    }
  }

  async function toggleArchive(conv) {
    const next = !conv.isArchived;
    setConversations((current) =>
      current.map((c) => (c.id === conv.id ? { ...c, isArchived: next } : c))
    );
    try {
      await apiRequest(`/api/client/chat/${conv.id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ isArchived: next }),
      });
      if (next && activeId === conv.id) setActiveId(null);
    } catch {
      setConversations((current) =>
        current.map((c) => (c.id === conv.id ? { ...c, isArchived: !next } : c))
      );
    }
  }

  async function togglePin(message) {
    const next = !message.pinned;
    setMessages((current) =>
      current.map((m) => (m.id === message.id ? { ...m, pinned: next } : m))
    );
    try {
      await apiRequest(`/api/client/chat/messages/${message.id}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ pinned: next }),
      });
    } catch {
      setMessages((current) =>
        current.map((m) => (m.id === message.id ? { ...m, pinned: !next } : m))
      );
    }
  }

  function startMeeting() {
    if (!activeId) return;
    const socket = socketRef.current;
    if (!socket) return;

    const room = `consulbuzz-${activeId.slice(0, 8)}-${Date.now().toString(36)}`;
    socket.emit(
      "message:send",
      { conversationId: activeId, body: `${MEETING_PREFIX}${JITSI_BASE}${room}` },
      (resp) => {
        if (resp?.ok) {
          setMessages((current) => {
            if (current.some((m) => m.id === resp.message.id)) return current;
            return [...current, resp.message];
          });
        }
      }
    );
    setMeetingRoom(room);
    setMeetingOpen(true);
  }

  function joinMeeting(room) {
    setMeetingRoom(room);
    setMeetingOpen(true);
  }

  function meetingRoomFromBody(body) {
    const idx = String(body).indexOf(JITSI_BASE);
    if (idx === -1) return null;
    const url = String(body).slice(idx + JITSI_BASE.length).trim();
    return url.split(/\s/)[0] || null;
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
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
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
      if (data.conversation?.id) setActiveId(data.conversation.id);
    } catch (err) {
      setError(err?.data?.message || "Unable to start chat");
    } finally {
      setCreating(false);
    }
  }

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = conversations.filter((c) => !c.isArchived);
    if (q) {
      list = list.filter((c) =>
        String(c.title || "").toLowerCase().includes(q) ||
        String(c.lastMessage?.body || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, search]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const pinnedMessages = useMemo(() => messages.filter((m) => m.pinned), [messages]);

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


  return (
    <div className="flex h-[calc(100vh-104px)] w-full flex-col overflow-hidden bg-[#f5f5f4]">
      <style>{`
        .cb-bubble { transition: transform .15s ease, box-shadow .15s ease; }
        .cb-bubble:hover { transform: translateY(-1px); }
        .cb-send { transition: transform .15s ease, box-shadow .15s ease; }
        .cb-send:hover:not(:disabled) { transform: translateY(-1px) scale(1.03); box-shadow: 0 8px 20px rgba(79,70,229,.28); }
      `}</style>

      <div className="bg-[#f5f5f4] px-5 pb-4 pt-1 sm:px-7">
        <h1 className="cb-page-title text-neutral-950">Chat</h1>
        <div className="cb-page-subtitle mt-2 flex items-center gap-2 text-neutral-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Direct messages & group chats · meeting links · shareable invites
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="mx-5 mb-5 flex min-h-0 flex-1 overflow-hidden rounded-[16px] border border-neutral-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] sm:mx-7">
        {/* LEFT NAV + CHAT LIST */}
        <div className={`w-full flex-shrink-0 border-r border-slate-200 bg-white lg:flex lg:w-[350px] lg:flex-col ${activeId ? "hidden" : "flex flex-col"}`}>
          <div className="flex h-[66px] items-center justify-between border-b border-neutral-200 px-4">
            <div className="text-[15px] font-bold text-neutral-950">Chats</div>
            <button
              type="button"
              onClick={openNewChat}
              className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-neutral-300 bg-white px-3.5 text-[12px] font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
            >
              <Plus size={14} />
              New
            </button>
          </div>

          <div className="px-3 pb-2 pt-3">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats, people and messages..."
                className="h-10 w-full rounded-[9px] border border-neutral-400 bg-white pl-9 pr-3 text-[12px] font-medium text-neutral-800 outline-none placeholder:text-neutral-500 focus:border-neutral-700"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
                <Loader2 size={14} className="animate-spin" /> Loading...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-5 py-12 text-center text-xs leading-5 text-slate-400">
                No chats found.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const active = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`mx-2 flex w-[calc(100%-16px)] items-center gap-3 rounded-[11px] border px-3 py-2.5 text-left transition ${active ? "border-emerald-200 bg-emerald-50" : "border-transparent hover:bg-neutral-50"}`}
                  >
                    <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${c.isGroup ? "bg-neutral-100 text-neutral-600" : "bg-indigo-100 text-indigo-600"}`}>
                      {c.isGroup ? <Users size={16} /> : initialsOf(c.title)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="truncate text-[13px] font-bold tracking-[-0.01em] text-slate-900">{c.title}</div>
                        {c.isMuted && <BellOff size={11} className="flex-shrink-0 text-slate-400" />}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-slate-500">
                        {c.lastMessage ? c.lastMessage.body : c.isGroup ? `${c.members.length} members` : "No messages yet"}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      {c.lastMessage && <span className="text-[9px] font-semibold text-slate-400">{formatTime(c.lastMessage.createdAt)}</span>}
                      <div className="flex items-center gap-1.5">
                        {c.isFavorite && <Star size={12} className="fill-amber-400 text-amber-400" />}
                        {(c.unreadCount || 0) > 0 && !c.isMuted && (
                          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white">
                            {c.unreadCount > 9 ? "9+" : c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER THREAD */}
        <div className={`min-h-0 min-w-0 flex-1 flex-col ${activeId ? "flex" : "hidden lg:flex"}`}>
          {activeConversation ? (
            <>
              <div className="flex h-[66px] flex-shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4">
                <button type="button" onClick={() => setActiveId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Back">
                  <ChevronLeft size={17} />
                </button>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${activeConversation.isGroup ? "bg-gradient-to-br from-violet-500 to-purple-600" : `bg-gradient-to-br ${avatarGradient(activeConversation.title)}`}`}>
                  {activeConversation.isGroup ? <Users size={16} /> : initialsOf(activeConversation.title)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold tracking-[-0.01em] text-slate-900">{activeConversation.title}</div>
                  <div className="truncate text-[10px] text-slate-500">
                    {activeConversation.isGroup ? `${activeConversation.members.length} members` : activeConversation.otherMembers[0]?.email || "Team member"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startMeeting}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                  title="Start meeting"
                >
                  <Video size={14} />
                  <span className="hidden sm:inline">Meet now</span>
                </button>
              </div>

              {pinnedMessages.length > 0 && (
                <div className="border-b border-amber-200 bg-amber-50/80 px-4 py-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700">
                    <Pin size={11} /> {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? "s" : ""}
                    <span className="min-w-0 flex-1 truncate font-medium text-amber-900">{pinnedMessages[0]?.body}</span>
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5 sm:px-5">
                {loadingThread ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"><MessageSquare size={21} strokeWidth={1.6} /></span>
                    <div><div className="text-sm font-bold text-slate-600">Start the conversation</div><div className="mt-1 text-[11px]">Send a message or start a meeting.</div></div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {groupedMessages.map((item) => {
                      if (item.type === "day") {
                        return (
                          <div key={item.key} className="my-4 flex items-center justify-center">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold text-slate-500">{item.day}</span>
                          </div>
                        );
                      }
                      const m = item.message;
                      const mine = m.sender?.id === myId;
                      const room = meetingRoomFromBody(m.body);
                      return (
                        <div key={item.key} className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                          {!mine && (
                            <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-white ${avatarGradient(m.sender?.name)}`}>{initialsOf(m.sender?.name)}</span>
                          )}
                          <div className={`cb-bubble relative max-w-[76%] px-4 py-2.5 text-[12px] leading-relaxed sm:max-w-[70%] ${mine ? "rounded-[16px] rounded-br-[5px] bg-emerald-50 text-neutral-900" : "rounded-[16px] rounded-bl-[5px] bg-neutral-100 text-neutral-900"} ${m.pinned ? "ring-1 ring-amber-300" : ""}`}>
                            {!mine && activeConversation.isGroup && <div className="mb-0.5 text-[9px] font-bold text-indigo-600">{m.sender?.name}</div>}
                            {room ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${mine ? "bg-white/15" : "bg-indigo-50 text-indigo-600"}`}><Video size={13} /></span>
                                <span className="font-semibold">Meeting started</span>
                                <button type="button" onClick={() => joinMeeting(room)} className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${mine ? "bg-white/20 text-white hover:bg-white/30" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>Join</button>
                              </div>
                            ) : <div className="whitespace-pre-wrap break-words">{m.body}</div>}
                            <div className={`mt-1 text-right text-[8px] "text-neutral-400"`}>{formatTime(m.createdAt)}</div>
                          </div>
                          <button type="button" onClick={() => togglePin(m)} title={m.pinned ? "Unpin" : "Pin"} className="mb-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 hover:bg-slate-100 group-hover:opacity-100">
                            {m.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                          </button>
                        </div>
                      );
                    })}
                    <div ref={threadEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 bg-white p-3">
                <div className="flex min-h-[46px] items-end gap-1 rounded-[9px] border border-neutral-400 bg-white p-1.5 transition focus-within:border-neutral-700">
                  <div className="relative">
                    <button type="button" onClick={() => setEmojiOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-indigo-50 hover:text-indigo-600" aria-label="Emoji"><Smile size={17} /></button>
                    {emojiOpen && (
                      <>
                        <button type="button" aria-label="Close emoji picker" onClick={() => setEmojiOpen(false)} className="fixed inset-0 z-[10] cursor-default" />
                        <div className="absolute bottom-12 left-0 z-[20] w-[280px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                          <div className="grid grid-cols-8 gap-1">{EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-slate-100">{emoji}</button>)}</div>
                        </div>
                      </>
                    )}
                  </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    rows={1}
                    placeholder="Type a message..."
                    className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none"
                  />
                  <button type="button" onClick={sendMessage} disabled={sending || !draft.trim()} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40" aria-label="Send">
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.055),_transparent_30%)] text-slate-400">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"><MessageSquare size={25} strokeWidth={1.5} /></span>
              <div className="text-center"><div className="text-sm font-bold text-slate-600">Select a conversation</div><div className="mt-1 text-[11px]">Choose a chat from the left to start messaging.</div></div>
            </div>
          )}
        </div>


      </div>


      {newOpen && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="text-sm font-black text-slate-950">New chat</div>
              <button type="button" onClick={() => setNewOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="border-b border-slate-100 p-3">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search people" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400" />
              </div>
              {selectedIds.length > 1 && <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400" />}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {filteredUsers.length === 0 ? <div className="px-3 py-8 text-center text-xs text-slate-500">No people found.</div> : filteredUsers.map((u) => {
                const selected = selectedIds.includes(u.id);
                return (
                  <button key={u.id} type="button" onClick={() => toggleUser(u.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${selected ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-black text-white ${avatarGradient(u.name)}`}>{initialsOf(u.name)}</span>
                    <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-bold text-slate-900">{u.name}</div><div className="truncate text-[11px] text-slate-500">{u.email}</div></div>
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"}`}>{selected && <Check size={12} />}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
              <span className="text-[11px] font-semibold text-slate-500">{selectedIds.length === 0 ? "Select people" : selectedIds.length === 1 ? "1-to-1 chat" : `Group of ${selectedIds.length}`}</span>
              <button type="button" onClick={createConversation} disabled={selectedIds.length === 0 || creating} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{creating && <Loader2 size={14} className="animate-spin" />} Start chat</button>
            </div>
          </div>
        </div>
      )}

      <MeetingRoom
        open={meetingOpen}
        roomName={meetingRoom}
        displayName={currentUser?.name}
        subject="ConsulBuzz Meeting"
        onClose={() => { setMeetingOpen(false); setMeetingRoom(""); }}
      />
    </div>
  );
}
