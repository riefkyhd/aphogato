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

  const maxItems = isStory ? 7 : 5;
  const visibleEvents = sortedEvents.slice(0, maxItems);
  const remainingCount = sortedEvents.length - maxItems;

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
        className={`flex flex-col justify-between bg-[#0A0A0A] text-white ${
          isStory ? "p-20" : "p-14"
        } font-sans relative border border-[#27272A]`}
      >
        {/* 1. STUDIO HEADER */}
        <div className="relative z-10 border-b-2 border-[#27272A] pb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[24px] uppercase tracking-[0.3em] text-[#A1A1AA] font-semibold">
                Muhammad Hadid
              </p>
              <h1 className="mt-3 text-[62px] font-light tracking-[0.02em] uppercase text-white leading-tight max-w-[800px]">
                {headline}
              </h1>
            </div>
            <div className="text-right">
              <span className="inline-block border border-[#3F3F46] px-5 py-2 text-[16px] uppercase tracking-[0.2em] font-medium text-[#E4E4E7]">
                Dates & Availability
              </span>
              <p className="mt-3 text-[16px] tracking-wider text-[#A1A1AA] uppercase">
                {sortedEvents.length} Shoot{sortedEvents.length === 1 ? "" : "s"} Listed
              </p>
            </div>
          </div>
        </div>

        {/* 2. EVENT LIST CONTAINER */}
        <div className="relative z-10 flex-1 my-6 overflow-hidden flex flex-col justify-start">
          {sortedEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <p className="text-[28px] font-light text-[#A1A1AA] uppercase tracking-widest">
                No Shoots Selected
              </p>
              <p className="mt-3 text-[20px] text-[#D4D4D8]">
                Select events on the left to feature them in this graphic.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#27272A]/80">
              {visibleEvents.map((ev) => {
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
                const isSport = ev.shoot_type === "sport";

                const clientDisplay = maskClientNames
                  ? "Reserved"
                  : ev.client_name?.trim() || "Private Client";

                return (
                  <div
                    key={ev.id}
                    className={`flex items-center justify-between ${
                      isStory ? "py-7" : "py-5"
                    } gap-8`}
                  >
                    {/* Date Block */}
                    <div className="flex items-center gap-4 shrink-0 w-[170px]">
                      <span className="text-[64px] font-light tracking-tight text-white tabular-nums leading-none">
                        {dayNum}
                      </span>
                      <div className="flex flex-col text-[18px] uppercase tracking-[0.15em] leading-tight">
                        <span className="font-semibold text-white">{monthAbbr}</span>
                        <span className="text-[#D4D4D8]">{dayName}</span>
                      </div>
                    </div>

                    {/* Content Block */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3.5 flex-wrap">
                        <h3 className="text-[34px] font-medium tracking-[0.01em] text-white truncate max-w-[560px]">
                          {ev.title}
                        </h3>
                        {maskClientNames && (
                          <span className="shrink-0 text-[14px] uppercase tracking-[0.15em] bg-[#27272A] text-[#E4E4E7] px-3.5 py-1 border border-[#3F3F46] font-semibold">
                            Booked
                          </span>
                        )}
                        {isSport && (
                          <span className="shrink-0 text-[14px] uppercase tracking-[0.15em] bg-[#EA580C]/20 text-[#FB923C] px-3.5 py-1 border border-[#EA580C]/50 font-semibold">
                            Sport
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-6 text-[22px] text-[#A1A1AA]">
                        {!maskClientNames && (
                          <span className="text-[#E4E4E7] font-normal">
                            {clientDisplay}
                          </span>
                        )}
                        {timeRange ? (
                          <span className="tabular-nums text-[#A1A1AA]">
                            {timeRange}
                          </span>
                        ) : null}
                        {includeLocation && ev.location?.trim() ? (
                          <span className="inline-flex items-center gap-2 text-[#A1A1AA] truncate max-w-[360px]">
                            <MapPin className="h-5 w-5 shrink-0 text-[#A1A1AA]" />
                            {ev.location.trim()}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Modular Service Badges */}
                    {includeServices && (
                      <div className="flex items-center gap-3 shrink-0">
                        {hasPhoto && (
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[15px] uppercase tracking-[0.12em] bg-white text-black font-semibold">
                            <Camera className="h-4 w-4" />
                            Photo
                          </span>
                        )}
                        {hasVideo && (
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[15px] uppercase tracking-[0.12em] border-2 border-white text-white font-semibold">
                            <Video className="h-4 w-4" />
                            Video
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {remainingCount > 0 && (
                <div className="py-5 text-center text-[18px] tracking-widest uppercase text-[#D4D4D8]">
                  + {remainingCount} additional dates booked
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. STUDIO FOOTER */}
        <div className="relative z-10 border-t-2 border-[#27272A] pt-8 flex items-center justify-between text-[#A1A1AA]">
          <div>
            <p className="text-white font-light tracking-[0.1em] text-[22px] uppercase">
              Bookings & Enquiries
            </p>
            <p className="mt-1 text-[18px] text-[#A1A1AA]">
              DM @muhammadhadid or visit muhammadhadid.com
            </p>
          </div>
          <div className="text-right text-[16px] tracking-[0.25em] text-[#A1A1AA] uppercase font-medium">
            aphogato studio
          </div>
        </div>
      </div>
    </div>
  );
});
