import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to `ref` and adds the class
 * `animate-reveal` when the element enters the viewport.
 * Pair with the CSS in index.css:
 *   .reveal-on-scroll  { opacity:0; transform:translateY(32px); transition:... }
 *   .animate-reveal    { opacity:1; transform:translateY(0); }
 */
export function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.transitionDelay = `${delay}ms`;
    el.classList.add("reveal-on-scroll");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-reveal");
          el.classList.add("expanded"); // for section-line width animation
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return ref;
}
