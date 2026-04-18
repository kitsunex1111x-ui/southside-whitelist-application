# Performance Monitoring Setup for React + Vite Project

## 🚀 Quick Setup Guide

### **Step 1: Install Performance Monitor Component**
I've created `src/components/PerformanceMonitor.tsx` for you.

### **Step 2: Add to Your App**
Add this to your `src/App.tsx`:

```typescript
import PerformanceMonitor from '@/components/PerformanceMonitor';

// Add inside your App component, before the return statement:
<PerformanceMonitor />
```

### **Step 3: Optional Analytics Integration**
If you want Google Analytics, add to your `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### **Step 4: Vercel Analytics (Recommended)**
Vercel automatically provides analytics for your deployment:
- Visit your Vercel dashboard
- Go to Analytics tab
- Real-time performance metrics included

## 📊 What It Monitors

- **FCP** (First Contentful Paint) - How fast content appears
- **LCP** (Largest Contentful Paint) - Main content load time  
- **FID** (First Input Delay) - Interactivity responsiveness
- **CLS** (Cumulative Layout Shift) - Visual stability
- **TTFB** (Time to First Byte) - Server response time

## 🎯 Benefits

- **Identify slow pages** before users complain
- **Track Core Web Vitals** automatically
- **Google Analytics integration** ready
- **Production-only** monitoring (no dev overhead)
- **Custom endpoint** support for your analytics

## 🔧 Usage

The monitor automatically:
- ✅ Runs only in production
- ✅ Sends metrics to Google Analytics or your endpoint
- ✅ Logs to console for debugging
- ✅ Cleans up properly on unmount

Deploy with this and you'll have enterprise-grade performance monitoring!
