import { Layers } from "lucide-react";

export function PlaceholderModule({ title, role }: { title: string, role: string }) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-4 h-full">
            <div className="min-h-[70vh] flex-1 rounded-xl bg-muted/30 border border-dashed border-border p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <div className="max-w-md space-y-6">
                    <div className="h-16 w-16 bg-sidebar-primary/10 text-sidebar-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                        <Layers className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold font-display tracking-tight">{title}</h2>
                        <p className="text-muted-foreground text-lg">
                            This module will integrate an existing TUDAO component for the <span className="font-semibold text-foreground capitalize">{role}</span> role.
                        </p>
                    </div>
                    <div className="p-4 bg-card border rounded-lg text-sm font-mono text-muted-foreground">
                        /dashboard/{role}/*
                    </div>
                </div>
            </div>
        </div>
    )
}
