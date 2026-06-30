# Slides

The slide sources are Marp-flavored Markdown files. Render them with
`@marp-team/marp-cli` through `npx` so a local Marp install is not required.

## Render HTML

From the repository root:

```bash
npx --yes @marp-team/marp-cli \
  slides/inat-inquire-demo.marp.md \
  --output slides/inat-inquire-demo.marp.html
```

From this `slides/` folder:

```bash
npx --yes @marp-team/marp-cli \
  inat-inquire-demo.marp.md \
  --output inat-inquire-demo.marp.html
```

The `.html` output extension tells Marp CLI to write an HTML deck. The `--html`
flag has a different meaning: it enables raw HTML tags inside slide Markdown
when a deck needs them.

## Export PowerPoint

Yes. Marp CLI exports PowerPoint as `.pptx`:

```bash
npx --yes @marp-team/marp-cli \
  slides/inat-inquire-demo.marp.md \
  --pptx \
  --output slides/inat-inquire-demo.pptx
```

For an experimental editable PowerPoint export:

```bash
npx --yes @marp-team/marp-cli \
  slides/inat-inquire-demo.marp.md \
  --pptx \
  --pptx-editable \
  --output slides/inat-inquire-demo.editable.pptx
```

## Other Useful Exports

PDF:

```bash
npx --yes @marp-team/marp-cli \
  slides/inat-inquire-demo.marp.md \
  --pdf \
  --output slides/inat-inquire-demo.pdf
```

PNG image of the first slide:

```bash
npx --yes @marp-team/marp-cli \
  slides/inat-inquire-demo.marp.md \
  --image png \
  --output slides/inat-inquire-demo.png
```

PNG images for every slide:

```bash
npx --yes @marp-team/marp-cli \
  slides/inat-inquire-demo.marp.md \
  --images png \
  --output slides/inat-inquire-demo
```

If a deck references local image files, add `--allow-local-files` to the export
command.

