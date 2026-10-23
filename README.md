# allyskyproject.com — QHTTP beacon

Minimal public site: transmission home + privacy page + outbound channel links from `site.json`.

## Live

- **Production:** https://allyskyproject.com/ (after DNS)
- **GitHub Pages:** https://ally-sky-project.github.io/website/
- **Repo:** https://github.com/Ally-Sky-Project/website

## Deploy

Push to `main` → GitHub Actions → Pages. Custom domain: GitHub Pages settings + Squarespace DNS (apex A → GitHub Pages IPs, `www` CNAME → `ally-sky-project.github.io`).

## Local preview

```bash
python3 -m http.server 8080
```

Open http://127.0.0.1:8080/

## License

Site HTML/CSS: MIT — [LICENSE](LICENSE).
