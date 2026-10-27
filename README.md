# Pinch & Snap — Hybrid X-Ray

A minimalist Chrome extension for exploring web interfaces, inspecting page structure, experimenting with CSS, and saving useful UI references.

> **Status:** Experimental / community testing welcome. This repository has not yet been verified across every website or Chrome version.

## Features

- **X-Ray inspection** — reveal page structure and inspect elements.
- **Four inspection modes** — Skeleton, Layout, Spacing, and Component.
- **CSS experimentation** — preview style changes and undo the current preview.
- **Copy useful details** — copy selected element markup or generated CSS where supported.
- **Pockets** — save component/reference records locally in Chrome storage.
- **Minimal interface** — designed to stay out of the way while you work.

Feature availability can depend on the page, the element selected, and Chrome's content-script restrictions.

## Install locally (Chrome)

This project is currently distributed as an unpacked extension for testing.

1. Download or clone this repository.
2. Extract the files if you downloaded a ZIP.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode**.
5. Select **Load unpacked**.
6. Choose the repository folder containing `manifest.json`.
7. Open a regular website and test the extension.

To reload after changing code, return to `chrome://extensions` and press the extension's **Reload** button.

## Quick testing checklist

- [ ] Extension loads without a manifest error.
- [ ] Popup opens and the inspector can be activated.
- [ ] Skeleton, Layout, Spacing, and Component modes respond as expected.
- [ ] CSS preview applies only to the intended element.
- [ ] Undo restores the original previewed styles.
- [ ] Copy actions produce the expected output.
- [ ] Pockets save and restore records as expected.
- [ ] Existing keyboard shortcuts still work.
- [ ] Test on more than one site and on a long page.

**Note:** Browser extensions cannot inspect every page. Chrome internal pages, the Chrome Web Store, and some protected or cross-origin contexts restrict extension scripts.

## Privacy

Pinch & Snap is intended to work locally in your browser. The current implementation stores saved Pockets/reference records in `chrome.storage.local`.

Before publishing or distributing a release, review the complete source code and manifest to confirm:
- whether any network requests are made;
- what page content is read;
- what data is stored and for how long;
- which Chrome permissions are requested.

Do not claim that the extension collects no data unless you have verified that against the full codebase. If you add analytics, remote services, or new storage behavior, update this section and the Chrome Web Store disclosures accordingly.

## Permissions

The exact permissions requested by the extension are defined in [`manifest.json`](manifest.json). Review that file before installation and before every release. Request only permissions that are required by the features you ship.

## Project structure

The repository contains the Chrome extension manifest, interface files, and scripts used by the extension. The inspector implementation provides the X-Ray modes and related interactions.

## Contributing

Bug reports, reproducible examples, and focused pull requests are welcome. Please include:
- Chrome version and operating system;
- the website where the issue occurs (avoid sharing private URLs or account data);
- steps to reproduce;
- expected versus actual behavior;
- console errors, with sensitive information removed.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Roadmap

- [ ] Stabilize inspector activation and all four modes across common sites.
- [ ] Add a navigable DOM/component tree.
- [ ] Add robust CSS undo/redo and export workflows.
- [ ] Add responsive viewport checks and overflow detection.
- [ ] Improve Snap Studio for capturing and organizing references.
- [ ] Expand Pockets with search, labels, and export/import.

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).

---

Made by Vyom with ❤️❤️
