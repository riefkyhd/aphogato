"use client";

import { forwardRef } from "react";
import { format, parseISO } from "date-fns";
import { Camera, MapPin, Video } from "lucide-react";
import { isShootType } from "@/lib/calendar/calendarHelpers";
import { normalizeServices } from "@/lib/calendar/serviceTags";
import type { CalendarEvent, ShootType } from "@/lib/types";

export type SocialGraphicFormat = "story" | "feed";

export interface SocialScheduleCardProps {
  events: CalendarEvent[];
  headline?: string;
  format?: SocialGraphicFormat;
  includeCategory?: boolean;
  includeClientName?: boolean;
  maskClientNames?: boolean;
  includeEndTime?: boolean;
  includeLocation?: boolean;
  includeServices?: boolean;
  scale?: number;
}

const CATEGORY_STYLES: Record<
  ShootType,
  { label: string; bg: string; border: string; text: string }
> = {
  sport: {
    label: "Sport",
    bg: "rgba(194, 65, 12, 0.2)",
    border: "rgba(194, 65, 12, 0.5)",
    text: "#FB923C",
  },
  wedding: {
    label: "Wedding",
    bg: "rgba(124, 58, 237, 0.2)",
    border: "rgba(124, 58, 237, 0.5)",
    text: "#C4B5FD",
  },
  portrait: {
    label: "Portrait",
    bg: "rgba(146, 64, 14, 0.2)",
    border: "rgba(146, 64, 14, 0.5)",
    text: "#FCD34D",
  },
  commercial: {
    label: "Commercial",
    bg: "rgba(46, 125, 50, 0.2)",
    border: "rgba(46, 125, 50, 0.5)",
    text: "#86EFAC",
  },
  event: {
    label: "Event",
    bg: "rgba(37, 99, 235, 0.2)",
    border: "rgba(37, 99, 235, 0.5)",
    text: "#93C5FD",
  },
  other: {
    label: "Other",
    bg: "rgba(63, 63, 70, 0.3)",
    border: "rgba(82, 82, 91, 0.6)",
    text: "#D4D4D8",
  },
};

export const SocialScheduleCard = forwardRef<
  HTMLDivElement,
  SocialScheduleCardProps
