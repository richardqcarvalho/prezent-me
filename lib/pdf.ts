import fs from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  LineCapStyle,
  PDFDocument,
  PDFString,
  rgb,
  type Color,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import type { WizardDraft } from "@/components/wizard/draft";
import { buildPortfolioViewModel } from "@/lib/portfolio";

const PAGE_WIDTH = 595.28; // A4 width in pt
const PAGE_HEIGHT = 841.89; // A4 height in pt
const MARGIN_X = 40;
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 48;
const FOOTER_LINE_Y = 34;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const MAX_PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

const BAND_PAD_Y = 20;
const CARD_RADIUS = 8.5;
const CARD_PAD_X = 14;
const CARD_PAD_Y = 12;

const COLORS = {
  background: rgb(1, 1, 1), // #FFFFFF
  surfaceMuted: rgb(0.982, 0.982, 0.982), // #FAFAFA
  foreground: rgb(0.06, 0.06, 0.06), // #0F0F0F
  primary: rgb(0.09, 0.09, 0.09), // #171717
  primaryForeground: rgb(0.985, 0.985, 0.985), // #FBFBFB
  secondary: rgb(0.957, 0.957, 0.957), // #F4F4F4
  secondaryForeground: rgb(0.14, 0.14, 0.14), // #242424
  muted: rgb(0.957, 0.957, 0.957), // #F4F4F4
  mutedForeground: rgb(0.451, 0.451, 0.451), // #737373
  pillBg: rgb(0.984, 0.984, 0.984), // #FBFBFB
  cardFooterBg: rgb(0.978, 0.978, 0.978), // #F9F9F9
  border: rgb(0.898, 0.898, 0.898), // #E5E5E5
  borderGrid: rgb(0.925, 0.925, 0.925), // #ECECEC
  ringCard: rgb(0.895, 0.895, 0.895), // #E4E4E4
};

type IconDef = {
  mode: "fill" | "stroke";
  paths: string[];
};

const ICONS: Record<
  | "github"
  | "linkedin"
  | "mail"
  | "phone"
  | "mapPin"
  | "briefcase"
  | "code"
  | "graduation"
  | "languages"
  | "laptop",
  IconDef
> = {
  github: {
    mode: "fill",
    paths: [
      "M 12 .5 C 5.37 .5 0 5.87 0 12.5 c 0 5.3 3.438 9.8 8.205 11.387 .6 .113 .82 -.258 .82 -.577 0 -.285 -.01 -1.04 -.015 -2.04 -3.338 .724 -4.042 -1.61 -4.042 -1.61 -.546 -1.387 -1.333 -1.756 -1.333 -1.756 -1.09 -.744 .083 -.729 .083 -.729 1.205 .085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495 .998 .108 -.776 .418 -1.305 .762 -1.605 -2.665 -.305 -5.467 -1.334 -5.467 -5.93 0 -1.31 .468 -2.382 1.236 -3.222 -.124 -.303 -.535 -1.524 .117 -3.176 0 0 1.008 -.322 3.301 1.23 A 11.5 11.5 0 0 1 12 6.3 c 1.02 .005 2.047 .138 3.006 .404 2.291 -1.552 3.297 -1.23 3.297 -1.23 .653 1.653 .242 2.874 .118 3.176 .77 .84 1.235 1.912 1.235 3.222 0 4.609 -2.807 5.622 -5.479 5.921 .43 .372 .823 1.102 .823 2.222 0 1.606 -.014 2.9 -.014 3.293 0 .322 .216 .696 .825 .578 C 20.565 22.295 24 17.8 24 12.5 24 5.87 18.627 .5 12 .5 Z",
    ],
  },
  linkedin: {
    mode: "stroke",
    paths: [
      "M 16 8 a 6 6 0 0 1 6 6 v 7 h -4 v -7 a 2 2 0 0 0 -2 -2 a 2 2 0 0 0 -2 2 v 7 h -4 v -7 a 6 6 0 0 1 6 -6 z",
      "M 2 9 H 6 V 21 H 2 Z",
      "M 2 4 A 2 2 0 1 0 6 4 A 2 2 0 1 0 2 4 Z",
    ],
  },
  mail: {
    mode: "stroke",
    paths: [
      "M 4 4 H 20 Q 22 4 22 6 V 18 Q 22 20 20 20 H 4 Q 2 20 2 18 V 6 Q 2 4 4 4 Z",
      "M 22 7 l -8.97 5.7 a 1.94 1.94 0 0 1 -2.06 0 L 2 7",
    ],
  },
  phone: {
    mode: "stroke",
    paths: [
      "M 22 16.92 v 3 a 2 2 0 0 1 -2.18 2 a 19.79 19.79 0 0 1 -8.63 -3.07 a 19.5 19.5 0 0 1 -6 -6 a 19.79 19.79 0 0 1 -3.07 -8.67 A 2 2 0 0 1 4.11 2 h 3 a 2 2 0 0 1 2 1.72 a 12.84 12.84 0 0 0 .7 2.81 a 2 2 0 0 1 -.45 2.11 L 8.09 9.91 a 16 16 0 0 0 6 6 l 1.27 -1.27 a 2 2 0 0 1 2.11 -.45 a 12.84 12.84 0 0 0 2.81 .7 A 2 2 0 0 1 22 16.92 z",
    ],
  },
  mapPin: {
    mode: "stroke",
    paths: [
      "M 20 10 c 0 4.993 -5.539 10.193 -7.399 11.799 a 1 1 0 0 1 -1.202 0 C 9.539 20.193 4 14.993 4 10 a 8 8 0 0 1 16 0",
      "M 9 10 A 3 3 0 1 0 15 10 A 3 3 0 1 0 9 10 Z",
    ],
  },
  briefcase: {
    mode: "stroke",
    paths: [
      "M 16 20 V 4 a 2 2 0 0 0 -2 -2 h -4 a 2 2 0 0 0 -2 2 v 16",
      "M 4 6 H 20 Q 22 6 22 8 V 18 Q 22 20 20 20 H 4 Q 2 20 2 18 V 8 Q 2 6 4 6 Z",
    ],
  },
  code: {
    mode: "stroke",
    paths: ["M 18 16 l 4 -4 l -4 -4", "M 6 8 l -4 4 l 4 4", "M 14.5 4 l -5 16"],
  },
  graduation: {
    mode: "stroke",
    paths: [
      "M 21.42 10.922 a 1 1 0 0 0 -.019 -1.838 L 12.83 5.18 a 2 2 0 0 0 -1.66 0 L 2.6 9.08 a 1 1 0 0 0 0 1.832 l 8.57 3.908 a 2 2 0 0 0 1.66 0 z",
      "M 22 10 v 6",
      "M 6 12.5 V 16 a 6 3 0 0 0 12 0 v -3.5",
    ],
  },
  languages: {
    mode: "stroke",
    paths: [
      "M 5 8 l 6 6",
      "M 4 14 l 6 -6 l 2 -3",
      "M 2 5 h 12",
      "M 7 2 h 1",
      "M 22 22 l -5 -10 l -5 10",
      "M 14 18 h 6",
    ],
  },
  laptop: {
    mode: "stroke",
    paths: [
      "M 20 16 V 7 a 2 2 0 0 0 -2 -2 H 6 a 2 2 0 0 0 -2 2 v 9",
      "M 20 16 H 4",
      "M 20 16 l 1.28 2.55 a 1 1 0 0 1 -.9 1.45 H 3.62 a 1 1 0 0 1 -.9 -1.45 L 4 16",
    ],
  },
};

