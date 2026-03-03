import { Calendar, Camera, Images, Layout, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Skeleton } from "../components/ui/skeleton";
import { useGetAllSessions } from "../hooks/useQueries";
import { cn } from "../lib/utils";

const LAYOUT_LABELS: Record<string, string> = {
  strip_1x4: "1×4 Strip",
  grid_2x2: "2×2 Grid",
  strip_3x1: "3×1 Strip",
};

const SAMPLE_SESSIONS = [
  {
    id: "sample-1",
    eventName: "Mia & Daniel Wedding",
    date: BigInt(Date.now() * 1_000_000 - 86400000 * 1_000_000),
    createdAt: BigInt(Date.now() * 1_000_000 - 86400000 * 1_000_000),
    layoutType: "strip_1x4",
    photoCount: BigInt(4),
  },
  {
    id: "sample-2",
    eventName: "Sakura Blossom Party",
    date: BigInt(Date.now() * 1_000_000 - 86400000 * 3 * 1_000_000),
    createdAt: BigInt(Date.now() * 1_000_000 - 86400000 * 3 * 1_000_000),
    layoutType: "grid_2x2",
    photoCount: BigInt(4),
  },
  {
    id: "sample-3",
    eventName: "Tokyo Tech Conference",
    date: BigInt(Date.now() * 1_000_000 - 86400000 * 7 * 1_000_000),
    createdAt: BigInt(Date.now() * 1_000_000 - 86400000 * 7 * 1_000_000),
    layoutType: "strip_3x1",
    photoCount: BigInt(3),
  },
  {
    id: "sample-4",
    eventName: "Neon Nights Gala",
    date: BigInt(Date.now() * 1_000_000 - 86400000 * 14 * 1_000_000),
    createdAt: BigInt(Date.now() * 1_000_000 - 86400000 * 14 * 1_000_000),
    layoutType: "strip_1x4",
    photoCount: BigInt(4),
  },
  {
    id: "sample-5",
    eventName: "Studio 88 Opening Night",
    date: BigInt(Date.now() * 1_000_000 - 86400000 * 21 * 1_000_000),
    createdAt: BigInt(Date.now() * 1_000_000 - 86400000 * 21 * 1_000_000),
    layoutType: "grid_2x2",
    photoCount: BigInt(4),
  },
  {
    id: "sample-6",
    eventName: "Cherry Blossom Picnic",
    date: BigInt(Date.now() * 1_000_000 - 86400000 * 30 * 1_000_000),
    createdAt: BigInt(Date.now() * 1_000_000 - 86400000 * 30 * 1_000_000),
    layoutType: "strip_3x1",
    photoCount: BigInt(3),
  },
];

export function GalleryPage() {
  const { data: sessions, isLoading } = useGetAllSessions();

  const allSessions = useMemo(() => {
    const real = sessions ?? [];
    return [
      ...real,
      ...SAMPLE_SESSIONS.filter((s) => !real.some((r) => r.id === s.id)),
    ];
  }, [sessions]);

  // Group by date (day buckets)
  const grouped = useMemo(() => {
    const map = new Map<string, typeof allSessions>();
    for (const session of allSessions) {
      const dateMs = Number(session.date) / 1_000_000;
      const day = new Date(dateMs).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(session);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [allSessions]);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] page-enter">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Images className="w-5 h-5 text-amber" />
            <h1 className="font-display text-3xl font-bold text-cream tracking-tight">
              Gallery
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            All past photobooth sessions, organized by date.
          </p>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono text-xs">Loading sessions...</span>
          </div>
        )}

        {/* Sessions grouped by date */}
        <div className="space-y-10">
          {grouped.length === 0 && !isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-ocid="gallery.sessions.empty_state"
              className="text-center py-20"
            >
              <Camera className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm font-mono">
                No sessions yet.
              </p>
              <p className="text-muted-foreground/60 text-xs font-mono mt-1">
                Start a photobooth session to see it here.
              </p>
            </motion.div>
          ) : (
            grouped.map(([date, dateSessions], groupIdx) => (
              <motion.section
                key={date}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.08 }}
              >
                {/* Date heading */}
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-amber/70" />
                  <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {date}
                  </h2>
                  <div className="flex-1 h-px bg-border/30" />
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    {dateSessions.length}{" "}
                    {dateSessions.length === 1 ? "session" : "sessions"}
                  </span>
                </div>

                {/* Session cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dateSessions.map((session, idx) => {
                    const absoluteIdx = allSessions.indexOf(session) + 1;
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        data-ocid={`gallery.session.item.${absoluteIdx}`}
                        className="card-glow rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:border-amber/20"
                      >
                        {/* Layout type badge */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <Layout className="w-3 h-3 text-amber/70" />
                            <span className="text-[10px] font-mono text-amber/70 uppercase tracking-wider">
                              {LAYOUT_LABELS[session.layoutType] ??
                                session.layoutType}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground/50">
                            {Number(session.photoCount)} shots
                          </span>
                        </div>

                        {/* Photo placeholder strip visual */}
                        <div
                          className={cn(
                            "w-full mb-3 rounded-sm overflow-hidden bg-secondary/30 border border-border/30",
                            session.layoutType === "grid_2x2"
                              ? "aspect-square"
                              : "aspect-[1/2.5]",
                          )}
                        >
                          {session.layoutType === "grid_2x2" ? (
                            <div className="w-full h-full grid grid-cols-2 gap-px bg-border/20">
                              {["a", "b", "c", "d"].map((cell) => (
                                <div
                                  key={cell}
                                  className="bg-secondary/20 shimmer"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col gap-px bg-border/20">
                              {(session.layoutType === "strip_3x1"
                                ? ["a", "b", "c"]
                                : ["a", "b", "c", "d"]
                              ).map((cell) => (
                                <div
                                  key={cell}
                                  className="flex-1 bg-secondary/20 shimmer"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Session info */}
                        <p className="text-xs font-display font-semibold text-cream truncate group-hover:text-amber/90 transition-colors">
                          {session.eventName}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {new Date(
                            Number(session.createdAt) / 1_000_000,
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
