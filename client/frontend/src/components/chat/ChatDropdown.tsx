import { useState, useEffect } from "react";
import { MessageSquare, Plus, MoreVertical, Trash, Edit2, ArrowRight, Loader2, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useGlobalChat } from "@/context/ChatContext";
import { useAuthContext } from "@/context/AuthContext";
import { hasAnyRole } from "@/lib/roles";
import { useNavigate, useLocation } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export default function ChatDropdown() {
  const { user } = useAuthContext();
  const { chats, activeChat, loadUserChats, startNewChat, loadMessages, deleteChat, renameChat, resetMessages } = useGlobalChat();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameData, setRenameData] = useState<{id: string, topic: string} | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const canUseChat = hasAnyRole(user, ["customer", "support", "admin", "branch_admin", "super_admin"]);

  useEffect(() => {
    if (isOpen && user?._id) {
      loadUserChats();
    }
  }, [isOpen, user?._id, loadUserChats]);

  if (!canUseChat) return null;

  const isAdminOrBranchAdmin = hasAnyRole(user, ["admin", "branch_admin"]);

  if (isAdminOrBranchAdmin) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/admin/copilot")}
        className="h-9 w-9 relative"
      >
        <MessageSquare className="h-5 w-5 text-muted-foreground hover:text-foreground" />
      </Button>
    );
  }

  const handleNewChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCreating || !user?._id || !user?.organization_id?._id) return;
    setIsCreating(true);
    
    try {
      const chat = await startNewChat({
        user_id: user._id,
        organization_id: typeof user.organization_id === 'string' ? user.organization_id : user.organization_id._id,
        topic: "New Conversation",
      });
      
      resetMessages();
      loadMessages(chat._id);
      
      // Only navigate if we are not already on the chat page
      if (!location.pathname.includes("/chat")) {
        const basePath = hasAnyRole(user, ["customer"]) ? "/chat" : "/support/chat";
        navigate(basePath, { replace: true });
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create chat", error);
      toast.error("Error", "Failed to start new chat");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectChat = (chatId: string, e: React.MouseEvent) => {
    // Avoid selecting if clicked on the 3-dot menu or actions
    if ((e.target as HTMLElement).closest('.chat-actions')) {
      e.preventDefault();
      return;
    }
    
    loadMessages(chatId);
    
    if (!location.pathname.includes("/chat")) {
      const basePath = hasAnyRole(user, ["customer"]) ? "/chat" : "/support/chat";
      navigate(basePath, { replace: true });
    }
    
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteChat(deleteId);
      toast.success("Success", "Chat deleted successfully");
    } catch (error) {
      toast.error("Error", "Failed to delete chat");
    } finally {
      setDeleteId(null);
    }
  };

  const handleRename = async () => {
    if (!renameData || !renameData.topic.trim()) return;
    try {
      await renameChat(renameData.id, renameData.topic);
      toast.success("Success", "Chat renamed");
    } catch (error) {
      toast.error("Error", "Failed to rename chat");
    } finally {
      setRenameData(null);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    const basePath = hasAnyRole(user, ["customer"]) ? "/chat-history" : "/admin/chat-history";
    navigate(basePath);
  };

  const recentChats = [...chats].slice(0, 5);

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 relative">
          <MessageSquare className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0 border-white/[0.06] bg-background">
          <div className="p-2 border-b border-white/[0.06]">
            <Button 
              onClick={handleNewChat} 
              disabled={isCreating}
              className="w-full justify-start gap-2 h-10"
              variant="default"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              New Chat
            </Button>
          </div>
          
          <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase ">
            Chat History
          </DropdownMenuLabel>
          
          <div className="max-h-[300px] overflow-y-auto py-1">
            {recentChats.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <MessageCircle className="h-8 w-8 opacity-20" />
                <p>No recent conversations</p>
              </div>
            ) : (
              recentChats.map((chat) => (
                <div 
                  key={chat._id}
                  className={`flex items-center justify-between px-3 py-2 mx-1 my-0.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${activeChat?._id === chat._id ? 'bg-muted' : ''}`}
                  onClick={(e) => handleSelectChat(chat._id, e)}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{chat.topic || "Conversation"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {chat.updated_at ? formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true }) : "recently"}
                    </span>
                  </div>
                  
                  <div className="chat-actions shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center" style={{ opacity: 1 /* Force visible for touch */ }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-6 w-6">
                        <MoreVertical className="h-3 w-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameData({ id: chat._id, topic: chat.topic || "Conversation" }); }}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteId(chat._id); }}>
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-white/[0.06]">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-9 text-xs" 
              onClick={handleViewAll}
            >
              View All History
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this chat? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      {/* Rename Dialog (Simple Implementation) */}
      {renameData && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg border w-full max-w-sm p-5 space-y-4">
            <h3 className="font-semibold text-lg">Rename Conversation</h3>
            <input 
              type="text" 
              value={renameData.topic} 
              onChange={(e) => setRenameData({...renameData, topic: e.target.value})}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRenameData(null)}>Cancel</Button>
              <Button onClick={handleRename}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
