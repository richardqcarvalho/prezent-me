import fs from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFString, rgb, type Color, type PDFFont, type PDFPage } from "pdf-lib";

import type { WizardDraft } from "@/components/wizard/draft";
import { buildPortfolioViewModel } from "@/lib/portfolio";

const PAGE_WIDTH = 595.28; // A4 width in pt
const PAGE_HEIGHT = 841.89; // A4 height in pt
const MARGIN_X = 44;
const MARGIN_TOP = 42;
const MARGIN_BOTTOM = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const COLORS = {
  background: rgb(1, 1, 1),
  foreground: rgb(0.09, 0.09, 0.09), // #171717
  secondaryForeground: rgb(0.16, 0.16, 0.16), // #292929
  body: rgb(0.26, 0.26, 0.26), // #424242
  mutedForeground: rgb(0.45, 0.45, 0.45), // #737373
  muted: rgb(0.955, 0.955, 0.955), // #F4F4F4
  chipBg: rgb(0.98, 0.98, 0.98), // #FAFAFA
  border: rgb(0.895, 0.895, 0.895), // #E4E4E4
  divider: rgb(0.925, 0.925, 0.925), // #ECECEC
};

type FontBundle = {
  sansRegular: Uint8Array;
  sansMedium: Uint8Array;
  sansSemiBold: Uint8Array;
  sansBold: Uint8Array;
  monoRegular: Uint8Array;
};

let cachedFontBytes: Promise<FontBundle> | null = null;

function loadFontBytes(): Promise<FontBundle> {
  if (!cachedFontBytes) {
    const fontsDir = path.join(process.cwd(), "node_modules", "geist", "dist", "fonts");
    cachedFontBytes = Promise.all([
      fs.readFile(path.join(fontsDir, "geist-sans", "Geist-Regular.ttf")),
      fs.readFile(path.join(fontsDir, "geist-sans", "Geist-Medium.ttf")),
      fs.readFile(path.join(fontsDir, "geist-sans", "Geist-SemiBold.ttf")),
      fs.readFile(path.join(fontsDir, "geist-sans", "Geist-Bold.ttf")),
      fs.readFile(path.join(fontsDir, "geist-mono", "GeistMono-Regular.ttf")),
    ]).then(([sansRegular, sansMedium, sansSemiBold, sansBold, monoRegular]) => ({
      sansRegular,
      sansMedium,
      sansSemiBold,
      sansBold,
      monoRegular,
    }));
  }
  return cachedFontBytes;
}

function sanitizeForFont(text: string, font: PDFFont): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, "  ");
  const charSet = new Set(font.getCharacterSet());
  let out = "";
  for (const ch of normalized) {
    if (ch === "\n") {
      out += ch;
      continue;
    }
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp < 32) {
      continue;
    }
    if (charSet.has(cp)) {
      out += ch;
    } else if (ch === "—" || ch === "–") {
      out += "-";
    } else if (ch === "·" || ch === "•") {
      out += "-";
    }
  }
  return out;
}

function wrapTextLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const safe = sanitizeForFont(text, font);
  if (!safe.trim()) return [];

  const paragraphs = safe.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trimEnd();
    if (!trimmedParagraph.trim()) {
      if (lines.length > 0 && lines[lines.length - 1] !== "") {
        lines.push("");
      }
      continue;
    }

    const words = trimmedParagraph.split(/\s+/).filter(Boolean);
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);

      if (width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
        if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            const nextChunk = chunk + ch;
            if (font.widthOfTextAtSize(nextChunk, fontSize) > maxWidth && chunk) {
              lines.push(chunk);
              chunk = ch;
            } else {
              chunk = nextChunk;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function truncateToWidth(text: string, font: PDFFont, fontSize: number, maxWidth: number): string {
  const safe = sanitizeForFont(text, font);
  if (font.widthOfTextAtSize(safe, fontSize) <= maxWidth) return safe;
  const ellipsis = sanitizeForFont("...", font);
  const ellipsisWidth = font.widthOfTextAtSize(ellipsis, fontSize);
  let out = "";
  for (const ch of safe) {
    if (font.widthOfTextAtSize(out + ch, fontSize) + ellipsisWidth > maxWidth) {
      break;
    }
    out += ch;
  }
  return `${out}${ellipsis}`;
}

function drawRoundedRect(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    color?: Color;
    borderColor?: Color;
    borderWidth?: number;
  },
) {
  const { x, y, width: w, height: h, color, borderColor, borderWidth = 0 } = options;
  const r = Math.min(options.radius, w / 2, h / 2);
  const svgPath = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;

  page.drawSvgPath(svgPath, {
    x,
    y: y + h,
    color,
    borderColor,
    borderWidth,
  });
}

function addLinkAnnotation(
  page: PDFPage,
  uri: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const context = page.doc.context;
  const linkAnnotation = context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    A: {
      Type: "Action",
      S: "URI",
      URI: PDFString.of(uri),
    },
  });
  const linkRef = context.register(linkAnnotation);
  page.node.addAnnot(linkRef);
}

