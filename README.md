# BERL Website

Static multi-page website for **Bioenergy & Environmental Research Laboratory (BERL)**, designed for GitHub Pages.

## Included

- Multi-page responsive website
- Home / About / Research / People / Publications / Projects / Facilities / News / Join Us / Contact / Search
- Individual member profile pages via `member.html?id=...`
- Member/research/news/project/facility content managed through JSON
- Publication search and filtering
- OpenAlex-based publication + citation metric updater
- Weekly GitHub Actions automation
- Google Scholar / ORCID / ResearchGate links per member
- Formspree contact form integration
- GitHub Pages `.nojekyll`
- Custom-domain example

## 1. First edits

### Laboratory information
Edit:

`data/site.json`

Change at least:

- `contact_email`
- `telephone`
- `website`
- `formspree_endpoint`

### Members
Edit:

`data/members.json`

To add a person, duplicate one JSON object and give the person a unique `id`.

Photo example:

```json
"photo": "assets/images/dongyu-bang.jpg"
```

A card on `people.html` automatically links to:

`member.html?id=YOUR_ID`

### Research
Edit:

`data/research.json`

### News
Edit:

`data/news.json`

### Projects
Edit:

`data/projects.json`

### Facilities
Edit:

`data/facilities.json`

## 2. Contact form → email

This package uses **Formspree** because GitHub Pages has no server-side mail process.

1. Create a Formspree form.
2. Copy your endpoint, for example:
   `https://formspree.io/f/abcdwxyz`
3. Open `data/site.json`.
4. Replace:
   `https://formspree.io/f/REPLACE_WITH_YOUR_FORM_ID`
5. Configure the destination email in Formspree.

The contact form intentionally refuses to submit until the placeholder is replaced.

## 3. Automatic publications

### Why not scrape Google Scholar?
The website provides Google Scholar profile links, but the automated updater uses **OpenAlex** rather than scraping Scholar.

### Configure
Edit:

`data/scholar-config.json`

Example:

```json
{
  "contact_email_for_openalex": "your-email@hanyang.ac.kr",
  "authors": [
    {
      "name": "Professor Name",
      "openalex_id": "A1234567890",
      "orcid": "0000-0000-0000-0000",
      "google_scholar_url": "https://scholar.google.com/..."
    }
  ]
}
```

You can find an OpenAlex author ID on an OpenAlex author page. Add multiple BERL members if you want the publication list to represent all configured authors.

### What the updater does
`scripts/update_publications.py`:

- downloads works for configured OpenAlex authors
- deduplicates them by DOI / OpenAlex ID
- merges `data/manual-publications.json`
- writes `data/publications.json`
- calculates publication count, total indexed citations, h-index, and OA-work count
- writes `data/metrics.json`

### Run manually on your computer

From the repository directory:

```bash
python scripts/update_publications.py
```

### GitHub automation
`.github/workflows/update-publications.yml` runs weekly and can also be triggered manually from the **Actions** tab.

If no `openalex_id` is configured, it exits safely without modifying anything.

## 4. Manual publication additions

If a paper is missing from OpenAlex, add it to:

`data/manual-publications.json`

Example:

```json
[
  {
    "id": "manual-001",
    "year": 2026,
    "title": "Paper title",
    "authors": ["A. Author", "B.-H. Jeon"],
    "journal": "Journal Name",
    "doi": "10.0000/example",
    "url": "https://doi.org/10.0000/example",
    "open_access": true,
    "cited_by_count": 0,
    "type": "article",
    "source": "manual",
    "topics": ["Anaerobic Digestion"]
  }
]
```

## 5. GitHub Pages deployment

1. Create a GitHub repository, e.g. `berl-website`.
2. Upload **the contents of this folder** to the repository root.
3. In GitHub:
   - `Settings`
   - `Pages`
   - `Build and deployment`
   - `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Save.

GitHub will provide an address such as:

`https://YOUR_ACCOUNT.github.io/berl-website/`

### Important
This project is optimized for a custom domain because links are simple relative links.

## 6. School custom domain

A sample is included as:

`CNAME.example`

When the school confirms your actual subdomain:

1. Rename `CNAME.example` → `CNAME`
2. Put only the approved hostname inside, e.g.
   `berl.hanyang.ac.kr`
3. In GitHub Pages settings, enter the same custom domain.
4. Ask the university DNS administrator to point that hostname to your GitHub Pages hostname using the DNS record type they approve.

Do **not** create `CNAME` until the domain has actually been approved.

## 7. Local preview

Do not double-click the HTML file directly because JSON `fetch()` may be blocked under `file://`.

Run a small local web server:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

## 8. Recommended next edits

- Add the official BERL logo and Hanyang-approved visual assets
- Replace all sample members
- Add professor biography and official profile links
- Add actual lab address / building / room
- Configure Formspree
- Configure OpenAlex author IDs
- Add lab and equipment photographs
- Replace sample news, projects, and facilities
- Add a Korean-language version if needed

## Project structure

```text
berl-website/
├── index.html
├── about.html
├── research.html
├── people.html
├── member.html
├── publications.html
├── projects.html
├── facilities.html
├── news.html
├── join.html
├── contact.html
├── search.html
├── 404.html
├── .nojekyll
├── CNAME.example
├── robots.txt
├── assets/
│   ├── css/style.css
│   ├── js/
│   └── images/
├── data/
│   ├── site.json
│   ├── members.json
│   ├── research.json
│   ├── publications.json
│   ├── manual-publications.json
│   ├── metrics.json
│   ├── news.json
│   ├── projects.json
│   ├── facilities.json
│   └── scholar-config.json
├── scripts/
│   └── update_publications.py
└── .github/
    └── workflows/
        └── update-publications.yml
```
