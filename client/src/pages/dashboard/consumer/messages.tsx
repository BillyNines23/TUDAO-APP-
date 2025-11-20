import AppShell from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, MoreVertical, Phone, Video } from "lucide-react";

const conversations = [
  { id: 1, name: "Alice Plumber", lastMsg: "I'll be there in 10 mins", time: "10:30 AM", unread: 2, avatar: "AP" },
  { id: 2, name: "Bob Painter", lastMsg: "Thanks for the payment!", time: "Yesterday", unread: 0, avatar: "BP" },
  { id: 3, name: "Charlie Electric", lastMsg: "Can you send a photo of the panel?", time: "Nov 18", unread: 0, avatar: "CE" },
];

export default function Messages() {
  return (
    <AppShell>
      <div className="flex h-[calc(100vh-8rem)] border rounded-xl overflow-hidden bg-background shadow-sm">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/10 flex flex-col">
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-8" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.map((chat) => (
                    <div key={chat.id} className={`p-4 border-b hover:bg-accent/50 cursor-pointer transition-colors flex gap-3 ${chat.id === 1 ? 'bg-accent/50' : ''}`}>
                        <Avatar>
                            <AvatarFallback>{chat.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold truncate">{chat.name}</span>
                                <span className="text-xs text-muted-foreground">{chat.time}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground truncate max-w-[140px]">{chat.lastMsg}</p>
                                {chat.unread > 0 && (
                                    <span className="bg-primary text-primary-foreground text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold">
                                        {chat.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-background">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback>AP</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold">Alice Plumber</h3>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Online
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/5">
                <div className="flex justify-start">
                    <div className="bg-muted rounded-lg rounded-tl-none p-3 max-w-[80%] text-sm">
                        Hi, are you available for an emergency fix today?
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none p-3 max-w-[80%] text-sm shadow-sm">
                        Yes, I can come by this afternoon. What's the issue?
                    </div>
                </div>
                 <div className="flex justify-start">
                    <div className="bg-muted rounded-lg rounded-tl-none p-3 max-w-[80%] text-sm">
                        Leaking pipe under the sink.
                    </div>
                </div>
                 <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none p-3 max-w-[80%] text-sm shadow-sm">
                        I'll be there in 10 mins
                    </div>
                </div>
            </div>

            <div className="p-4 border-t bg-background">
                <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
      </div>
    </AppShell>
  );
}
