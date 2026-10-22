# R.R.S International School website

A responsive public-facing school website built with plain HTML, CSS, and JavaScript. The existing `assests/` folder is used as-is; its spelling and filenames are preserved.

## Run locally

Open `index.html` in a browser, or serve this folder with any static web server. For example, from this directory run:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Included

- Responsive homepage with the school introduction and vision/mission copy, individual class listings, school-life gallery, FAQ, admissions call to action, Google Maps location, and contact enquiry form. Each school photograph is placed once to keep the page focused.
- Real image assets from `assests/`, including the logo, campus image, student gatherings, events, and staff/community photographs.
- One-time Intersection Observer reveals, restrained image and control transitions, desktop fine-pointer follower, keyboard-operable mobile/tablet menu, accessible FAQ disclosures and gallery lightbox, reduced-motion support, and selective glass surfaces for navigation, controls, and enquiry panel.
- Enquiry form validation, individual Nursery/LKG/UKG/Class 1–10 choices, student and guardian contact fields, and visible status feedback.

## Submission confirmation

The enquiry form posts to the configured Google Apps Script web app. Because the request uses `no-cors`, the page cannot confirm that Google Sheets saved a submission; verify the Apps Script deployment and destination sheet before relying on it. The vision/mission panels reuse existing homepage wording; confirm the official wording if these are intended to represent formal school statements. No verified achievements, named principal message, or facilities inventory was provided, so these are not presented as school facts. The FAQ directs visitors to contact the school for current facilities information. The frontend does not include authentication or private student/teacher/guardian/principal/chairman portals.

## Image notes

| Asset | Used for |
| --- | --- |
| `optimized-assets/logo.png` | Header and footer logo plus browser-tab icon |
| `rrs-campus-hero.jpg` | Compressed hero copy of the supplied campus image (the original PNG is preserved) |
| `rrs3.webp` | About school-community image |
| `rr5.webp` | Gallery school-gathering image |
| `rrs7.webp` | School-team welcome section |
| `rr6.webp`, `rrr4.webp`, `rrs2.webp` | School-life gallery |

All supplied image files remain in place. Content is editable in `index.html`; styles and interaction behavior live in `styles.css` and `script.js`.

The standalone Vercel build in `vercel-ready/index.html` embeds its images, styles, and scripts, including a PNG copy of the school logo, so it does not depend on relative asset paths.
