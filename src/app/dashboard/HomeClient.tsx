"use client";

import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
  Images,
  Lock,
  Receipt,
  User,
  Wallet,
} from "lucide-react";
import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import { formatMoney } from "@/lib/finance/formatMoney";
import { FEATURES } from "@/lib/features";
import type { HomeData } from "@/lib/home/loadHomeData";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { StatusDot } from "@/components/StatusDot";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function MoneyValue({
  amount,
  masked,
}: {
  amount: number;
  masked: boolean;
}) {
  if (masked) {
    return <span className="tracking-widest text-text-muted">••••••</span>;
  }
  return <span className="tabular-nums">{formatMoney(amount)}</span>;
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 border border-border bg-bg-secondary px-2 py-3 sm:px-3 sm:py-4 text-center transition-colors hover:bg-bg-elevated/60"
    >
      <Icon className="h-4 w-4 text-text-secondary" aria-hidden />
      <span className="text-[10px] uppercase tracking-label text-text-primary leading-snug">
        {label}
      </span>
    </Link>
  );
}

function OnboardingItem({
  label,
  done,
  href,
}: {
  label: string;
  done: boolean;
  href: string;
}) {
  const Icon = done ? CheckCircle2 : Circle;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 border border-border bg-bg-primary/40 px-3 py-2.5 transition-colors hover:bg-bg-elevated/40",
        done && "opacity-60"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          done ? "text-status-delivered" : "text-text-muted"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "text-[13px]",
          done ? "text-text-muted line-through" : "text-text-primary"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function HomeClient({ data }: { data: HomeData }) {
  const { pinEnabled, isLocked, settingsLoaded } = usePrivacyLockContext();
  const financeMasked = settingsLoaded && pinEnabled && isLocked;

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const counts = data.totalCounts;
  const showOnboarding =
    counts.clients === 0 ||
    counts.projects === 0 ||
    counts.quotations === 0 ||
    counts.events === 0;

  return (
    <DashboardMain>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase text-center sm:text-left">
          Home
        </h1>
        <p className="mt-2 text-[13px] text-text-secondary text-center sm:text-left">
          Your day at a glance — shoots, money, and quotes.
        </p>
        <p className="mt-2 hidden sm:block text-[11px] uppercase tracking-label text-text-muted">
          Press{" "}
          <kbd className="border border-border px-1 py-0.5 text-[10px]">
            ⌘ K
          </kbd>{" "}
          to search or jump anywhere.
        </p>
      </header>

      {showOnboarding ? (
        <section className="mb-6 sm:mb-8 border border-border bg-bg-secondary p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
            <h2 className="text-[11px] uppercase tracking-label text-text-muted">
              Get set up
            </h2>
            <span className="text-[11px] uppercase tracking-label text-text-muted">
              {
                [
                  counts.clients > 0,
                  counts.projects > 0,
                  counts.quotations > 0,
                  counts.events > 0,
                ].filter(Boolean).length
              }
              /4
            </span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>
              <OnboardingItem
                label="Add your first client"
                done={counts.clients > 0}
                href="/dashboard/clients"
              />
            </li>
            <li>
              <OnboardingItem
                label="Draft your first quote"
                done={counts.quotations > 0}
                href="/dashboard/quotations"
              />
            </li>
            <li>
              <OnboardingItem
                label="Add a shoot to the calendar"
                done={counts.events > 0}
                href="/dashboard/calendar"
              />
            </li>
            <li>
              <OnboardingItem
                label="Create your first gallery"
                done={counts.projects > 0}
                href="/dashboard/galleries"
              />
            </li>
          </ul>
        </section>
      ) : null}

      <section className="mb-6 sm:mb-8 border border-border bg-bg-secondary p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
          <h2 className="text-[11px] uppercase tracking-label text-text-muted">
            Today
          </h2>
          {FEATURES.calendar ? (
            <Link
              href="/dashboard/calendar"
              className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
            >
              Open calendar
            </Link>
          ) : null}
        </div>
        {data.todayEvents.length === 0 ? (
          <p className="text-[13px] text-text-secondary leading-relaxed">
            No shoots scheduled today.
            {FEATURES.calendar ? (
              <>
                {" "}
                <Link
                  href="/dashboard/calendar"
                  className="underline underline-offset-2 text-text-primary"
                >
                  Add an event
                </Link>
              </>
            ) : null}
          </p>
        ) : (
          <ul className="space-y-3">
            {data.todayEvents.map((event) => {
              const time = formatEventTimeRange(
                event.shoot_time,
                event.shoot_end_time
              );
              return (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 border border-border bg-bg-primary/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] text-text-primary truncate">
                      {event.title}
                    </p>
                    {event.client_name ? (
                      <p className="text-[12px] text-text-secondary truncate mt-0.5">
                        {event.client_name}
                      </p>
                    ) : null}
                  </div>
                  {time ? (
                    <span className="shrink-0 text-[11px] uppercase tracking-label text-text-muted tabular-nums">
                      {time}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mb-6 sm:mb-8">
        <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-[2px]">
          {FEATURES.quotations ? (
            <QuickAction
              href="/dashboard/quotations"
              label="New quote"
              icon={FileText}
            />
          ) : null}
          {FEATURES.finance ? (
            <QuickAction
              href="/dashboard/finance"
              label="Add expense"
              icon={Wallet}
            />
          ) : null}
          {FEATURES.calendar ? (
            <QuickAction
              href="/dashboard/calendar"
              label="Calendar event"
              icon={Calendar}
            />
          ) : null}
          {FEATURES.projectsGrid ? (
            <QuickAction
              href="/dashboard/galleries"
              label="Open galleries"
              icon={Images}
            />
          ) : null}
        </div>
      </section>

      {FEATURES.finance ? (
        <section className="mb-6 sm:mb-8 border border-border bg-bg-secondary p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
            <h2 className="text-[11px] uppercase tracking-label text-text-muted">
              This month
            </h2>
            <Link
              href="/dashboard/finance"
              className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1.5"
            >
              Finance
              {financeMasked ? (
                <Lock className="h-3 w-3 opacity-70" aria-hidden />
              ) : null}
            </Link>
          </div>
          <p className="text-[12px] text-text-muted mb-3">{monthLabel}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-border bg-bg-primary/40 px-3 py-3">
              <p className="text-[10px] uppercase tracking-label text-text-muted mb-1">
                Income
              </p>
              <p className="text-[15px] text-text-primary">
                <MoneyValue amount={data.monthIncome} masked={financeMasked} />
              </p>
            </div>
            <div className="border border-border bg-bg-primary/40 px-3 py-3">
              <p className="text-[10px] uppercase tracking-label text-text-muted mb-1">
                Expenses
              </p>
              <p className="text-[15px] text-text-primary">
                <MoneyValue amount={data.monthExpenses} masked={financeMasked} />
              </p>
            </div>
            <div className="border border-border bg-bg-primary/40 px-3 py-3">
              <p className="text-[10px] uppercase tracking-label text-text-muted mb-1">
                Net
              </p>
              <p
                className={cn(
                  "text-[15px]",
                  data.monthNet >= 0
                    ? "text-status-delivered"
                    : "text-status-cancelled"
                )}
              >
                <MoneyValue amount={data.monthNet} masked={financeMasked} />
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {FEATURES.quotations ? (
        <section className="mb-6 sm:mb-8 border border-border bg-bg-secondary p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
            <h2 className="text-[11px] uppercase tracking-label text-text-muted">
              Recent quotes
            </h2>
            <Link
              href="/dashboard/quotations"
              className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
            >
              All quotes
            </Link>
          </div>
          {data.recentQuotations.length === 0 ? (
            <p className="text-[13px] text-text-secondary leading-relaxed">
              No saved quotes yet.{" "}
              <Link
                href="/dashboard/quotations"
                className="underline underline-offset-2 text-text-primary"
              >
                Create one
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {data.recentQuotations.map((quote) => (
                <li key={quote.id}>
                  <Link
                    href="/dashboard/quotations"
                    className="flex items-center justify-between gap-3 border border-border bg-bg-primary/40 px-3 py-2.5 hover:bg-bg-elevated/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] text-text-primary truncate">
                        {quote.client_name?.trim() ||
                          quote.project_title?.trim() ||
                          quote.quote_number}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5 tabular-nums">
                        {quote.quote_number}
                      </p>
                    </div>
                    <Receipt className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {FEATURES.projectsGrid ? (
        <section className="mb-6 sm:mb-8 border border-border bg-bg-secondary p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
            <h2 className="text-[11px] uppercase tracking-label text-text-muted">
              Galleries needing attention
            </h2>
            <Link
              href="/dashboard/galleries"
              className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
            >
              All galleries
            </Link>
          </div>
          {data.attentionProjects.length === 0 ? (
            <p className="text-[13px] text-text-secondary leading-relaxed">
              You&apos;re all caught up — no galleries in the selection or
              editing stage right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.attentionProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/dashboard/${project.id}`}
                    className="flex items-center justify-between gap-3 border border-border bg-bg-primary/40 px-3 py-2.5 hover:bg-bg-elevated/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] text-text-primary truncate">
                        {project.name}
                      </p>
                      <p className="text-[11px] text-text-muted truncate mt-0.5">
                        {project.client_name ?? "—"}
                      </p>
                    </div>
                    <StatusDot status={project.status as ProjectStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.projectsGrid && data.recentProjects.length > 0 ? (
          <section className="border border-border bg-bg-secondary p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
              <h2 className="text-[11px] uppercase tracking-label text-text-muted">
                Recent projects
              </h2>
              <Link
                href="/dashboard/galleries"
                className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
              >
                All galleries
              </Link>
            </div>
            <ul className="space-y-2">
              {data.recentProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/dashboard/${project.id}`}
                    className="flex items-center justify-between gap-3 border border-border bg-bg-primary/40 px-3 py-2.5 hover:bg-bg-elevated/40 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <Images
                        className="h-3.5 w-3.5 text-text-muted shrink-0"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] text-text-primary truncate">
                          {project.name}
                        </p>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {project.client_name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <StatusDot status={project.status as ProjectStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {FEATURES.clients && data.recentClients.length > 0 ? (
          <section className="border border-border bg-bg-secondary p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
              <h2 className="text-[11px] uppercase tracking-label text-text-muted">
                Recent clients
              </h2>
              <Link
                href="/dashboard/clients"
                className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
              >
                Client book
              </Link>
            </div>
            <ul className="space-y-2">
              {data.recentClients.map((client) => (
                <li key={client.id}>
                  <Link
                    href="/dashboard/clients"
                    className="flex items-center gap-2 border border-border bg-bg-primary/40 px-3 py-2.5 hover:bg-bg-elevated/40 transition-colors"
                  >
                    <User
                      className="h-3.5 w-3.5 text-text-muted shrink-0"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-text-primary truncate">
                        {client.name}
                      </p>
                      {client.phone ? (
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {client.phone}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </DashboardMain>
  );
}
