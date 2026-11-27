# Aerospace Engineering Portfolio — Komgbenda Joseph Oryiman

**Live Portfolio:** [https://joe47122.github.io/joey4319/](https://joe47122.github.io/joey4319/)  
**Repository:** [https://github.com/Joe47122/joey4319](https://github.com/Joe47122/joey4319)

A zero-dependency HTML5, CSS3, and Canvas-driven aerospace engineering portfolio presenting computational aerodynamics (CFD), aircraft conceptual sizing, vortex-lattice & blade-element propulsion matching, and high-bypass/military gas-turbine 3D CAD assemblies.

---

## 1. Engineering Case Studies & Pages

| Page | File | Highlights |
| :--- | :--- | :--- |
| **Landing Page** | `index.html` | 3D rolling project panorama behind a studio cutout portrait, featured engineering projects, interactive experience tabs (**Turing**, **Dwello Aerospace**, **Nigerian Air Force**), 3-step engineering workflow, and direct contact hub. |
| **Projects Index** | `projects.html` | Filterable catalog across **CFD & Aerodynamics**, **Aircraft Design**, and **3D CAD & Propulsion**. |
| **ATR 72-600 Prop-Wash CFD Thesis** | `project-atr72.html` | Steady RANS (**ANSYS Fluent**) slipstream interaction study coupling a user-defined **Actuator Disk Model (ADMv2)** with **Blade Element Momentum (BEM)** radial thrust/swirl loads across **616,523 poly-hexcore cells** and a 3-level **Grid Convergence Index (GCI)** verification study. |
| **Carter Fusion 260 Business Jet** | `project-carter260.html` | Clean-sheet 16-passenger long-range twin-turbofan conceptual design (**MTOW 27,295 kg**, **7,860 km range** at **Mach 0.80 / FL430**, **0.236–0.293 MAC** all-fuel/payload CG envelope). |
| **Tailless Swept Flying-Wing UAV** | `project-uav.html` | **1.80 m** span tailless flying-wing longitudinal trim ($C_{m\alpha} < 0$, $C_{m0} > 0$) using **15.24°** sweep, **−4.50°** tip washout, reflexed **Eppler E186** & **Martin Hepperle MH49** airfoils across **960 structured quad panels** in **AVL**, matched to a custom **BEM** pusher propeller and exported as **STEP AP242** geometry. |
| **3D CAD & Propulsion Portfolio** | `cad-portfolio.html` | **GE90-115B** wide-chord swept fan & nacelles, **Eurojet EJ200** low-bypass afterburning military turbofan cutaway, and **FreeCAD** parametric structural bike brace (**ISO 2768-m**) & bearing-mounted flat pedal assemblies with click-to-zoom lightbox inspection. |
| **Curriculum Vitae** | `resume.html` | Interactive web CV paired with downloadable PDF (`assets/resume.pdf`). |

---

## 2. Interactive UI & Physics Features

- **Stratosphere Ice-Blue & Brushed Titanium Liquid-Glass Design System (`style.css`)**
  - Deep Obsidian Carbon (`#07090f`) backdrop with pointer-tracked specular glass cards, filter pills, and navigation controls, paired with emerald active-status indicators (`#34d399`).
  - Subtle **22 ms tempered-glass micro-tap** acoustic feedback synthesized via the Web Audio API on interactive control presses, accompanied by a radial ripple shockwave.
- **Full-Page Wind-Tunnel Airflow Streamlines (`app.js`)**
  - 16 continuous background streamlines that physically deflect around the user's pointer in real time.
- **5 Randomized Cursor-Tracking Aerospace Craft (`app.js`)**
  - Each page reload selects a distinct flight vehicle (guaranteed non-repeating across consecutive reloads via `sessionStorage`), controllable via the navbar **`[Craft]: ON / OFF`** toggle and **`↻`** craft switcher:
    1. **Tailless Swept UAV**
    2. **SpaceX Super Heavy Booster** — features a full **Mechazilla launch tower & Chopstick catch sequence** when the pointer holds stationary, descending diagonally on a Mach-diamond Raptor plume before gimballing upright into the catch arms under the upper waffle grid fins, accompanied on the first two landings by the authentic 1969 Apollo 11 touchdown transmission (`assets/touchdown-radio.mp3`).
    3. **Helicopter** with animated 4-blade main rotor disk.
    4. **Quadcopter Drone** with 4 counter-rotating micro-rotors.
    5. **Commercial Twin-Jet Airliner**
- **3D Rolling Hero Project Panorama (`index.html`, `app.js`)**
  - Six project preview cards revolve along an elliptical 3D depth arc behind the hero portrait, pausing smoothly on hover and linking directly to each engineering case study.

---

## 3. Repository Structure

```text
joey4319/
├── index.html               # Landing page with 3D rolling hero panorama & experience tabs
├── projects.html            # Filterable engineering projects index
├── project-atr72.html       # ATR 72-600 CFD & ADMv2/BEM actuator disk thesis case study
├── project-carter260.html   # Carter Fusion 260 16-PAX twin-turbofan conceptual design case study
├── project-uav.html         # 1.80 m Tailless Flying-Wing UAV AVL & BEM propeller matching study
├── cad-portfolio.html       # GE90-115B, Eurojet EJ200 & FreeCAD parametric CAD gallery
├── resume.html              # Online CV with downloadable PDF link
├── style.css                # Shared liquid-glass tokens, typography, responsive grid & animations
├── app.js                   # Wind-tunnel canvas, 5 flight vehicles, 3D panorama, glass-tap audio & lightbox
├── README.md                # Project documentation, deployment & customization guide
└── assets/                  # Project renders, CFD contours, CAD drawings, audio & resume.pdf
```

---

## 4. Local Preview & Deployment Guide

This is a static HTML/CSS/JS site with **zero build step or npm dependencies**.

### Previewing Locally

Open `index.html` directly in any modern browser, or serve the folder over a local HTTP server:

```bash
# Using Python 3
python -m http.server 8080
```

Then visit `http://localhost:8080`.

### Updating & Pushing to GitHub Pages

GitHub Pages is configured to deploy automatically from the `main` branch (`/root` directory) to **[https://joe47122.github.io/joey4319/](https://joe47122.github.io/joey4319/)**.

```bash
git add .
git commit -m "Describe your portfolio update"
git push origin main
```

Within 30–60 seconds of pushing to `main`, GitHub Pages rebuilds and publishes the updated site.

---

## 5. Customization Reference

- **Theme Colors & Glass Tokens:** Edit the `:root` CSS variables at the top of `style.css` (`--bg`, `--accent`, `--accent-strong`, `--status-green`, `--glass-bg`, `--glass-border`).
- **Typography:** Uses `Plus Jakarta Sans` for display headings, `Inter` for technical prose, and `IBM Plex Mono` for engineering parameters and telemetry readouts.
- **Adding New CAD Images or CFD Plots:** Place new visuals in `assets/` and reference them inside `cad-portfolio.html` or a project page; any image inside `.cad-item` or `.media-card` automatically supports the click-to-zoom lightbox.
- **Updating the Resume PDF:** Replace `assets/resume.pdf` with your latest export—every `"Download PDF"` button across `resume.html` and the navigation bar points directly to `assets/resume.pdf`.

---

## 6. Author & Contact

**Komgbenda Joseph Oryiman**  
B.Eng. Aerospace Engineering — Air Force Institute of Technology (AFIT)  
- **Email:** [komgbendajoseph6@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=komgbendajoseph6@gmail.com)  
- **WhatsApp:** [+234 701 752 2777](https://wa.me/2347017522777)  
- **LinkedIn:** [linkedin.com/in/joseph-komgbenda-38bb41287](https://www.linkedin.com/in/joseph-komgbenda-38bb41287/)
