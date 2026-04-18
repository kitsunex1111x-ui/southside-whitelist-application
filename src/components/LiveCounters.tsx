import { useEffect, useRef, useState } from "react";

const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
};

const stats = [
  { label: "Active Members", value: 2847 },
  { label: "Applications", value: 1253 },
  { label: "Founded", value: 2026 },
];

// Individual stat card — hooks called at component level (valid)
const StatCard = ({ label, value }: { label: string; value: number }) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <div className="font-heading text-5xl md:text-6xl font-bold text-primary text-glow-red">
        {label === "Founded" ? count : count.toLocaleString()}
        {label !== "Founded" && <span className="text-primary">+</span>}
      </div>
      <div className="text-muted-foreground mt-2 uppercase tracking-wider text-sm">
        {label}
      </div>
    </div>
  );
};

const LiveCounters = () => {
  return (
    <section className="py-16 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveCounters;
