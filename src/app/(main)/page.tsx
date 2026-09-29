"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/layout/PageHeader";
import { TICKET_PRIORITY_TONE, TICKET_STATUS_TONE } from "@/constants/tones";
import { TicketPriority, TicketStatus } from "@/types/ticket";
import { Package, Ticket, Building2, Users, AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

export default function Page() {
  const stats = [
    { title: "Total Assets", value: "1,284", icon: Package, bg: "bg-gradient-to-b from-[#2997ff] to-[#0062d1]", color: "text-white", trend: "+12 this month" },
    { title: "Active Tickets", value: "42", icon: Ticket, bg: "bg-gradient-to-b from-[#ffb340] to-[#ff8a00]", color: "text-white", trend: "8 urgent" },
    { title: "Departments", value: "12", icon: Building2, bg: "bg-gradient-to-b from-[#7d7aff] to-[#5046e5]", color: "text-white", trend: "2 new" },
    { title: "Staff Members", value: "86", icon: Users, bg: "bg-gradient-to-b from-[#4cd964] to-[#28a745]", color: "text-white", trend: "+3 this week" },
  ];

  const recentTickets = [
    { id: "1", title: "AC Repair - Floor 2", status: "Doing", priority: "High", time: "2h ago" },
    { id: "2", title: "Printer Setup - HR", status: "New", priority: "Medium", time: "4h ago" },
    { id: "3", title: "Network Issue - Server Room", status: "Waiting", priority: "Urgent", time: "5h ago" },
    { id: "4", title: "Light Replacement", status: "Done", priority: "Low", time: "1d ago" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Welcome back. Here's what's happening today." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="gap-0 py-5 transition-all duration-300 ease-apple hover:-translate-y-0.5 hover:shadow-elevated">
            <CardContent className="px-5">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-muted-foreground">{stat.title}</p>
                <div className={`${stat.bg} h-9 w-9 rounded-[10px] flex items-center justify-center shadow-[0_1px_2px_rgb(0_0_0/0.12),inset_0_1px_0_rgb(255_255_255/0.25)]`}>
                  <stat.icon className={`h-[18px] w-[18px] ${stat.color}`} strokeWidth={2.1} />
                </div>
              </div>
              <p className="text-[34px] leading-none font-semibold tracking-[-0.03em] tabular-nums mt-3">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-[#28a745] dark:text-[#30d158]" /> {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 gap-2">
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            <div className="divide-y divide-border">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ticket.time}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill tone={TICKET_PRIORITY_TONE[ticket.priority as TicketPriority] ?? "gray"}>
                      {ticket.priority}
                    </StatusPill>
                    <StatusPill dot tone={TICKET_STATUS_TONE[ticket.status as TicketStatus] ?? "gray"}>
                      {ticket.status}
                    </StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 gap-2">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            <div className="divide-y divide-border">
              {[
                { label: "API Gateway", status: "Operational", icon: CheckCircle2, color: "text-[#28a745] dark:text-[#30d158]" },
                { label: "Database Cluster", status: "Operational", icon: CheckCircle2, color: "text-[#28a745] dark:text-[#30d158]" },
                { label: "Background Jobs", status: "Processing delay (2m)", icon: Clock, color: "text-[#ff9f0a]" },
                { label: "Storage Service", status: "Maintenance scheduled", icon: AlertCircle, color: "text-[#ff3b30] dark:text-[#ff453a]" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 px-3 py-3.5">
                  <item.icon className={`h-[18px] w-[18px] shrink-0 ${item.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
