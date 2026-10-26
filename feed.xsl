<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="atom:feed/atom:title"/></title>
        <style>
          :root { color-scheme: dark; }
          body {
            margin: 0;
            padding: 2rem 1.25rem 3rem;
            max-width: 44rem;
            margin-left: auto;
            margin-right: auto;
            background: #06080c;
            color: #e8eef4;
            font-family: Inter, system-ui, sans-serif;
            font-size: 0.95rem;
            line-height: 1.55;
          }
          h1 {
            font-family: "Source Code Pro", ui-monospace, monospace;
            font-size: 1rem;
            font-weight: 500;
            color: #8ecae8;
            margin: 0 0 0.5rem;
          }
          .subtitle, .hint {
            color: #7a8a9a;
            font-size: 0.85rem;
            margin: 0 0 1.25rem;
          }
          .hint code {
            font-family: "Source Code Pro", ui-monospace, monospace;
            font-size: 0.8rem;
            color: #e8eef4;
          }
          ul { list-style: none; margin: 0; padding: 0; }
          li {
            margin-bottom: 1rem;
            padding: 1rem 1.1rem;
            border: 1px solid rgba(232, 238, 244, 0.1);
            background: rgba(12, 16, 24, 0.55);
          }
          li a {
            color: #e8eef4;
            text-decoration: none;
            font-family: "Source Code Pro", ui-monospace, monospace;
            font-size: 0.95rem;
          }
          li a:hover { color: #8ecae8; }
          .date {
            display: block;
            margin-top: 0.35rem;
            color: #7a8a9a;
            font-family: "Source Code Pro", ui-monospace, monospace;
            font-size: 0.72rem;
          }
          .summary {
            margin-top: 0.5rem;
            color: #7a8a9a;
            font-family: "Source Code Pro", ui-monospace, monospace;
            font-size: 0.72rem;
            line-height: 1.45;
          }
          .nav a { color: #5a9ab8; }
        </style>
      </head>
      <body>
        <p class="nav"><a href="/transmissions/">← Transmissions</a> · <a href="/">Beacon</a></p>
        <h1><xsl:value-of select="atom:feed/atom:title"/></h1>
        <p class="subtitle"><xsl:value-of select="atom:feed/atom:subtitle"/></p>
        <p class="hint">
          This URL is an <strong>Atom syndication feed</strong> for RSS apps (Feedly, NetNewsWire, etc.).
          Paste <code>/feed.xml</code> into your reader — not a comic page.
          <a href="/transmissions/">Human registry</a>
        </p>
        <ul>
          <xsl:for-each select="atom:feed/atom:entry">
            <li>
              <a href="{atom:link[@rel='alternate']/@href}">
                <xsl:value-of select="atom:title"/>
              </a>
              <span class="date"><xsl:value-of select="substring(atom:published, 1, 10)"/></span>
              <p class="summary"><xsl:value-of select="atom:summary"/></p>
            </li>
          </xsl:for-each>
        </ul>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
