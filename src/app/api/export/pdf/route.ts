import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { problemStatement, sections } = await request.json();

    const htmlContent = generateReportHTML(problemStatement, sections);

    return NextResponse.json({ html: htmlContent });
  } catch (error: any) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}

function generateReportHTML(
  problemStatement: string,
  sections: { title: string; content: string }[]
): string {
  const sectionsHTML = sections
    .map(
      (section) => `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #1a1a2e; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 20px;">${section.title}</h2>
      <div style="color: #333; line-height: 1.8; font-size: 14px;">
        ${markdownToHTML(section.content)}
      </div>
    </div>
  `
    )
    .join('');

  return `
    <div style="font-family: 'Helvetica', 'Arial', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 10px;">AI Planning Report</h1>
        <p style="color: #666; font-style: italic; font-size: 16px;">${problemStatement}</p>
        <hr style="border: 1px solid #1a1a2e; margin-top: 20px;" />
      </div>
      ${sectionsHTML}
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
        <p style="color: #999; font-size: 12px; font-style: italic;">
          Generated on ${new Date().toLocaleDateString()} by AI Planning Agent
        </p>
      </div>
    </div>
  `;
}

function markdownToHTML(markdown: string): string {
  return markdown
    .replace(/### (.+)/g, '<h3 style="color: #2d3748; font-size: 16px; margin-top: 15px;">$1</h3>')
    .replace(/## (.+)/g, '<h2 style="color: #2d3748; font-size: 18px; margin-top: 20px;">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li style="margin-left: 20px;">$1</li>')
    .replace(/^\d+\. (.+)/gm, '<li style="margin-left: 20px;">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}