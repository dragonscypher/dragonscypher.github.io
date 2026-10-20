# shivampal.in

Source for my personal portfolio at [shivampal.in](https://shivampal.in).

It is a plain static site with no framework or build step: hand-written HTML and CSS, vanilla JavaScript, and GSAP with Lenis for scroll animation. Project cards are data-driven. I keep them in `assets/js/projects-data.js` and a small renderer in `assets/js/script.js` builds the project reel and the earlier-work list. It also pulls my recent public repositories from the GitHub API.

I wanted it to load fast, work without a toolchain, and be easy to edit whenever I ship something new.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

## Deploy

GitHub Pages and Vercel both serve this repo. `vercel.json` sets security headers (CSP, HSTS, frame and referrer policies) and `package.json` pins the Node version Vercel builds with.

## License

MIT
