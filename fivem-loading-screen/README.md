# Southside RP - FiveM Loading Screen

## 🎬 Epic Animated Loading Screen

### Features:
- ✅ Animated logo with glitch/pulse effects
- ✅ "SOUTHSIDE" text with gradient animation
- ✅ Particle background effects
- ✅ Progress bar with blood drip
- ✅ Server rules popup
- ✅ Grunge/scanline overlay effects
- ✅ Music toggle button
- ✅ Responsive design

## 📁 Files:
- `index.html` - Main loading screen
- `logo.png` - Your server logo (add your logo image)
- `music.mp3` - Background music (add your song)
- `background.mp4` - Video background (add your cinematic video)

## 🚀 Installation:

### Step 1: Add Your Files
1. Save your logo as `logo.png` in this folder
2. Add your music as `music.mp3` (optional)
3. **Add your video as `background.mp4` (optional but recommended!)**

### 🎬 Video Background Setup
**For the cinematic GTA-style video:**

**Option A: Find a Video**
- Search YouTube: "GTA 5 cinematic city night rain"
- Download with yt-dlp or similar tool
- Convert to MP4 format
- Rename to `background.mp4`

**Option B: Use AI Video Generator**
- Runway ML (runwayml.com) - Best quality
- Pika Labs (pika.art) - Good for short clips
- Prompt: *"Cinematic GTA-style city at night, heavy rain, neon lights reflecting on wet streets, slow camera driving through empty urban streets, moody atmosphere, dark gangster vibe, Southside city feel, ultra realistic, film grain, 4K"*

**Option C: Use Static Image**
- If no video, just add a high-res image
- The code will work without video (shows black background with effects)

**Video Requirements:**
- Format: MP4
- Resolution: 1920x1080 minimum
- Duration: 10-30 seconds (loops automatically)
- File size: Keep under 50MB for fast loading

### Step 2: Add to FiveM
1. Copy this entire `fivem-loading-screen` folder to your FiveM server's `resources` folder
2. Rename it to something like `southside-loadingscreen`
3. Add to your `server.cfg`:
   ```
   ensure southside-loadingscreen
   ```

### Step 3: Configure (optional)
Edit `index.html` to customize:
- Server name
- Rules text
- Colors (red/black by default)
- Animation speed

## 🎨 Customization:

### Change Server Name:
Find `<h1 class="server-name">SOUTHSIDE</h1>` and change the text.

### Change Tagline:
Find `<p class="tagline">The Streets Remember</p>` and edit.

### Change Rules:
Find the `.rules-popup` section and edit the HTML.

### Change Colors:
Edit the CSS variables:
- Red: `#dc2626` (change to your color)
- Black: `#0a0a0a` (background)

## 🎵 Music:
Add your music file as `music.mp3` in the same folder.
Or use a URL:
```html
<audio id="bgMusic" loop>
    <source src="https://your-site.com/music.mp3" type="audio/mpeg">
</audio>
```

## 📱 Preview:
Open `index.html` in your browser to test!
Screen record it for a YouTube intro video.

## 🔥 Created by Cascade AI
Built for Southside RP
