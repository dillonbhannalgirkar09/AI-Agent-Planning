import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx';

interface ExportSection {
  title: string;
  content: string;
}

// A4 page: 12240 DXA wide. Margins: 1280 each side. Content = 9680 DXA
const CONTENT_WIDTH_DXA = 9680;

// ===== Parse markdown table =====
function parseMarkdownTable(
  lines: string[]
): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;

  const parseLine = (line: string): string[] =>
    line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c !== '');

  const headers = parseLine(lines[0]);
  if (headers.length === 0) return null;

  const sep = lines[1].trim();
  if (!sep.match(/^\|[\s\-:|]+\|$/)) return null;

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t.startsWith('|')) break;
    const cells = parseLine(t);
    // Pad to header length
    while (cells.length < headers.length) cells.push('');
    rows.push(cells.slice(0, headers.length));
  }

  return rows.length > 0 ? { headers, rows } : null;
}

// ===== Create Word Table using columnWidths =====
function createWordTable(headers: string[], rows: string[][]): Table {
  const colCount = headers.length;
  const colWidth = Math.floor(CONTENT_WIDTH_DXA / colCount);

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (header) =>
        new TableCell({
          shading: {
            type: ShadingType.SOLID,
            color: '1a1a2e',
            fill: '1a1a2e',
          },
          verticalAlign: 'center' as any,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: header.replace(/\*\*/g, ''),
                  bold: true,
                  color: 'ffffff',
                  size: 20,
                  font: 'Helvetica',
                }),
              ],
              spacing: { before: 80, after: 80 },
              indent: { left: 80 },
            }),
          ],
        })
    ),
  });

  const dataRows = rows.map(
    (row, rowIndex) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              shading: {
                type: ShadingType.SOLID,
                color: rowIndex % 2 === 0 ? 'f0f4f8' : 'ffffff',
                fill: rowIndex % 2 === 0 ? 'f0f4f8' : 'ffffff',
              },
              children: [
                new Paragraph({
                  children: parseInlineFormatting(cell),
                  spacing: { before: 60, after: 60 },
                  indent: { left: 80 },
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    columnWidths: Array(colCount).fill(colWidth),
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'cbd5e1' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cbd5e1' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'cbd5e1' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'cbd5e1' },
      insideHorizontal: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: 'cbd5e1',
      },
      insideVertical: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: 'cbd5e1',
      },
    },
  });
}

// ===== Parse bold/italic =====
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|([^*]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      runs.push(
        new TextRun({
          text: match[2],
          bold: true,
          size: 20,
          font: 'Helvetica',
        })
      );
    } else if (match[4]) {
      runs.push(
        new TextRun({
          text: match[4],
          italics: true,
          size: 20,
          font: 'Helvetica',
        })
      );
    } else if (match[5]) {
      runs.push(
        new TextRun({ text: match[5], size: 20, font: 'Helvetica' })
      );
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text, size: 20, font: 'Helvetica' }));
  }

  return runs;
}