>(function SocialScheduleCard(
  {
    events,
    headline = "Shoot Schedule",
    format: cardFormat = "story",
    includeCategory = true,
    includeClientName = true,
    maskClientNames = false,
    includeEndTime = true,
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

  const hasTransform = scale !== 1;

  return (
    <div
      style={
        hasTransform
          ? {
              width: `${baseWidth * scale}px`,
              height: `${baseHeight * scale}px`,
              overflow: "hidden",
            }
          : {
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              overflow: "hidden",
            }
      }
      className="relative shrink-0 select-none"
    >
      <div
        ref={ref}
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          boxSizing: "border-box",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          ...(hasTransform
            ? {
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }
            : {}),
        }}
        className={`flex flex-col justify-between bg-[#0A0A0A] text-white ${
          isStory ? "p-[80px]" : "p-[56px]"
        } relative border border-[#27272A]`}
      >
        {/* 1. STUDIO HEADER */}
        <div className="relative z-10 border-b-[2px] border-[#27272A] pb-[32px]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[24px] uppercase tracking-[0.3em] text-[#A1A1AA] font-semibold">
                Muhammad Hadid
              </p>
              <h1 className="mt-[12px] text-[62px] font-light tracking-[0.02em] uppercase text-white leading-tight max-w-[800px]">
                {headline}
              </h1>
            </div>
            <div className="text-right">
              <span className="inline-block border border-[#3F3F46] px-[20px] py-[8px] text-[16px] uppercase tracking-[0.2em] font-medium text-[#E4E4E7]">
                Dates & Availability
              </span>
              <p className="mt-[12px] text-[16px] tracking-wider text-[#A1A1AA] uppercase">
                {sortedEvents.length} Shoot{sortedEvents.length === 1 ? "" : "s"} Listed
              </p>
            </div>
          </div>
        </div>

        {/* 2. EVENT LIST CONTAINER */}
        <div className="relative z-10 flex-1 my-[24px] overflow-hidden flex flex-col justify-start">
          {sortedEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-[32px]">
              <p className="text-[28px] font-light text-[#A1A1AA] uppercase tracking-widest">
                No Shoots Selected
              </p>
              <p className="mt-[12px] text-[20px] text-[#D4D4D8]">
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
                const timeDisplay = (() => {
                  if (!ev.shoot_time && !ev.shoot_end_time) return null;
                  if (!includeEndTime) {
                    return ev.shoot_time || ev.shoot_end_time || null;
                  }
                  if (ev.shoot_time && ev.shoot_end_time) {
                    return `${ev.shoot_time} - ${ev.shoot_end_time}`;
                  }
                  return ev.shoot_time || ev.shoot_end_time || null;
                })();
                const services = normalizeServices(ev.services);
                const hasPhoto = services.includes("photography");
                const hasVideo = services.includes("videography");
                const shootType: ShootType =
                  ev.shoot_type && isShootType(ev.shoot_type)
                    ? ev.shoot_type
                    : "other";
                const categoryStyle = CATEGORY_STYLES[shootType];

                const clientDisplay = maskClientNames
                  ? "Reserved"
                  : ev.client_name?.trim() || "Private Client";

                return (
                  <div
                    key={ev.id}
                    className={`flex items-center justify-between ${
                      isStory ? "py-[28px]" : "py-[20px]"
                    } gap-[32px]`}
                  >
                    {/* Date Block */}
                    <div className="flex items-center gap-[16px] shrink-0 w-[170px]">
                      <span className="text-[64px] font-light tracking-tight text-white tabular-nums leading-none">
                        {dayNum}
                      </span>
                      <div className="flex flex-col text-[18px] uppercase tracking-[0.15em] leading-tight">
                        <span className="font-semibold text-white">{monthAbbr}</span>
                        <span className="text-[#D4D4D8]">{dayName}</span>
                      </div>
                    </div>

                    {/* Content Block */}
                    <div className="flex-1 min-w-0 pr-[16px]">
                      <div className="flex items-center gap-[14px] flex-wrap">
                        <h3 className="text-[34px] font-medium tracking-[0.01em] text-white truncate max-w-[560px]">
                          {ev.title}
                        </h3>
                        {includeClientName && maskClientNames && (
                          <span className="shrink-0 text-[14px] uppercase tracking-[0.15em] bg-[#27272A] text-[#E4E4E7] px-[14px] py-[4px] border border-[#3F3F46] font-semibold">
                            Booked
                          </span>
                        )}
                        {includeCategory && (
                          <span
                            style={{
                              backgroundColor: categoryStyle.bg,
                              borderColor: categoryStyle.border,
                              color: categoryStyle.text,
                            }}
                            className="shrink-0 text-[14px] uppercase tracking-[0.15em] px-[14px] py-[4px] border border-solid font-semibold"
                          >
                            {categoryStyle.label}
                          </span>
                        )}
                      </div>

                      <div className="mt-[8px] flex flex-wrap items-center gap-[24px] text-[22px] text-[#A1A1AA]">
                        {includeClientName && (
                          <span className="text-[#E4E4E7] font-normal">
                            {clientDisplay}
                          </span>
                        )}
                        {timeDisplay ? (
                          <span className="tabular-nums text-[#A1A1AA]">
                            {timeDisplay}
                          </span>
                        ) : null}
                        {includeLocation && ev.location?.trim() ? (
                          <span className="inline-flex items-center gap-[8px] text-[#A1A1AA] truncate max-w-[360px]">
                            <MapPin size={22} className="shrink-0 text-[#A1A1AA]" strokeWidth={2} />
                            {ev.location.trim()}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Modular Service Badges */}
                    {includeServices && (
                      <div className="flex items-center gap-[12px] shrink-0">
                        {hasPhoto && (
                          <span className="inline-flex items-center gap-[8px] px-[16px] py-[6px] text-[15px] uppercase tracking-[0.12em] bg-white text-black font-semibold">
                            <Camera size={18} className="shrink-0 text-black" strokeWidth={2} />
                            Photo
                          </span>
                        )}
                        {hasVideo && (
                          <span className="inline-flex items-center gap-[8px] px-[16px] py-[6px] text-[15px] uppercase tracking-[0.12em] border-[2px] border-white text-white font-semibold">
                            <Video size={18} className="shrink-0 text-white" strokeWidth={2} />
                            Video
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {remainingCount > 0 && (
                <div className="py-[20px] text-center text-[18px] tracking-widest uppercase text-[#D4D4D8]">
                  + {remainingCount} additional dates booked
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. STUDIO FOOTER */}
        <div className="relative z-10 border-t-[2px] border-[#27272A] pt-[32px] flex items-center justify-between text-[#A1A1AA]">
          <div>
            <p className="text-white font-light tracking-[0.1em] text-[22px] uppercase">
              Bookings & Enquiries
            </p>
            <p className="mt-[4px] text-[18px] text-[#A1A1AA]">
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