export async function generatePortfolioPdf(draft: WizardDraft): Promise<Uint8Array> {
  const vm = buildPortfolioViewModel(draft);
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await loadFontBytes();
  const fontOptions = { features: { liga: false, clig: false, calt: false } };
  const [sansRegular, sansMedium, sansSemiBold, sansBold, monoRegular] = await Promise.all([
    pdfDoc.embedFont(fontBytes.sansRegular, fontOptions),
    pdfDoc.embedFont(fontBytes.sansMedium, fontOptions),
    pdfDoc.embedFont(fontBytes.sansSemiBold, fontOptions),
    pdfDoc.embedFont(fontBytes.sansBold, fontOptions),
    pdfDoc.embedFont(fontBytes.monoRegular, fontOptions),
  ]);

  const titleName = vm.fullName || "Developer Profile";
  pdfDoc.setTitle(`${titleName} — /prezent-me`);
  pdfDoc.setCreator("/prezent-me");
  pdfDoc.setProducer("/prezent-me PDF Generator");

  const pages: PDFPage[] = [];
  let currentPage!: PDFPage;
  let cursorY = 0;

  function addNewPage() {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(currentPage);
    cursorY = PAGE_HEIGHT - MARGIN_TOP;
  }

  function ensureSpace(requiredHeight: number): boolean {
    if (cursorY - requiredHeight < MARGIN_BOTTOM) {
      addNewPage();
      return true;
    }
    return false;
  }

  addNewPage();

  // =========================================================================
  // 1. DOCUMENT HEADER (Profile & Contact Links)
  // =========================================================================
  {
    const displayName = truncateToWidth(
      vm.fullName || "Developer Profile",
      sansSemiBold,
      22,
      CONTENT_WIDTH,
    );
    currentPage.drawText(displayName, {
      x: MARGIN_X,
      y: cursorY - 18,
      font: sansSemiBold,
      size: 22,
      color: COLORS.foreground,
    });
    cursorY -= 24;

    if (vm.role) {
      const safeRole = truncateToWidth(vm.role, sansMedium, 11.5, CONTENT_WIDTH);
      currentPage.drawText(safeRole, {
        x: MARGIN_X,
        y: cursorY - 11,
        font: sansMedium,
        size: 11.5,
        color: COLORS.mutedForeground,
      });
      cursorY -= 17;
    }

    const hasMetaRow = Boolean(vm.location || vm.email || vm.phone || vm.github || vm.linkedin);
    if (hasMetaRow) {
      cursorY -= 4;
      let pillX = MARGIN_X;
      const pillHeight = 18;
      let pillY = cursorY - pillHeight;

      const metaFontSize = 8.5;
      const metaPills: {
        label: string;
        bg: Color;
        textColor: Color;
        href?: string;
      }[] = [];

      if (vm.location) {
        metaPills.push({
          label: truncateToWidth(vm.location, sansRegular, metaFontSize, 220),
          bg: COLORS.chipBg,
          textColor: COLORS.secondaryForeground,
        });
      }

      if (vm.email) {
        metaPills.push({
          label: truncateToWidth(vm.email, sansRegular, metaFontSize, 210),
          bg: COLORS.chipBg,
          textColor: COLORS.secondaryForeground,
          href: `mailto:${vm.email}`,
        });
      }

      if (vm.phone) {
        const telDigits = vm.phone.replace(/\D/g, "");
        metaPills.push({
          label: truncateToWidth(vm.phone, sansRegular, metaFontSize, 180),
          bg: COLORS.chipBg,
          textColor: COLORS.secondaryForeground,
          href: telDigits ? `tel:${vm.phone.startsWith("+") ? "+" : ""}${telDigits}` : undefined,
        });
      }

      for (const linkItem of [vm.github, vm.linkedin]) {
        if (!linkItem) continue;
        metaPills.push({
          label: truncateToWidth(linkItem.display, sansRegular, metaFontSize, 210),
          bg: COLORS.muted,
          textColor: COLORS.foreground,
          href: linkItem.href,
        });
      }

      for (const pill of metaPills) {
        const textW = sansRegular.widthOfTextAtSize(pill.label, metaFontSize);
        const pillW = textW + 14;

        if (pillX + pillW > PAGE_WIDTH - MARGIN_X && pillX > MARGIN_X) {
          pillX = MARGIN_X;
          pillY -= pillHeight + 5;
        }

        drawRoundedRect(currentPage, {
          x: pillX,
          y: pillY,
          width: pillW,
          height: pillHeight,
          radius: 5,
          color: pill.bg,
          borderColor: COLORS.border,
          borderWidth: 0.6,
        });
        currentPage.drawText(pill.label, {
          x: pillX + 7,
          y: pillY + 5.5,
          font: sansRegular,
          size: metaFontSize,
          color: pill.textColor,
        });
        if (pill.href) {
          addLinkAnnotation(currentPage, pill.href, pillX, pillY, pillW, pillHeight);
        }
        pillX += pillW + 6;
      }

      cursorY = pillY - 4;
    }

    cursorY -= 12;
    currentPage.drawLine({
      start: { x: MARGIN_X, y: cursorY },
      end: { x: PAGE_WIDTH - MARGIN_X, y: cursorY },
      thickness: 0.8,
      color: COLORS.border,
    });
    cursorY -= 20;
  }

  // =========================================================================
  // SECTION HEADER HELPER
  // =========================================================================
  function drawSectionHeader(title: string, badgeText?: string | null, minFollowingSpace = 48) {
    ensureSpace(28 + minFollowingSpace);

    const headerBaselineY = cursorY - 11;
    const safeTitle = sanitizeForFont(title, sansSemiBold);
    currentPage.drawText(safeTitle, {
      x: MARGIN_X,
      y: headerBaselineY,
      font: sansSemiBold,
      size: 11,
      color: COLORS.foreground,
    });

    const titleWidth = sansSemiBold.widthOfTextAtSize(safeTitle, 11);

    if (badgeText) {
      const safeBadge = sanitizeForFont(badgeText, monoRegular);
      const badgeTextW = monoRegular.widthOfTextAtSize(safeBadge, 7.8);
      const badgeW = badgeTextW + 10;
      const badgeH = 14;
      const badgeX = MARGIN_X + titleWidth + 7;
      const badgeY = headerBaselineY - 2.5;

      drawRoundedRect(currentPage, {
        x: badgeX,
        y: badgeY,
        width: badgeW,
        height: badgeH,
        radius: 4,
        color: COLORS.muted,
      });
      currentPage.drawText(safeBadge, {
        x: badgeX + 5,
        y: badgeY + 4,
        font: monoRegular,
        size: 7.8,
        color: COLORS.mutedForeground,
      });
    }

    cursorY -= 18;
    currentPage.drawLine({
      start: { x: MARGIN_X, y: cursorY },
      end: { x: PAGE_WIDTH - MARGIN_X, y: cursorY },
      thickness: 0.6,
      color: COLORS.border,
    });
    cursorY -= 12;
  }

  // =========================================================================
  // 2. EXPERIENCE & TECHNOLOGIES SECTION
  // =========================================================================
  if (vm.experiences.length > 0) {
    drawSectionHeader("Experience", vm.totalExperienceDuration, 54);

    for (let i = 0; i < vm.experiences.length; i++) {
      const exp = vm.experiences[i];
      const descLines = exp.description
        ? wrapTextLines(exp.description, sansRegular, 9, CONTENT_WIDTH)
        : [];
      const estimatedItemHeight = 16 + (descLines.length > 0 ? descLines.length * 13 + 4 : 0) + 12;

      ensureSpace(Math.min(estimatedItemHeight, 90));

      const dateStr = exp.dates ? `${exp.dates}${exp.duration ? ` · ${exp.duration}` : ""}` : "";
      const safeDateStr = dateStr ? sanitizeForFont(dateStr, monoRegular) : "";
      const dateWidth = safeDateStr ? monoRegular.widthOfTextAtSize(safeDateStr, 8.2) : 0;

      const maxLeftWidth = CONTENT_WIDTH - (dateWidth > 0 ? dateWidth + 14 : 0);
      const roleTitle = sanitizeForFont(exp.role || "Untitled role", sansSemiBold);
      const roleWidth = sansSemiBold.widthOfTextAtSize(roleTitle, 9.8);

      const baselineY = cursorY - 9.5;
      currentPage.drawText(truncateToWidth(roleTitle, sansSemiBold, 9.8, maxLeftWidth), {
        x: MARGIN_X,
        y: baselineY,
        font: sansSemiBold,
        size: 9.8,
        color: COLORS.foreground,
      });

      if (exp.company && roleWidth + 16 < maxLeftWidth) {
        const companyText = sanitizeForFont(` · ${exp.company}`, sansRegular);
        const remainingWidth = maxLeftWidth - roleWidth;
        currentPage.drawText(truncateToWidth(companyText, sansRegular, 9.5, remainingWidth), {
          x: MARGIN_X + roleWidth,
          y: baselineY,
          font: sansRegular,
          size: 9.5,
          color: COLORS.mutedForeground,
        });
      }

      if (safeDateStr) {
        currentPage.drawText(safeDateStr, {
          x: PAGE_WIDTH - MARGIN_X - dateWidth,
          y: baselineY + 0.5,
          font: monoRegular,
          size: 8.2,
          color: COLORS.mutedForeground,
        });
      }

      cursorY -= 15;

      if (descLines.length > 0) {
        cursorY -= 2;
        for (const line of descLines) {
          if (!line) {
            cursorY -= 6;
            continue;
          }
          ensureSpace(15);
          currentPage.drawText(line, {
            x: MARGIN_X,
            y: cursorY - 8.5,
            font: sansRegular,
            size: 9,
            color: COLORS.body,
          });
          cursorY -= 13;
        }
      }

      const hasMore = i < vm.experiences.length - 1 || vm.technologyTotals.length > 0;
      if (hasMore) {
        cursorY -= 6;
        currentPage.drawLine({
          start: { x: MARGIN_X, y: cursorY },
          end: { x: PAGE_WIDTH - MARGIN_X, y: cursorY },
          thickness: 0.5,
          color: COLORS.divider,
        });
        cursorY -= 10;
      } else {
        cursorY -= 6;
      }
    }

    if (vm.technologyTotals.length > 0) {
      ensureSpace(44);
      currentPage.drawText("Technologies", {
        x: MARGIN_X,
        y: cursorY - 8.5,
        font: sansMedium,
        size: 8.5,
        color: COLORS.mutedForeground,
      });
      cursorY -= 14;

      const chipH = 17;
      const gapX = 5;
      const gapY = 5;
      let chipX = MARGIN_X;

      ensureSpace(chipH + 4);

      for (const tech of vm.technologyTotals) {
        const safeLabel = sanitizeForFont(tech.label, sansMedium);
        const safeDur = tech.duration ? sanitizeForFont(tech.duration, monoRegular) : "";
        const labelW = sansMedium.widthOfTextAtSize(safeLabel, 8.2);
        const durW = safeDur ? monoRegular.widthOfTextAtSize(safeDur, 7.6) : 0;
        const chipW = labelW + (durW > 0 ? durW + 6 : 0) + 12;

        if (chipX + chipW > PAGE_WIDTH - MARGIN_X && chipX > MARGIN_X) {
          chipX = MARGIN_X;
          cursorY -= chipH + gapY;
          ensureSpace(chipH + 4);
        }

        const chipY = cursorY - chipH;
        drawRoundedRect(currentPage, {
          x: chipX,
          y: chipY,
          width: chipW,
          height: chipH,
          radius: 4.5,
          color: COLORS.chipBg,
          borderColor: COLORS.border,
          borderWidth: 0.6,
        });

        currentPage.drawText(safeLabel, {
          x: chipX + 6,
          y: chipY + 5,
          font: sansMedium,
          size: 8.2,
          color: COLORS.foreground,
        });

        if (safeDur) {
          currentPage.drawText(safeDur, {
            x: chipX + 6 + labelW + 5,
            y: chipY + 5,
            font: monoRegular,
            size: 7.6,
            color: COLORS.mutedForeground,
          });
        }

        chipX += chipW + gapX;
      }

      cursorY -= chipH + 6;
    }

    cursorY -= 14;
  }

  // =========================================================================
  // 3. PROJECTS SECTION
  // =========================================================================
  if (vm.projects.length > 0) {
    drawSectionHeader("Projects", null, 48);

    for (let i = 0; i < vm.projects.length; i++) {
      const proj = vm.projects[i];
      const descLines = proj.description
        ? wrapTextLines(proj.description, sansRegular, 9, CONTENT_WIDTH)
        : [];
      const estimatedHeight = 16 + (descLines.length > 0 ? descLines.length * 13 + 4 : 0) + 10;

      ensureSpace(Math.min(estimatedHeight, 80));

      const safeLink = proj.linkDisplay
        ? truncateToWidth(proj.linkDisplay, monoRegular, 8.2, 230)
        : "";
      const linkW = safeLink ? monoRegular.widthOfTextAtSize(safeLink, 8.2) : 0;
      const maxTitleW = CONTENT_WIDTH - (linkW > 0 ? linkW + 14 : 0);

      const safeTitle = truncateToWidth(
        proj.name || "Untitled project",
        sansSemiBold,
        9.8,
        maxTitleW,
      );
      const baselineY = cursorY - 9.5;

      currentPage.drawText(safeTitle, {
        x: MARGIN_X,
        y: baselineY,
        font: sansSemiBold,
        size: 9.8,
        color: COLORS.foreground,
      });

      if (safeLink) {
        const linkX = PAGE_WIDTH - MARGIN_X - linkW;
        currentPage.drawText(safeLink, {
          x: linkX,
          y: baselineY + 0.5,
          font: monoRegular,
          size: 8.2,
          color: COLORS.mutedForeground,
        });
        if (proj.linkHref) {
          addLinkAnnotation(currentPage, proj.linkHref, linkX, baselineY - 2, linkW, 12);
        }
      }

      cursorY -= 15;

      if (descLines.length > 0) {
        cursorY -= 2;
        for (const line of descLines) {
          if (!line) {
            cursorY -= 6;
            continue;
          }
          ensureSpace(15);
          currentPage.drawText(line, {
            x: MARGIN_X,
            y: cursorY - 8.5,
            font: sansRegular,
            size: 9,
            color: COLORS.body,
          });
          cursorY -= 13;
        }
      }

      if (i < vm.projects.length - 1) {
        cursorY -= 6;
        currentPage.drawLine({
          start: { x: MARGIN_X, y: cursorY },
          end: { x: PAGE_WIDTH - MARGIN_X, y: cursorY },
          thickness: 0.5,
          color: COLORS.divider,
        });
        cursorY -= 10;
      } else {
        cursorY -= 6;
      }
    }

    cursorY -= 14;
  }

  // =========================================================================
  // 4. EDUCATION SECTION
  // =========================================================================
  if (vm.education.length > 0) {
    drawSectionHeader("Education", vm.totalEducationDuration, 48);

    for (let i = 0; i < vm.education.length; i++) {
      const edu = vm.education[i];
      ensureSpace(42);

      const dateStr = edu.dates ? `${edu.dates}${edu.duration ? ` · ${edu.duration}` : ""}` : "";
      const safeDateStr = dateStr ? sanitizeForFont(dateStr, monoRegular) : "";
      const dateWidth = safeDateStr ? monoRegular.widthOfTextAtSize(safeDateStr, 8.2) : 0;

      const maxDegreeW = CONTENT_WIDTH - (dateWidth > 0 ? dateWidth + 14 : 0);
      const safeDegree = truncateToWidth(
        edu.degree || "Untitled degree",
        sansSemiBold,
        9.8,
        maxDegreeW,
      );

      const baselineY = cursorY - 9.5;
      currentPage.drawText(safeDegree, {
        x: MARGIN_X,
        y: baselineY,
        font: sansSemiBold,
        size: 9.8,
        color: COLORS.foreground,
      });

      if (safeDateStr) {
        currentPage.drawText(safeDateStr, {
          x: PAGE_WIDTH - MARGIN_X - dateWidth,
          y: baselineY + 0.5,
          font: monoRegular,
          size: 8.2,
          color: COLORS.mutedForeground,
        });
      }

      cursorY -= 15;

      if (edu.university || edu.levelLabel) {
        let subX = MARGIN_X;
        const subBaselineY = cursorY - 9;

        if (edu.university) {
          const safeUni = truncateToWidth(edu.university, sansRegular, 8.8, CONTENT_WIDTH - 90);
          currentPage.drawText(safeUni, {
            x: subX,
            y: subBaselineY,
            font: sansRegular,
            size: 8.8,
            color: COLORS.mutedForeground,
          });
          subX += sansRegular.widthOfTextAtSize(safeUni, 8.8) + 7;
        }

        if (edu.levelLabel) {
          const safeLevel = sanitizeForFont(edu.levelLabel, sansMedium);
          const levelW = sansMedium.widthOfTextAtSize(safeLevel, 7.6);
          const pillW = levelW + 10;
          const pillH = 13.5;
          const pillY = subBaselineY - 2.8;

          drawRoundedRect(currentPage, {
            x: subX,
            y: pillY,
            width: pillW,
            height: pillH,
            radius: 3.5,
            color: COLORS.muted,
          });
          currentPage.drawText(safeLevel, {
            x: subX + 5,
            y: pillY + 3.8,
            font: sansMedium,
            size: 7.6,
            color: COLORS.secondaryForeground,
          });
        }

        cursorY -= 15;
      }

      if (i < vm.education.length - 1) {
        cursorY -= 5;
        currentPage.drawLine({
          start: { x: MARGIN_X, y: cursorY },
          end: { x: PAGE_WIDTH - MARGIN_X, y: cursorY },
          thickness: 0.5,
          color: COLORS.divider,
        });
        cursorY -= 10;
      } else {
        cursorY -= 5;
      }
    }

    cursorY -= 14;
  }

  // =========================================================================
  // 5. LANGUAGES SECTION
  // =========================================================================
  if (vm.languages.length > 0) {
    drawSectionHeader("Languages", null, 38);

    const chipH = 20;
    const gapX = 6;
    const gapY = 6;
    let chipX = MARGIN_X;

    ensureSpace(chipH + 4);

    for (const lang of vm.languages) {
      const safeLang = sanitizeForFont(lang.language, sansMedium);
      const safeFluency = lang.fluencyLabel ? sanitizeForFont(lang.fluencyLabel, sansRegular) : "";

      const langW = sansMedium.widthOfTextAtSize(safeLang, 8.8);
      const fluencyW = safeFluency ? sansRegular.widthOfTextAtSize(safeFluency, 8) : 0;
      const chipW = langW + (fluencyW > 0 ? fluencyW + 7 : 0) + 16;

      if (chipX + chipW > PAGE_WIDTH - MARGIN_X && chipX > MARGIN_X) {
        chipX = MARGIN_X;
        cursorY -= chipH + gapY;
        ensureSpace(chipH + 4);
      }

      const chipY = cursorY - chipH;
      drawRoundedRect(currentPage, {
        x: chipX,
        y: chipY,
        width: chipW,
        height: chipH,
        radius: 5,
        color: COLORS.chipBg,
        borderColor: COLORS.border,
        borderWidth: 0.6,
      });

      currentPage.drawText(safeLang, {
        x: chipX + 8,
        y: chipY + 6,
        font: sansMedium,
        size: 8.8,
        color: COLORS.foreground,
      });

      if (safeFluency) {
        currentPage.drawText(safeFluency, {
          x: chipX + 8 + langW + 7,
          y: chipY + 6,
          font: sansRegular,
          size: 8,
          color: COLORS.mutedForeground,
        });
      }

      chipX += chipW + gapX;
    }

    cursorY -= chipH + 20;
  }

  // =========================================================================
  // 6. SETUP SECTION (2-column PDF grid of setup items)
  // =========================================================================
  if (vm.setups.length > 0) {
    drawSectionHeader("Setup", null, 48);

    const colGap = 10;
    const colWidth = (CONTENT_WIDTH - colGap) / 2;

    for (let i = 0; i < vm.setups.length; i += 2) {
      const leftItem = vm.setups[i];
      const rightItem = vm.setups[i + 1];
      const isSingleFullRow = !rightItem && vm.setups.length === 1;
      const boxWidth = isSingleFullRow ? CONTENT_WIDTH : colWidth;
      const innerTextWidth = boxWidth - 18;

      const leftLines = leftItem.description
        ? wrapTextLines(leftItem.description, sansRegular, 8.5, innerTextWidth)
        : [];
      const rightLines =
        rightItem && rightItem.description
          ? wrapTextLines(rightItem.description, sansRegular, 8.5, innerTextWidth)
          : [];

      const maxLines = Math.max(leftLines.length, rightLines.length);
      const cardHeight = 24 + (maxLines > 0 ? maxLines * 12 + 4 : 0);

      ensureSpace(cardHeight + 6);
      const cardBottomY = cursorY - cardHeight;

      const itemsInRow = rightItem ? [leftItem, rightItem] : [leftItem];
      const linesInRow = [leftLines, rightLines];

      itemsInRow.forEach((item, colIdx) => {
        const cardX = MARGIN_X + colIdx * (colWidth + colGap);
        drawRoundedRect(currentPage, {
          x: cardX,
          y: cardBottomY,
          width: boxWidth,
          height: cardHeight,
          radius: 5.5,
          color: COLORS.chipBg,
          borderColor: COLORS.border,
          borderWidth: 0.6,
        });

        const safeName = truncateToWidth(
          item.name || "Untitled item",
          sansMedium,
          9.2,
          innerTextWidth,
        );
        currentPage.drawText(safeName, {
          x: cardX + 9,
          y: cursorY - 15,
          font: sansMedium,
          size: 9.2,
          color: COLORS.foreground,
        });

        let lineY = cursorY - 29;
        for (const line of linesInRow[colIdx]) {
          if (!line) {
            lineY -= 5;
            continue;
          }
          currentPage.drawText(line, {
            x: cardX + 9,
            y: lineY,
            font: sansRegular,
            size: 8.5,
            color: COLORS.body,
          });
          lineY -= 12;
        }
      });

      cursorY = cardBottomY - 8;
    }
  }

  const hasAnySection =
    vm.experiences.length > 0 ||
    vm.projects.length > 0 ||
    vm.education.length > 0 ||
    vm.languages.length > 0 ||
    vm.setups.length > 0;

  if (!hasAnySection) {
    currentPage.drawText("No portfolio sections added yet.", {
      x: MARGIN_X,
      y: cursorY - 12,
      font: sansRegular,
      size: 9.5,
      color: COLORS.mutedForeground,
    });
  }

  // =========================================================================
  // 7. PROJECT MARK WATERMARK ON ALL PAGES
  // =========================================================================
  pages.forEach((page) => {
    const footerBaselineY = 24;
    const brandPrefix = "/prezent-";
    const brandSuffix = "me";
    const prefixW = sansBold.widthOfTextAtSize(brandPrefix, 8);

    page.drawText(brandPrefix, {
      x: MARGIN_X,
      y: footerBaselineY,
      font: sansBold,
      size: 8,
      color: COLORS.foreground,
      opacity: 0.38,
    });
    page.drawText(brandSuffix, {
      x: MARGIN_X + prefixW,
      y: footerBaselineY,
      font: sansBold,
      size: 8,
      color: COLORS.mutedForeground,
      opacity: 0.38,
    });
  });

  return pdfDoc.save();
}