type IconName = keyof typeof ICONS;

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

function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
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

function measureLinesHeight(lines: string[], lineHeight: number, blankLineHeight = 5): number {
  let total = 0;
  for (const line of lines) {
    total += line ? lineHeight : blankLineHeight;
  }
  return total;
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

function drawBottomRoundedRect(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    color: Color;
  },
) {
  const { x, y, width: w, height: h, color } = options;
  const r = Math.min(options.radius, w / 2, h / 2);
  const svgPath = `M 0 0 H ${w} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} Z`;

  page.drawSvgPath(svgPath, {
    x,
    y: y + h,
    color,
  });
}

function drawIcon(
  page: PDFPage,
  name: IconName,
  options: {
    x: number;
    y: number; // bottom edge of icon box
    size: number;
    color: Color;
    strokeWidth?: number;
  },
) {
  const icon = ICONS[name];
  const scale = options.size / 24;
  const topY = options.y + options.size;

  for (const d of icon.paths) {
    if (icon.mode === "fill") {
      page.drawSvgPath(d, {
        x: options.x,
        y: topY,
        scale,
        color: options.color,
      });
    } else {
      page.drawSvgPath(d, {
        x: options.x,
        y: topY,
        scale,
        borderColor: options.color,
        borderWidth: options.strokeWidth ?? 2,
        borderLineCap: LineCapStyle.Round,
      });
    }
  }
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

type PillRow<T> = {
  items: T[];
  totalWidth: number;
};

function groupIntoRows<T extends { width: number }>(
  items: T[],
  maxWidth: number,
  gapX: number,
): PillRow<T>[] {
  const rows: PillRow<T>[] = [];
  let current: T[] = [];
  let width = 0;

  for (const item of items) {
    const nextWidth = current.length === 0 ? item.width : width + gapX + item.width;
    if (current.length > 0 && nextWidth > maxWidth) {
      rows.push({ items: current, totalWidth: width });
      current = [item];
      width = item.width;
    } else {
      current.push(item);
      width = nextWidth;
    }
  }

  if (current.length > 0) {
    rows.push({ items: current, totalWidth: width });
  }

  return rows;
}

export async function generatePortfolioPdf(draft: WizardDraft): Promise<Uint8Array> {
  const vm = buildPortfolioViewModel(draft);
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await loadFontBytes();
  const fontOptions = { features: { liga: false, clig: false, calt: false } };
  const [sansRegular, sansMedium, sansSemiBold, monoRegular] = await Promise.all([
    pdfDoc.embedFont(fontBytes.sansRegular, fontOptions),
    pdfDoc.embedFont(fontBytes.sansMedium, fontOptions),
    pdfDoc.embedFont(fontBytes.sansSemiBold, fontOptions),
    pdfDoc.embedFont(fontBytes.monoRegular, fontOptions),
  ]);

  const titleName = vm.fullName || "Developer Portfolio";
  pdfDoc.setTitle(`${titleName} — /prezent-me`);
  pdfDoc.setCreator("/prezent-me");
  pdfDoc.setProducer("/prezent-me PDF Generator");

  const pages: PDFPage[] = [];
  let currentPage!: PDFPage;
  let cursorY = 0;
  let currentBandMuted = false;

  function addNewPage() {
    if (pages.length > 0 && currentBandMuted && cursorY > FOOTER_LINE_Y) {
      fillBandSlice(cursorY, FOOTER_LINE_Y);
    }
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(currentPage);
    cursorY = PAGE_HEIGHT - MARGIN_TOP;
    if (currentBandMuted) {
      fillBandSlice(PAGE_HEIGHT, cursorY);
    }
  }

  function fillBandSlice(yTop: number, yBottom: number) {
    if (!currentBandMuted || yTop <= yBottom) return;
    currentPage.drawRectangle({
      x: 0,
      y: yBottom,
      width: PAGE_WIDTH,
      height: yTop - yBottom,
      color: COLORS.surfaceMuted,
    });
  }

  function advanceCursor(delta: number) {
    if (delta <= 0) return;
    const nextY = cursorY - delta;
    fillBandSlice(cursorY, nextY);
    cursorY = nextY;
  }

  function ensureSpace(requiredHeight: number): boolean {
    if (cursorY - requiredHeight < MARGIN_BOTTOM) {
      addNewPage();
      return true;
    }
    return false;
  }

  function drawBandDivider() {
    currentPage.drawLine({
      start: { x: 0, y: cursorY },
      end: { x: PAGE_WIDTH, y: cursorY },
      thickness: 0.75,
      color: COLORS.borderGrid,
    });
  }

  function drawIconBox(x: number, bottomY: number, icon: IconName) {
    const boxSize = 20;
    const iconSize = 10.5;
    drawRoundedRect(currentPage, {
      x,
      y: bottomY,
      width: boxSize,
      height: boxSize,
      radius: 5,
      color: COLORS.muted,
    });
    drawIcon(currentPage, icon, {
      x: x + (boxSize - iconSize) / 2,
      y: bottomY + (boxSize - iconSize) / 2,
      size: iconSize,
      color: COLORS.foreground,
      strokeWidth: 2,
    });
  }

  function measureMonoBadge(text: string): { label: string; width: number; height: number } {
    const label = sanitizeForFont(text, monoRegular);
    const textW = monoRegular.widthOfTextAtSize(label, 7.6);
    return { label, width: textW + 10, height: 15 };
  }

  function drawMonoBadge(
    x: number,
    bottomY: number,
    badge: { label: string; width: number; height: number },
  ) {
    drawRoundedRect(currentPage, {
      x,
      y: bottomY,
      width: badge.width,
      height: badge.height,
      radius: 4,
      color: COLORS.muted,
    });
    currentPage.drawText(badge.label, {
      x: x + 5,
      y: bottomY + 4.7,
      font: monoRegular,
      size: 7.6,
      color: COLORS.mutedForeground,
    });
  }

  function drawSectionHeader(options: {
    title: string;
    subtitle: string;
    icon?: IconName;
    badgeText?: string | null;
  }) {
    const subtitleLines = wrapTextLines(options.subtitle, sansRegular, 8.8, CONTENT_WIDTH);
    const titleRowH = options.icon ? 20 : 18;
    const subtitleH = subtitleLines.length > 0 ? 4 + measureLinesHeight(subtitleLines, 12.5) : 0;
    const totalH = titleRowH + subtitleH + 14;

    fillBandSlice(cursorY, cursorY - totalH);

    let titleX = MARGIN_X;
    const titleRowBottomY = cursorY - titleRowH;

    if (options.icon) {
      drawIconBox(titleX, titleRowBottomY, options.icon);
      titleX += 20 + 7;
    }

    const safeTitle = sanitizeForFont(options.title, sansSemiBold);
    const titleSize = 14;
    const titleBaselineY = titleRowBottomY + (options.icon ? 5 : 3);
    currentPage.drawText(safeTitle, {
      x: titleX,
      y: titleBaselineY,
      font: sansSemiBold,
      size: titleSize,
      color: COLORS.foreground,
    });

    if (options.badgeText) {
      const titleW = sansSemiBold.widthOfTextAtSize(safeTitle, titleSize);
      const badge = measureMonoBadge(options.badgeText);
      drawMonoBadge(titleX + titleW + 7, titleRowBottomY + (titleRowH - badge.height) / 2, badge);
    }

    cursorY = titleRowBottomY;

    if (subtitleLines.length > 0) {
      cursorY -= 4;
      for (const line of subtitleLines) {
        if (!line) {
          cursorY -= 5;
          continue;
        }
        currentPage.drawText(line, {
          x: MARGIN_X,
          y: cursorY - 9,
          font: sansRegular,
          size: 8.8,
          color: COLORS.mutedForeground,
        });
        cursorY -= 12.5;
      }
    }

    cursorY -= 14;
  }

  function drawTextBlock(
    lines: string[],
    options: {
      x: number;
      startY: number;
      font: PDFFont;
      size: number;
      lineHeight: number;
      color: Color;
      blankLineHeight?: number;
    },
  ): number {
    let y = options.startY;
    for (const line of lines) {
      if (!line) {
        y -= options.blankLineHeight ?? 5;
        continue;
      }
      currentPage.drawText(line, {
        x: options.x,
        y: y - options.size,
        font: options.font,
        size: options.size,
        color: options.color,
      });
      y -= options.lineHeight;
    }
    return y;
  }

  // =========================================================================
  // 1. HERO SECTION (Centered, with Contact section buttons inline)
  // =========================================================================
  function renderHeroBand(hasFollowingBands: boolean) {
    currentBandMuted = false;

    const displayName = vm.fullName || "Developer Portfolio";
    const nameLines = wrapTextLines(displayName, sansSemiBold, 25, CONTENT_WIDTH);
    const roleLines = vm.role ? wrapTextLines(vm.role, sansRegular, 11.2, 430) : [];

    // Build contact action pills matching HTML's Contact section
    const githubHref = safeHttpUrl(vm.github?.href);
    const linkedinHref = safeHttpUrl(vm.linkedin?.href);

    type ContactPill = {
      label: string;
      icon: IconName;
      primary: boolean;
      href?: string;
      width: number;
    };

    const contactPills: ContactPill[] = [];
    const pillFontSize = 8.6;
    const pillIconSize = 9.5;
    const pillPadX = 11;
    const pillIconGap = 5;
    const pillH = 24;

    if (vm.email) {
      const label = truncateToWidth(vm.email, sansMedium, pillFontSize, 220);
      const textW = sansMedium.widthOfTextAtSize(label, pillFontSize);
      contactPills.push({
        label,
        icon: "mail",
        primary: true,
        href: `mailto:${vm.email}`,
        width: pillPadX * 2 + pillIconSize + pillIconGap + textW,
      });
    }

    if (vm.phone) {
      const label = truncateToWidth(vm.phone, sansMedium, pillFontSize, 170);
      const textW = sansMedium.widthOfTextAtSize(label, pillFontSize);
      const telDigits = vm.phone.replace(/\D/g, "");
      contactPills.push({
        label,
        icon: "phone",
        primary: false,
        href: telDigits ? `tel:${vm.phone.startsWith("+") ? "+" : ""}${telDigits}` : undefined,
        width: pillPadX * 2 + pillIconSize + pillIconGap + textW,
      });
    }

    if (githubHref) {
      const label = "GitHub";
      const textW = sansMedium.widthOfTextAtSize(label, pillFontSize);
      contactPills.push({
        label,
        icon: "github",
        primary: false,
        href: githubHref,
        width: pillPadX * 2 + pillIconSize + pillIconGap + textW,
      });
    }

    if (linkedinHref) {
      const label = "LinkedIn";
      const textW = sansMedium.widthOfTextAtSize(label, pillFontSize);
      contactPills.push({
        label,
        icon: "linkedin",
        primary: false,
        href: linkedinHref,
        width: pillPadX * 2 + pillIconSize + pillIconGap + textW,
      });
    }

    cursorY -= 6;

    // Location badge pill (centered)
    if (vm.location) {
      const locFontSize = 8.2;
      const locIconSize = 9;
      const safeLoc = truncateToWidth(vm.location, sansMedium, locFontSize, CONTENT_WIDTH - 40);
      const locTextW = sansMedium.widthOfTextAtSize(safeLoc, locFontSize);
      const badgeW = 8 * 2 + locIconSize + 4.5 + locTextW;
      const badgeH = 19;
      const badgeX = (PAGE_WIDTH - badgeW) / 2;
      const badgeY = cursorY - badgeH;

      drawRoundedRect(currentPage, {
        x: badgeX,
        y: badgeY,
        width: badgeW,
        height: badgeH,
        radius: 6,
        color: COLORS.pillBg,
        borderColor: COLORS.border,
        borderWidth: 0.7,
      });
      drawIcon(currentPage, "mapPin", {
        x: badgeX + 8,
        y: badgeY + (badgeH - locIconSize) / 2,
        size: locIconSize,
        color: COLORS.foreground,
        strokeWidth: 2,
      });
      currentPage.drawText(safeLoc, {
        x: badgeX + 8 + locIconSize + 4.5,
        y: badgeY + 6.2,
        font: sansMedium,
        size: locFontSize,
        color: COLORS.foreground,
      });

      cursorY = badgeY - 12;
    }

    // Name (centered)
    for (const line of nameLines) {
      const lineW = sansSemiBold.widthOfTextAtSize(line, 25);
      currentPage.drawText(line, {
        x: (PAGE_WIDTH - lineW) / 2,
        y: cursorY - 21,
        font: sansSemiBold,
        size: 25,
        color: COLORS.primary,
      });
      cursorY -= 28;
    }

    // Role (centered)
    if (roleLines.length > 0) {
      cursorY -= 2;
      for (const line of roleLines) {
        if (!line) {
          cursorY -= 5;
          continue;
        }
        const lineW = sansRegular.widthOfTextAtSize(line, 11.2);
        currentPage.drawText(line, {
          x: (PAGE_WIDTH - lineW) / 2,
          y: cursorY - 10.5,
          font: sansRegular,
          size: 11.2,
          color: COLORS.mutedForeground,
        });
        cursorY -= 15.5;
      }
    }

    // Contact pills (centered rows, replacing "Get in touch" CTA + bottom contact section)
    if (contactPills.length > 0) {
      cursorY -= 12;
      const rows = groupIntoRows(contactPills, CONTENT_WIDTH, 7);

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        let pillX = (PAGE_WIDTH - row.totalWidth) / 2;
        const pillY = cursorY - pillH;

        for (const pill of row.items) {
          drawRoundedRect(currentPage, {
            x: pillX,
            y: pillY,
            width: pill.width,
            height: pillH,
            radius: pillH / 2,
            color: pill.primary ? COLORS.primary : COLORS.background,
            borderColor: pill.primary ? undefined : COLORS.border,
            borderWidth: pill.primary ? 0 : 0.75,
          });

          const fgColor = pill.primary ? COLORS.primaryForeground : COLORS.foreground;
          drawIcon(currentPage, pill.icon, {
            x: pillX + pillPadX,
            y: pillY + (pillH - pillIconSize) / 2,
            size: pillIconSize,
            color: fgColor,
            strokeWidth: 2,
          });
          currentPage.drawText(pill.label, {
            x: pillX + pillPadX + pillIconSize + pillIconGap,
            y: pillY + 8.5,
            font: sansMedium,
            size: pillFontSize,
            color: fgColor,
          });

          if (pill.href) {
            addLinkAnnotation(currentPage, pill.href, pillX, pillY, pill.width, pillH);
          }

          pillX += pill.width + 7;
        }

        cursorY = pillY - (r < rows.length - 1 ? 6 : 0);
      }
    }

    cursorY -= BAND_PAD_Y;
    if (hasFollowingBands) {
      drawBandDivider();
    }
  }

  // =========================================================================
  // 2. EXPERIENCE SECTION (Left aside stacked above Right timeline cards)
  // =========================================================================
  function renderExperienceBand(muted: boolean, hasNextBand: boolean) {
    if (vm.experiences.length === 0) return;

    const innerW = CONTENT_WIDTH - CARD_PAD_X * 2;
    const measuredExps = vm.experiences.map((exp) => {
      const dateStr = exp.dates ? `${exp.dates}${exp.duration ? ` · ${exp.duration}` : ""}` : "";
      const dateBadge = dateStr ? measureMonoBadge(dateStr) : null;

      const roleText = sanitizeForFont(exp.role || "Untitled role", sansSemiBold);
      const companyText = exp.company ? sanitizeForFont(` · ${exp.company}`, sansRegular) : "";
      const roleW = sansSemiBold.widthOfTextAtSize(roleText, 9.8);
      const companyW = companyText ? sansRegular.widthOfTextAtSize(companyText, 9.4) : 0;

      const maxLeftWidth = dateBadge ? innerW - dateBadge.width - 10 : innerW;
      const inlineCompany = companyText !== "" && roleW + companyW <= maxLeftWidth;
      const wrappedRoleLines =
        roleW > maxLeftWidth
          ? wrapTextLines(roleText, sansSemiBold, 9.8, maxLeftWidth)
          : [roleText];
      const wrappedCompanyLines =
        companyText && !inlineCompany ? wrapTextLines(exp.company, sansRegular, 9.2, innerW) : [];

      const topRowH = Math.max(dateBadge ? dateBadge.height : 0, wrappedRoleLines.length * 13.5);
      const extraCompanyH =
        wrappedCompanyLines.length > 0 ? 2 + measureLinesHeight(wrappedCompanyLines, 12.5) : 0;

      const descLines = exp.description
        ? wrapTextLines(exp.description, sansRegular, 8.6, innerW)
        : [];
      const descH = descLines.length > 0 ? 7 + measureLinesHeight(descLines, 12.8) : 0;
      const cardH = CARD_PAD_Y * 2 + topRowH + extraCompanyH + descH;

      return {
        dateBadge,
        roleText,
        companyText,
        roleW,
        inlineCompany,
        wrappedRoleLines,
        wrappedCompanyLines,
        topRowH,
        extraCompanyH,
        descLines,
        cardH,
      };
    });

    const firstCardKeep = Math.min(
      measuredExps[0].cardH,
      MAX_PAGE_CONTENT_HEIGHT - BAND_PAD_Y - 54,
    );
    ensureSpace(BAND_PAD_Y + 54 + firstCardKeep);
    currentBandMuted = muted;
    advanceCursor(BAND_PAD_Y);

    drawSectionHeader({
      title: "Experience",
      subtitle: "Roles, responsibilities, and production systems shipped over time.",
      icon: "briefcase",
      badgeText: vm.totalExperienceDuration,
    });

    for (let i = 0; i < measuredExps.length; i++) {
      const {
        dateBadge,
        roleText,
        companyText,
        roleW,
        inlineCompany,
        wrappedRoleLines,
        wrappedCompanyLines,
        topRowH,
        extraCompanyH,
        descLines,
        cardH,
      } = measuredExps[i];

      const drawExperienceCard = (linesSlice: string[], includeHeader: boolean) => {
        const sliceDescH =
          linesSlice.length > 0
            ? (includeHeader ? 7 : 0) + measureLinesHeight(linesSlice, 12.8)
            : 0;
        const sliceH = CARD_PAD_Y * 2 + (includeHeader ? topRowH + extraCompanyH : 0) + sliceDescH;

        fillBandSlice(cursorY, cursorY - sliceH);
        const cardBottomY = cursorY - sliceH;

        drawRoundedRect(currentPage, {
          x: MARGIN_X,
          y: cardBottomY,
          width: CONTENT_WIDTH,
          height: sliceH,
          radius: CARD_RADIUS,
          color: COLORS.background,
          borderColor: COLORS.ringCard,
          borderWidth: 0.75,
        });

        let innerY = cursorY - CARD_PAD_Y;

        if (includeHeader) {
          const firstLineBaselineY = innerY - 10;

          if (wrappedRoleLines.length === 1) {
            currentPage.drawText(roleText, {
              x: MARGIN_X + CARD_PAD_X,
              y: firstLineBaselineY,
              font: sansSemiBold,
              size: 9.8,
              color: COLORS.foreground,
            });
            if (inlineCompany) {
              currentPage.drawText(companyText, {
                x: MARGIN_X + CARD_PAD_X + roleW,
                y: firstLineBaselineY,
                font: sansRegular,
                size: 9.4,
                color: COLORS.mutedForeground,
              });
            }
          } else {
            drawTextBlock(wrappedRoleLines, {
              x: MARGIN_X + CARD_PAD_X,
              startY: innerY,
              font: sansSemiBold,
              size: 9.8,
              lineHeight: 13.5,
              color: COLORS.foreground,
            });
          }

          if (dateBadge) {
            drawMonoBadge(
              MARGIN_X + CONTENT_WIDTH - CARD_PAD_X - dateBadge.width,
              innerY - dateBadge.height + 1,
              dateBadge,
            );
          }

          innerY -= topRowH;

          if (wrappedCompanyLines.length > 0) {
            innerY -= 2;
            innerY = drawTextBlock(wrappedCompanyLines, {
              x: MARGIN_X + CARD_PAD_X,
              startY: innerY,
              font: sansRegular,
              size: 9.2,
              lineHeight: 12.5,
              color: COLORS.mutedForeground,
            });
          }

          if (linesSlice.length > 0) {
            innerY -= 7;
          }
        }

        if (linesSlice.length > 0) {
          drawTextBlock(linesSlice, {
            x: MARGIN_X + CARD_PAD_X,
            startY: innerY,
            font: sansRegular,
            size: 8.6,
            lineHeight: 12.8,
            color: COLORS.mutedForeground,
          });
        }

        cursorY = cardBottomY;
      };

      if (cardH <= MAX_PAGE_CONTENT_HEIGHT) {
        ensureSpace(cardH);
        drawExperienceCard(descLines, true);
      } else {
        // Extremely long single experience card: split description cleanly across pages
        let remaining = [...descLines];
        let isFirstSlice = true;
        while (isFirstSlice || remaining.length > 0) {
          const overhead = CARD_PAD_Y * 2 + (isFirstSlice ? topRowH + extraCompanyH + 7 : 0);
          if (cursorY - (overhead + 26) < MARGIN_BOTTOM) {
            addNewPage();
          }
          const avail = cursorY - MARGIN_BOTTOM - overhead;
          const chunk: string[] = [];
          let used = 0;
          while (remaining.length > 0) {
            const lh = remaining[0] ? 12.8 : 5;
            if (chunk.length > 0 && used + lh > avail) break;
            chunk.push(remaining.shift()!);
            used += lh;
          }
          drawExperienceCard(chunk, isFirstSlice);
          isFirstSlice = false;
          if (remaining.length > 0) {
            addNewPage();
          }
        }
      }

      if (i < vm.experiences.length - 1) {
        advanceCursor(10);
      }
    }

    advanceCursor(BAND_PAD_Y);
    if (hasNextBand) {
      drawBandDivider();
    }
    currentBandMuted = false;
  }

  // =========================================================================
  // 3. TECHNOLOGIES SECTION
  // =========================================================================
  function renderTechnologiesBand(muted: boolean, hasNextBand: boolean) {
    if (vm.technologyTotals.length === 0) return;

    ensureSpace(BAND_PAD_Y + 52 + 24);
    currentBandMuted = muted;
    advanceCursor(BAND_PAD_Y);

    drawSectionHeader({
      title: "Technologies",
      subtitle: "Technologies aggregated across experience timelines.",
      icon: "code",
    });

    const pillH = 20;
    const gapX = 6;
    const gapY = 6;

    const pills = vm.technologyTotals.map((tech) => {
      const label = sanitizeForFont(tech.label, sansMedium);
      const duration = tech.duration ? sanitizeForFont(tech.duration, monoRegular) : "";
      const labelW = sansMedium.widthOfTextAtSize(label, 8.5);
      const durW = duration ? monoRegular.widthOfTextAtSize(duration, 7.5) : 0;
      const width = 8 * 2 + labelW + (durW > 0 ? 5.5 + durW : 0);
      return { label, duration, labelW, width };
    });

    const rows = groupIntoRows(pills, CONTENT_WIDTH, gapX);

    for (let r = 0; r < rows.length; r++) {
      ensureSpace(pillH);
      fillBandSlice(cursorY, cursorY - pillH);

      let chipX = MARGIN_X;
      const chipY = cursorY - pillH;

      for (const pill of rows[r].items) {
        drawRoundedRect(currentPage, {
          x: chipX,
          y: chipY,
          width: pill.width,
          height: pillH,
          radius: 5.5,
          color: COLORS.pillBg,
          borderColor: COLORS.borderGrid,
          borderWidth: 0.7,
        });
        currentPage.drawText(pill.label, {
          x: chipX + 8,
          y: chipY + 6.5,
          font: sansMedium,
          size: 8.5,
          color: COLORS.foreground,
        });
        if (pill.duration) {
          currentPage.drawText(pill.duration, {
            x: chipX + 8 + pill.labelW + 5.5,
            y: chipY + 6.5,
            font: monoRegular,
            size: 7.5,
            color: COLORS.mutedForeground,
          });
        }
        chipX += pill.width + gapX;
      }

      cursorY = chipY;
      if (r < rows.length - 1) {
        advanceCursor(gapY);
      }
    }

    advanceCursor(BAND_PAD_Y);
    if (hasNextBand) {
      drawBandDivider();
    }
    currentBandMuted = false;
  }

  // =========================================================================
  // 4. PROJECTS SECTION (1-column full-width cards stacked vertically)
  // =========================================================================
  function renderProjectsBand(muted: boolean, hasNextBand: boolean) {
    if (vm.projects.length === 0) return;

    const innerW = CONTENT_WIDTH - CARD_PAD_X * 2;
    const footerH = 22;

    const measuredProjects = vm.projects.map((proj) => {
      const titleLines = wrapTextLines(proj.name || "Untitled project", sansMedium, 10, innerW);
      const descLines = proj.description
        ? wrapTextLines(proj.description, sansRegular, 8.6, innerW)
        : [];
      const hasFooter = Boolean(proj.linkDisplay);
      const linkHref = safeHttpUrl(proj.linkHref);

      const titleH = measureLinesHeight(titleLines, 13.5);
      const descH = descLines.length > 0 ? 5 + measureLinesHeight(descLines, 12.8) : 0;
      const bodyH = CARD_PAD_Y * 2 + titleH + descH;
      const totalCardH = bodyH + (hasFooter ? footerH : 0);

      return { proj, titleLines, descLines, hasFooter, linkHref, totalCardH };
    });

    const firstCardKeep = Math.min(
      measuredProjects[0].totalCardH,
      MAX_PAGE_CONTENT_HEIGHT - BAND_PAD_Y - 52,
    );
    ensureSpace(BAND_PAD_Y + 52 + firstCardKeep);
    currentBandMuted = muted;
    advanceCursor(BAND_PAD_Y);

    drawSectionHeader({
      title: "Projects",
      subtitle: "Selected builds, open-source repositories, and shipped work.",
    });

    for (let i = 0; i < measuredProjects.length; i++) {
      const { proj, titleLines, descLines, hasFooter, linkHref, totalCardH } = measuredProjects[i];

      ensureSpace(Math.min(totalCardH, MAX_PAGE_CONTENT_HEIGHT));
      fillBandSlice(cursorY, cursorY - totalCardH);

      const cardBottomY = cursorY - totalCardH;

      // White card background
      drawRoundedRect(currentPage, {
        x: MARGIN_X,
        y: cardBottomY,
        width: CONTENT_WIDTH,
        height: totalCardH,
        radius: CARD_RADIUS,
        color: COLORS.background,
      });

      // Muted footer strip (rounded bottom corners)
      if (hasFooter) {
        drawBottomRoundedRect(currentPage, {
          x: MARGIN_X,
          y: cardBottomY,
          width: CONTENT_WIDTH,
          height: footerH,
          radius: CARD_RADIUS,
          color: COLORS.cardFooterBg,
        });
        currentPage.drawLine({
          start: { x: MARGIN_X, y: cardBottomY + footerH },
          end: { x: MARGIN_X + CONTENT_WIDTH, y: cardBottomY + footerH },
          thickness: 0.6,
          color: COLORS.borderGrid,
        });
        const safeLink = truncateToWidth(proj.linkDisplay, monoRegular, 7.6, innerW);
        currentPage.drawText(safeLink, {
          x: MARGIN_X + CARD_PAD_X,
          y: cardBottomY + 8,
          font: monoRegular,
          size: 7.6,
          color: COLORS.mutedForeground,
        });
      }

      // Outer rounded border drawn cleanly on top
      drawRoundedRect(currentPage, {
        x: MARGIN_X,
        y: cardBottomY,
        width: CONTENT_WIDTH,
        height: totalCardH,
        radius: CARD_RADIUS,
        borderColor: COLORS.ringCard,
        borderWidth: 0.75,
      });

      let innerY = cursorY - CARD_PAD_Y;
      innerY = drawTextBlock(titleLines, {
        x: MARGIN_X + CARD_PAD_X,
        startY: innerY,
        font: sansMedium,
        size: 10,
        lineHeight: 13.5,
        color: COLORS.foreground,
      });

      if (descLines.length > 0) {
        innerY -= 5;
        drawTextBlock(descLines, {
          x: MARGIN_X + CARD_PAD_X,
          startY: innerY,
          font: sansRegular,
          size: 8.6,
          lineHeight: 12.8,
          color: COLORS.mutedForeground,
        });
      }

      if (linkHref) {
        addLinkAnnotation(currentPage, linkHref, MARGIN_X, cardBottomY, CONTENT_WIDTH, totalCardH);
      }

      cursorY = cardBottomY;
      if (i < vm.projects.length - 1) {
        advanceCursor(10);
      }
    }

    advanceCursor(BAND_PAD_Y);
    if (hasNextBand) {
      drawBandDivider();
    }
    currentBandMuted = false;
  }

  // =========================================================================
  // 5. SETUP SECTION (1-column full-width cards stacked vertically)
  // =========================================================================
  function renderSetupBand(muted: boolean, hasNextBand: boolean) {
    if (vm.setups.length === 0) return;

    const innerW = CONTENT_WIDTH - CARD_PAD_X * 2;
    const measuredSetups = vm.setups.map((item) => {
      const titleLines = wrapTextLines(item.name || "Untitled item", sansMedium, 9.8, innerW);
      const descLines = item.description
        ? wrapTextLines(item.description, sansRegular, 8.6, innerW)
        : [];
      const titleH = measureLinesHeight(titleLines, 13.5);
      const descH = descLines.length > 0 ? 4.5 + measureLinesHeight(descLines, 12.8) : 0;
      const cardH = CARD_PAD_Y * 2 + titleH + descH;
      return { titleLines, descLines, cardH };
    });

    const firstCardKeep = Math.min(
      measuredSetups[0].cardH,
      MAX_PAGE_CONTENT_HEIGHT - BAND_PAD_Y - 54,
    );
    ensureSpace(BAND_PAD_Y + 54 + firstCardKeep);
    currentBandMuted = muted;
    advanceCursor(BAND_PAD_Y);

    drawSectionHeader({
      title: "Setup",
      subtitle: "Hardware, software, and daily tools that power my workflow.",
      icon: "laptop",
    });

    for (let i = 0; i < measuredSetups.length; i++) {
      const { titleLines, descLines, cardH } = measuredSetups[i];

      ensureSpace(Math.min(cardH, MAX_PAGE_CONTENT_HEIGHT));
      fillBandSlice(cursorY, cursorY - cardH);

      const cardBottomY = cursorY - cardH;
      drawRoundedRect(currentPage, {
        x: MARGIN_X,
        y: cardBottomY,
        width: CONTENT_WIDTH,
        height: cardH,
        radius: CARD_RADIUS,
        color: COLORS.background,
        borderColor: COLORS.ringCard,
        borderWidth: 0.75,
      });

      let innerY = cursorY - CARD_PAD_Y;
      innerY = drawTextBlock(titleLines, {
        x: MARGIN_X + CARD_PAD_X,
        startY: innerY,
        font: sansMedium,
        size: 9.8,
        lineHeight: 13.5,
        color: COLORS.foreground,
      });

      if (descLines.length > 0) {
        innerY -= 4.5;
        drawTextBlock(descLines, {
          x: MARGIN_X + CARD_PAD_X,
          startY: innerY,
          font: sansRegular,
          size: 8.6,
          lineHeight: 12.8,
          color: COLORS.mutedForeground,
        });
      }

      cursorY = cardBottomY;
      if (i < vm.setups.length - 1) {
        advanceCursor(10);
      }
    }

    advanceCursor(BAND_PAD_Y);
    if (hasNextBand) {
      drawBandDivider();
    }
    currentBandMuted = false;
  }

  // =========================================================================
  // 6. BACKGROUND SECTION (Left Education card above, Right Languages card below)
  // =========================================================================
  function renderBackgroundBand(muted: boolean, hasNextBand: boolean) {
    const hasEdu = vm.education.length > 0;
    const hasLang = vm.languages.length > 0;
    if (!hasEdu && !hasLang) return;

    const cardHeaderH = 38;
    const innerW = CONTENT_WIDTH - CARD_PAD_X * 2;

    type MeasuredEduItem = {
      degreeLines: string[];
      dateBadge: { label: string; width: number; height: number } | null;
      university: string;
      levelLabel: string;
      topRowH: number;
      metaH: number;
      itemH: number;
    };

    const measuredEdu: MeasuredEduItem[] = hasEdu
      ? vm.education.map((edu) => {
          const dateStr = edu.dates
            ? `${edu.dates}${edu.duration ? ` · ${edu.duration}` : ""}`
            : "";
          const dateBadge = dateStr ? measureMonoBadge(dateStr) : null;
          const maxDegW = dateBadge ? innerW - dateBadge.width - 10 : innerW;
          const degreeLines = wrapTextLines(
            edu.degree || "Untitled degree",
            sansMedium,
            9.4,
            maxDegW,
          );
          const topRowH = Math.max(dateBadge ? dateBadge.height : 0, degreeLines.length * 13);
          const hasMeta = Boolean(edu.university || edu.levelLabel);
          const metaH = hasMeta ? 4 + 14.5 : 0;
          return {
            degreeLines,
            dateBadge,
            university: edu.university,
            levelLabel: edu.levelLabel,
            topRowH,
            metaH,
            itemH: topRowH + metaH,
          };
        })
      : [];

    const eduListH =
      measuredEdu.reduce((sum, item) => sum + item.itemH, 0) +
      Math.max(0, measuredEdu.length - 1) * 18;
    const eduCardH = hasEdu ? cardHeaderH + CARD_PAD_Y * 2 + eduListH : 0;

    const langPillH = 21;
    const langGapX = 6;
    const langGapY = 6;
    const langPills = hasLang
      ? vm.languages.map((lang) => {
          const name = sanitizeForFont(lang.language, sansMedium);
          const level = lang.fluencyLabel ? sanitizeForFont(lang.fluencyLabel, sansRegular) : "";
          const nameW = sansMedium.widthOfTextAtSize(name, 8.6);
          const levelW = level ? sansRegular.widthOfTextAtSize(level, 7.6) : 0;
          const width = 8.5 * 2 + nameW + (levelW > 0 ? 6 + levelW : 0);
          return { name, level, nameW, width };
        })
      : [];
    const langRows = groupIntoRows(langPills, innerW, langGapX);
    const langBodyH = langRows.length * langPillH + Math.max(0, langRows.length - 1) * langGapY;
    const langCardH = hasLang ? cardHeaderH + CARD_PAD_Y * 2 + langBodyH : 0;

    const firstCardH = hasEdu ? eduCardH : langCardH;
    ensureSpace(BAND_PAD_Y + Math.min(firstCardH, MAX_PAGE_CONTENT_HEIGHT - BAND_PAD_Y));
    currentBandMuted = muted;
    advanceCursor(BAND_PAD_Y);

    // --- Education Card (was left side in HTML -> now above) ---
    if (hasEdu) {
      const drawEduHeader = (cardTopY: number) => {
        const headerBottomY = cardTopY - cardHeaderH;
        drawIconBox(MARGIN_X + CARD_PAD_X, headerBottomY + (cardHeaderH - 20) / 2, "graduation");
        currentPage.drawText("Education", {
          x: MARGIN_X + CARD_PAD_X + 20 + 7,
          y: headerBottomY + 14.5,
          font: sansSemiBold,
          size: 11,
          color: COLORS.foreground,
        });

        if (vm.totalEducationDuration) {
          const totalBadge = measureMonoBadge(vm.totalEducationDuration);
          drawMonoBadge(
            MARGIN_X + CONTENT_WIDTH - CARD_PAD_X - totalBadge.width,
            headerBottomY + (cardHeaderH - totalBadge.height) / 2,
            totalBadge,
          );
        }

        currentPage.drawLine({
          start: { x: MARGIN_X, y: headerBottomY },
          end: { x: MARGIN_X + CONTENT_WIDTH, y: headerBottomY },
          thickness: 0.6,
          color: COLORS.borderGrid,
        });
      };

      const drawEduItemsSlice = (slice: MeasuredEduItem[], includeHeader: boolean) => {
        const sliceListH =
          slice.reduce((sum, item) => sum + item.itemH, 0) + Math.max(0, slice.length - 1) * 18;
        const sliceH = (includeHeader ? cardHeaderH : 0) + CARD_PAD_Y * 2 + sliceListH;

        fillBandSlice(cursorY, cursorY - sliceH);
        const cardBottomY = cursorY - sliceH;

        drawRoundedRect(currentPage, {
          x: MARGIN_X,
          y: cardBottomY,
          width: CONTENT_WIDTH,
          height: sliceH,
          radius: CARD_RADIUS,
          color: COLORS.background,
          borderColor: COLORS.ringCard,
          borderWidth: 0.75,
        });

        let innerY = cursorY;
        if (includeHeader) {
          drawEduHeader(cursorY);
          innerY -= cardHeaderH;
        }
        innerY -= CARD_PAD_Y;

        slice.forEach((item, idx) => {
          drawTextBlock(item.degreeLines, {
            x: MARGIN_X + CARD_PAD_X,
            startY: innerY,
            font: sansMedium,
            size: 9.4,
            lineHeight: 13,
            color: COLORS.foreground,
          });

          if (item.dateBadge) {
            drawMonoBadge(
              MARGIN_X + CONTENT_WIDTH - CARD_PAD_X - item.dateBadge.width,
              innerY - item.dateBadge.height + 1,
              item.dateBadge,
            );
          }

          innerY -= item.topRowH;

          if (item.metaH > 0) {
            innerY -= 4;
            let metaX = MARGIN_X + CARD_PAD_X;
            const metaRowBottomY = innerY - 14.5;

            if (item.university) {
              const levelReserve = item.levelLabel ? 85 : 0;
              const safeUni = truncateToWidth(
                item.university,
                sansRegular,
                8.3,
                innerW - levelReserve,
              );
              currentPage.drawText(safeUni, {
                x: metaX,
                y: metaRowBottomY + 4,
                font: sansRegular,
                size: 8.3,
                color: COLORS.mutedForeground,
              });
              metaX += sansRegular.widthOfTextAtSize(safeUni, 8.3) + 6;
            }

            if (item.levelLabel) {
              const safeLevel = sanitizeForFont(item.levelLabel, sansMedium);
              const levelW = sansMedium.widthOfTextAtSize(safeLevel, 7.4);
              const pillW = levelW + 12;
              const pillH = 14.5;
              drawRoundedRect(currentPage, {
                x: metaX,
                y: metaRowBottomY,
                width: pillW,
                height: pillH,
                radius: pillH / 2,
                color: COLORS.secondary,
              });
              currentPage.drawText(safeLevel, {
                x: metaX + 6,
                y: metaRowBottomY + 4.3,
                font: sansMedium,
                size: 7.4,
                color: COLORS.secondaryForeground,
              });
            }

            innerY = metaRowBottomY;
          }

          if (idx < slice.length - 1) {
            innerY -= 9;
            currentPage.drawLine({
              start: { x: MARGIN_X + CARD_PAD_X, y: innerY },
              end: { x: MARGIN_X + CONTENT_WIDTH - CARD_PAD_X, y: innerY },
              thickness: 0.6,
              color: COLORS.borderGrid,
            });
            innerY -= 9;
          }
        });

        cursorY = cardBottomY;
      };

      if (eduCardH <= MAX_PAGE_CONTENT_HEIGHT) {
        ensureSpace(eduCardH);
        drawEduItemsSlice(measuredEdu, true);
      } else {
        let remaining = [...measuredEdu];
        let isFirst = true;
        while (remaining.length > 0) {
          const overhead = (isFirst ? cardHeaderH : 0) + CARD_PAD_Y * 2;
          if (cursorY - (overhead + remaining[0].itemH) < MARGIN_BOTTOM) {
            addNewPage();
          }
          const avail = cursorY - MARGIN_BOTTOM - overhead;
          const slice: MeasuredEduItem[] = [];
          let used = 0;
          while (remaining.length > 0) {
            const nextCost = remaining[0].itemH + (slice.length > 0 ? 18 : 0);
            if (slice.length > 0 && used + nextCost > avail) break;
            slice.push(remaining.shift()!);
            used += nextCost;
          }
          drawEduItemsSlice(slice, isFirst);
          isFirst = false;
          if (remaining.length > 0) {
            addNewPage();
          }
        }
      }

      if (hasLang) {
        advanceCursor(12);
      }
    }

    // --- Languages Card (was right side in HTML -> now below) ---
    if (hasLang) {
      ensureSpace(Math.min(langCardH, MAX_PAGE_CONTENT_HEIGHT));
      fillBandSlice(cursorY, cursorY - langCardH);

      const cardBottomY = cursorY - langCardH;
      drawRoundedRect(currentPage, {
        x: MARGIN_X,
        y: cardBottomY,
        width: CONTENT_WIDTH,
        height: langCardH,
        radius: CARD_RADIUS,
        color: COLORS.background,
        borderColor: COLORS.ringCard,
        borderWidth: 0.75,
      });

      const headerBottomY = cursorY - cardHeaderH;
      drawIconBox(MARGIN_X + CARD_PAD_X, headerBottomY + (cardHeaderH - 20) / 2, "languages");
      currentPage.drawText("Languages", {
        x: MARGIN_X + CARD_PAD_X + 20 + 7,
        y: headerBottomY + 14.5,
        font: sansSemiBold,
        size: 11,
        color: COLORS.foreground,
      });
      currentPage.drawLine({
        start: { x: MARGIN_X, y: headerBottomY },
        end: { x: MARGIN_X + CONTENT_WIDTH, y: headerBottomY },
        thickness: 0.6,
        color: COLORS.borderGrid,
      });

      let rowTopY = headerBottomY - CARD_PAD_Y;
      for (const row of langRows) {
        let chipX = MARGIN_X + CARD_PAD_X;
        const chipY = rowTopY - langPillH;

        for (const pill of row.items) {
          drawRoundedRect(currentPage, {
            x: chipX,
            y: chipY,
            width: pill.width,
            height: langPillH,
            radius: 5.5,
            color: COLORS.pillBg,
            borderColor: COLORS.borderGrid,
            borderWidth: 0.7,
          });
          currentPage.drawText(pill.name, {
            x: chipX + 8.5,
            y: chipY + 6.8,
            font: sansMedium,
            size: 8.6,
            color: COLORS.foreground,
          });
          if (pill.level) {
            currentPage.drawText(pill.level, {
              x: chipX + 8.5 + pill.nameW + 6,
              y: chipY + 6.8,
              font: sansRegular,
              size: 7.6,
              color: COLORS.mutedForeground,
            });
          }
          chipX += pill.width + langGapX;
        }

        rowTopY = chipY - langGapY;
      }

      cursorY = cardBottomY;
    }

    advanceCursor(BAND_PAD_Y);
    if (hasNextBand) {
      drawBandDivider();
    }
    currentBandMuted = false;
  }

  // =========================================================================
  // ASSEMBLE DOCUMENT IN EXACT HTML SECTION ORDER
  // =========================================================================
  addNewPage();

  const visibleBands: ((muted: boolean, hasNextBand: boolean) => void)[] = [];
  if (vm.experiences.length > 0) visibleBands.push(renderExperienceBand);
  if (vm.technologyTotals.length > 0) visibleBands.push(renderTechnologiesBand);
  if (vm.projects.length > 0) visibleBands.push(renderProjectsBand);
  if (vm.setups.length > 0) visibleBands.push(renderSetupBand);
  if (vm.education.length > 0 || vm.languages.length > 0) {
    visibleBands.push(renderBackgroundBand);
  }

  renderHeroBand(visibleBands.length > 0);

  if (visibleBands.length === 0) {
    const emptyMsg = "No portfolio sections added yet.";
    const emptyW = sansRegular.widthOfTextAtSize(emptyMsg, 9.5);
    currentPage.drawText(emptyMsg, {
      x: (PAGE_WIDTH - emptyW) / 2,
      y: cursorY - 24,
      font: sansRegular,
      size: 9.5,
      color: COLORS.mutedForeground,
    });
  } else {
    visibleBands.forEach((renderBand, idx) => {
      const muted = (idx + 1) % 2 === 1;
      const hasNextBand = idx < visibleBands.length - 1;
      renderBand(muted, hasNextBand);
    });
  }

  // =========================================================================
  // FOOTER ON ALL PAGES (Matches HTML footer)
  // =========================================================================
  const footerPrefix = "Built with ";
  const footerBrand = "/prezent-me";
  const prefixW = sansRegular.widthOfTextAtSize(footerPrefix, 7.8);
  const brandW = monoRegular.widthOfTextAtSize(footerBrand, 7.8);
  const footerTotalW = prefixW + brandW;
  const footerStartX = (PAGE_WIDTH - footerTotalW) / 2;

  pages.forEach((page) => {
    page.drawLine({
      start: { x: 0, y: FOOTER_LINE_Y },
      end: { x: PAGE_WIDTH, y: FOOTER_LINE_Y },
      thickness: 0.6,
      color: COLORS.borderGrid,
    });

    page.drawText(footerPrefix, {
      x: footerStartX,
      y: 16,
      font: sansRegular,
      size: 7.8,
      color: COLORS.mutedForeground,
    });
    page.drawText(footerBrand, {
      x: footerStartX + prefixW,
      y: 16,
      font: monoRegular,
      size: 7.8,
      color: COLORS.mutedForeground,
    });
    addLinkAnnotation(page, "https://prezentme.vercel.app", footerStartX, 12, footerTotalW, 14);
  });

  return pdfDoc.save();
}