// ===== Clean content =====
function cleanContent(content: string): string {
  let cleaned = content;
  cleaned = cleaned.replace(/^#\s+.+\n*/m, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/^\n+/, '');
  return cleaned;
}

// ===== Convert markdown → Word elements =====
function parseMarkdownToElements(
  content: string
): (Paragraph | Table)[] {
  const cleaned = cleanContent(content);
  const elements: (Paragraph | Table)[] = [];
  const lines = cleaned.split('\n');
  let i = 0;
  let lastWasEmpty = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (!lastWasEmpty) {
        elements.push(new Paragraph({ text: '', spacing: { after: 60 } }));
        lastWasEmpty = true;
      }
      i++;
      continue;
    }
    lastWasEmpty = false;

    // Skip top-level # headings
    if (/^#\s+/.test(trimmed) && !trimmed.startsWith('## ')) {
      i++;
      continue;
    }

    // Table
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const tableData = parseMarkdownTable(tableLines);
      if (tableData) {
        elements.push(createWordTable(tableData.headers, tableData.rows));
        elements.push(
          new Paragraph({ text: '', spacing: { after: 120 } })
        );
      }
      continue;
    }

    // ## Heading 2
    if (trimmed.startsWith('## ')) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace('## ', ''),
              bold: true,
              size: 26,
              color: '1e293b',
              font: 'Helvetica',
            }),
          ],
          spacing: { before: 240, after: 100 },
          border: {
            bottom: {
              color: 'e2e8f0',
              size: 1,
              style: BorderStyle.SINGLE,
              space: 4,
            },
          },
        })
      );
      i++;
      continue;
    }

    // ### Heading 3
    if (trimmed.startsWith('### ')) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace('### ', ''),
              bold: true,
              size: 22,
              color: '334155',
              font: 'Helvetica',
            }),
          ],
          spacing: { before: 180, after: 80 },
        })
      );
      i++;
      continue;
    }

    // Bullet
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.replace(/^[-*]\s/, '');
      elements.push(
        new Paragraph({
          children: parseInlineFormatting(text),
          bullet: { level: 0 },
          spacing: { before: 30, after: 30 },
          indent: { left: 360 },
        })
      );
      i++;
      continue;
    }

    // Sub-bullet
    if (
      line.startsWith('  - ') ||
      line.startsWith('  * ') ||
      line.startsWith('    - ')
    ) {
      const text = trimmed.replace(/^[-*]\s/, '');
      elements.push(
        new Paragraph({
          children: parseInlineFormatting(text),
          bullet: { level: 1 },
          spacing: { before: 20, after: 20 },
          indent: { left: 720 },
        })
      );
      i++;
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      elements.push(
        new Paragraph({
          children: parseInlineFormatting(text),
          numbering: { reference: 'default-numbering', level: 0 },
          spacing: { before: 30, after: 30 },
          indent: { left: 360 },
        })
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (trimmed.match(/^[-*_]{3,}$/)) {
      elements.push(
        new Paragraph({
          border: {
            bottom: {
              color: 'e2e8f0',
              size: 1,
              style: BorderStyle.SINGLE,
              space: 1,
            },
          },
          spacing: { before: 100, after: 100 },
        })
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      new Paragraph({
        children: parseInlineFormatting(trimmed),
        spacing: { before: 40, after: 40 },
      })
    );
    i++;
  }

  return elements;
}

// ===== Main Handler =====
export async function POST(request: NextRequest) {
  try {
    const { problemStatement, sections } = await request.json();

    const sectionElements = (sections as ExportSection[]).flatMap(
      (section, index) => {
        const contentElements = parseMarkdownToElements(section.content);
        return [
          // Section Title
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                bold: true,
                size: 32,
                color: '1a1a2e',
                font: 'Helvetica',
              }),
            ],
            spacing: { before: index === 0 ? 0 : 400, after: 60 },
          }),
          // Blue underline
          new Paragraph({
            border: {
              bottom: {
                color: '3b82f6',
                size: 3,
                style: BorderStyle.SINGLE,
                space: 1,
              },
            },
            spacing: { after: 160 },
          }),
          // Content
          ...contentElements,
        ];
      }
    );

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: AlignmentType.START,
              },
            ],
          },
        ],
      },
      styles: {
        default: {
          document: {
            run: {
              font: 'Helvetica',
              size: 20,
              color: '374151',
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1280,
                bottom: 1440,
                left: 1280,
              },
            },
          },
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: 'AI Planning Report',
                  bold: true,
                  size: 48,
                  color: '1a1a2e',
                  font: 'Helvetica',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }),
            // Problem
            new Paragraph({
              children: [
                new TextRun({
                  text: `Problem: "${problemStatement}"`,
                  italics: true,
                  size: 22,
                  color: '6b7280',
                  font: 'Helvetica',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
            // Date
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on ${new Date().toLocaleDateString(
                    'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}`,
                  size: 18,
                  color: '9ca3af',
                  font: 'Helvetica',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 },
            }),
            // Divider
            new Paragraph({
              border: {
                bottom: {
                  color: '1a1a2e',
                  size: 4,
                  style: BorderStyle.SINGLE,
                  space: 1,
                },
              },
              spacing: { after: 300 },
            }),
            // Sections
            ...sectionElements,
            // Footer divider
            new Paragraph({
              border: {
                top: {
                  color: 'e2e8f0',
                  size: 1,
                  style: BorderStyle.SINGLE,
                  space: 1,
                },
              },
              spacing: { before: 400 },
            }),
            // Footer
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated by AI Planning Agent — ${new Date().toLocaleDateString(
                    'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}`,
                  size: 16,
                  color: '9ca3af',
                  italics: true,
                  font: 'Helvetica',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 160 },
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition':
          'attachment; filename=ai-planning-report.docx',
      },
    });
  } catch (error: any) {
    console.error('DOCX export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX', details: error.message },
      { status: 500 }
    );
  }
}