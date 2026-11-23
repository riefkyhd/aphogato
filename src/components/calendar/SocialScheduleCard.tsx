"use client";

import { forwardRef } from "react";
import { format, parseISO } from "date-fns";
import { Camera, MapPin, Video } from "lucide-react";
import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import { normalizeServices } from "@/lib/calendar/serviceTags";
import type { CalendarEvent } from "@/lib/types";

export type SocialGraphicFormat = "story" | "feed";

export interface SocialScheduleCardProps {
  events: CalendarEvent[];
  headline?: string;
  format?: SocialGraphicFormat;
  maskClientNames?: boolean;
  includeLocation?: boolean;
  includeServices?: boolean;
  scale?: number;
}

export const SocialScheduleCard = forwardRef<
  HTMLDivElement,
  SocialScheduleCardProps
>(function SocialScheduleCard(
  {
    events,
    headline = "Shoot Schedule",
    format: cardFormat = "story",
    maskClientNames = false,
    includeLocation = true,
    includeServices = true,
    scale = 1,
  },
  ref
) {
  const isStory = cardFormat === "story";
  // Story is 1080x1920 (9:16), Feed is 1080x1350 (4:5)
  const baseWidth = 1080;
  const baseHeight = isStory ? 1920 : 1350;

  const sortedEvents = [...events].sort((a, b) =>
    a.shoot_date.localeCompare(b.shoot_date)
  );

  return (
    <div
      style={{
        width: `${baseWidth * scale}px`,
        height: `${baseHeight * scale}px`,
        overflow: "hidden",
      }}
      className="relative shrink-0 select-none"
    >
      <div
        ref={ref}
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="flex flex-col justify-between bg-[#0C0C0D] text-white p-16 font-sans border border-[#27272A] relative"
      >
        {/* Subtle Luxury Ambient Corner Glow */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-white/[0.04] to-transparent pointer-events-none"
          aria-hidden
        />

        {/* 1. STUDIO HEADER */}
        <div className="relative z-10 border-b border-[#27272A] pb-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[14px] uppercase tracking-[0.25em] text-[#A1A1AA] font-medium">
                Muhammad Hadid
              </p>
              <h1 className="mt-3 text-[42px] font-light tracking-[0.06em] uppercase text-white leading-tight max-w-[760px]">
                {headline}
              </h1>
            </div>
            <div className="text-right">
              <span className="inline-block border border-[#3F3F46] px-4 py-1.5 text-[12px] uppercase tracking-[0.2em] text-[#D4D4D8]">
                Studio Schedule
              </span>
              <p className="mt-2 text-[12px] tracking-wider text-[#71717A] uppercase">
                {sortedEvents.length} Shoot{sortedEvents.length === 1 ? "" : "s"} Listed
              </p>
            </div>
          </div>
        </div>

        {/* 2. EVENT LIST CONTAINER */}
        <div className="relative z-10 flex-1 my-8 overflow-hidden flex flex-col justify-start">
          {sortedEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <p className="text-[20px] font-light text-[#71717A] uppercase tracking-widest">
                No Shoots Selected
              </p>
              <p className="mt-2 text-[14px] text-[#52525B]">
                Select events from the calendar on the left to include in this graphic.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvents.slice(0, isStory ? 9 : 6).map((ev) => {
                const parsedDate = parseISO(ev.shoot_date);
                const dayNum = format(parsedDate, "dd");
                const monthAbbr = format(parsedDate, "MMM").toUpperCase();
                const dayName = format(parsedDate, "EEE").toUpperCase();
                const timeRange = formatEventTimeRange(
                  ev.shoot_time,
                  ev.shoot_end_time
                );
                const services = normalizeServices(ev.services);
                const hasPhoto = services.includes("photography");
                const hasVideo = services.includes("videography");

                const clientDisplay = maskClientNames
                  ? "Reserved"
                  : ev.client_name?.trim() || "Private Client";

                return (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-6 bg-[#18181B]/80 border border-[#27272A] rounded-none gap-6"
                  >
                    {/* Date Block */}
                    <div className="flex items-baseline gap-3 shrink-0 w-[150px] border-r border-[#27272A] pr-4">
                      <span className="text-[36px] font-light tracking-tight text-white tabular-nums leading-none">
                        {dayNum}
                      </span>
                      <div className="flex flex-col text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA] leading-tight">
                        <span className="font-medium text-[#E4E4E7]">{monthAbbr}</span>
                        <span className="text-[#71717A]">{dayName}</span>
                      </div>
                    </div>

                    {/* Content Block */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-[20px] font-normal tracking-[0.02em] text-white truncate">
                          {ev.title}
                        </h3>
                        {maskClientNames ? (
                          <span className="shrink-0 text-[10px] uppercase tracking-[0.15em] bg-[#27272A] text-[#D4D4D8] px-2.5 py-0.5 border border-[#3F3F46]">
                            Booked
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-[13px] text-[#A1A1AA]">
                        {!maskClientNames && (
                          <span className="text-[#D4D4D8] font-light">
                            {clientDisplay}
                          </span>
                        )}
                        {timeRange ? (
                          <span className="tabular-nums text-[#71717A]">
                            {timeRange}
                          </span>
                        ) : null}
                        {includeLocation && ev.location?.trim() ? (
                          <span className="inline-flex items-center gap-1 text-[#71717A] truncate max-w-[280px]">
                            <MapPin className="h-3 w-3 shrink-0 text-[#A1A1AA]" />
                            {ev.location.trim()}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Modular Service Badges */}
                    {includeServices && (
                      <div className="flex items-center gap-2 shrink-0">
                        {hasPhoto && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] uppercase tracking-[0.12em] bg-white text-black font-medium">
                            <Camera className="h-3.5 w-3.5" />
                            Photo
                          </span>
                        )}
                        {hasVideo && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] uppercase tracking-[0.12em] border border-white text-white font-medium">
                            <Video className="h-3.5 w-3.5" />
                            Video
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {sortedEvents.length > (isStory ? 9 : 6) && (
                <div className="p-3 text-center text-[12px] tracking-wider uppercase text-[#71717A]">
                  + {sortedEvents.length - (isStory ? 9 : 6)} additional dates booked
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. STUDIO FOOTER */}
        <div className="relative z-10 border-t border-[#27272A] pt-8 flex items-center justify-between text-[13px] tracking-wider uppercase text-[#71717A]">
          <div>
            <p className="text-white font-light tracking-[0.1em]">
              Bookings & Enquiries
            </p>
            <p className="mt-0.5 text-[12px] text-[#A1A1AA]">
              DM @muhammadhadid or visit muhammadhadid.com
            </p>
          </div>
          <div className="text-right text-[11px] tracking-[0.2em] text-[#52525B]">
            aphogato studio
          </div>
        </div>
      </div>
    </div>
  );
});
