import JSZip from 'jszip';

export interface DocxSection {
  title: string;
  content: string;
}

/**
 * Generates an authentic Microsoft Word OpenXML (.docx) file using JSZip.
 * Bypasses invalid MIME disguised HTML files to ensure 100% genuine OOXML compatibility.
 */
export async function generateDocxBlob(options: {
  title: string;
  subtitle?: string;
  sections: DocxSection[];
}): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  zip.file('[Content_Types].xml', contentTypesXml);

  // 2. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  zip.file('_rels/.rels', rootRelsXml);

  // Helper to escape XML special chars
  const escapeXml = (str: string) => {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Build word/document.xml paragraphs
  let documentBodyXml = '';

  // Document Title
  documentBodyXml += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:color w:val="111827"/>
        </w:rPr>
        <w:t>${escapeXml(options.title)}</w:t>
      </w:r>
    </w:p>`;

  if (options.subtitle) {
    documentBodyXml += `
      <w:p>
        <w:r>
          <w:rPr>
            <w:i/>
            <w:sz w:val="22"/>
            <w:color w:val="4B5563"/>
          </w:rPr>
          <w:t>${escapeXml(options.subtitle)}</w:t>
        </w:r>
      </w:p>
      <w:p/>`;
  }

  // Sections
  for (const section of options.sections) {
    // Section Heading
    documentBodyXml += `
      <w:p>
        <w:pPr>
          <w:pStyle w:val="Heading1"/>
          <w:spacing w:before="360" w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:b/>
            <w:sz w:val="28"/>
            <w:color w:val="1E3A8A"/>
          </w:rPr>
          <w:t>${escapeXml(section.title)}</w:t>
        </w:r>
      </w:p>`;

    // Paragraphs inside section
    const lines = section.content.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) {
        documentBodyXml += `<w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>`;
        continue;
      }

      documentBodyXml += `
        <w:p>
          <w:pPr>
            <w:spacing w:after="140" w:line="276" w:lineRule="auto"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
              <w:sz w:val="24"/>
              <w:color w:val="1F2937"/>
            </w:rPr>
            <w:t xml:space="preserve">${escapeXml(line)}</w:t>
          </w:r>
        </w:p>`;
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${documentBodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}
