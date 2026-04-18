import { useEffect } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export const PerformanceMonitor = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return;
    }

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          sendMetric('LCP', entry.startTime);
        }
        
        if (entry.entryType === 'first-contentful-paint') {
          sendMetric('FCP', entry.startTime);
        }
        
        if (entry.entryType === 'first-input') {
          sendMetric('FID', (entry as any).processingStart - entry.startTime);
        }
        
        if (entry.entryType === 'layout-shift') {
          sendMetric('CLS', (entry as any).value);
        }
      }
    });

    // Observe performance metrics
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-contentful-paint', 'first-input', 'layout-shift'] });

    // Monitor navigation timing
    const measureNavigationTiming = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        sendMetric('TTFB', navigation.responseStart - navigation.requestStart);
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measureNavigationTiming();
    } else {
      window.addEventListener('load', measureNavigationTiming);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('load', measureNavigationTiming);
    };
  }, []);

  const sendMetric = (name: string, value: number) => {
    // Send to your analytics service
    // Example: Google Analytics, Vercel Analytics, or custom endpoint
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vital', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        non_interaction: true,
      });
    }
    
    // Analytics endpoint can be added here when available
  };

  return null; // This component doesn't render anything
};

export default PerformanceMonitor;
