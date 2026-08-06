# 3D Elastic Wave Explorer

A mobile-first, build-free Three.js educational app that separates wave propagation direction from material-particle motion.

## Modes

- **P wave:** longitudinal displacement parallel to propagation; compression/tension proxy.
- **SH wave:** horizontal transverse displacement; signed shear proxy.
- **SV wave:** vertical transverse displacement; signed shear proxy.
- **Rayleigh wave:** elliptical surface motion with exponential depth decay.
- **A0-like flexural plate wave:** dominant out-of-plane bending and opposite in-plane displacement across thickness.
- **S0-like extensional plate wave:** dominant in-plane extension with weak thickness response.

The reference particle grid is faint; the displaced grid is strong. Motion is visually exaggerated. Purple arrows and trails encode displacement independently of color. A movable x-normal slice helps inspect the interior.

## Physics

For phase `q = kx - ωt`, `k = 2π/λ`, and `ω = 2πf`, simplified analytical displacement fields are implemented in `physics.js`. The flexural pulse uses the Kirchhoff–Love thin-plate relation:

`ρh ẅ + D∇⁴w = 0`, with `D = Eh³/[12(1-ν²)]`

Therefore `ω = sqrt(D/(ρh)) k²`, `cp = ω/k`, and `cg = dω/dk = 2cp`. The pulse is a finite sum of wavelength components. In the real case their speeds differ, so the waveform spreads; in the artificial case `ω=ck` and it does not disperse.

This is a linear educational visualization, not finite-element analysis. It omits exact Lamb/Rayleigh eigenfunctions, boundaries, reflections, damping, anisotropy, nonlinear effects and calibrated stresses.

## Controls

Play/pause, slow motion, frame steps, time scrubber, wave and geometry selection, frequency, wavelength, exaggeration, density, cross-section position, camera presets, orbit/zoom gestures, reference grid, vectors, trails, color field, cross-section, comparison mode, impact coupling, pulse dispersion and guided tutorial.

## Run

No build step is needed. Serve the folder with any static web server, or use GitHub Pages. Opening `index.html` directly may be blocked by browser module security, so Pages is recommended.

## Test

`npm test` runs Node's built-in test runner against displacement directions, Rayleigh decay and dispersion relations.

## Deploy to GitHub Pages

The workflow `.github/workflows/pages.yml` tests and deploys every push to `main`. In the repository, set **Settings → Pages → Source** to **GitHub Actions** once. The resulting URL is normally `https://USERNAME.github.io/REPOSITORY/`.
