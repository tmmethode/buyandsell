import React, { useEffect, useState } from "react";
import ContractModal, {
  emptyContractForm,
  buildContractTitle,
} from "../ContractModal";
import {
  Calendar,
  CreditCard,
  Download,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import apiBaseUrl from "../../config";
import buyAndSellLogo from "../images/buyandsell250-logo.png";

const escapePdfText = (text = "") =>
  String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapPdfText = (text, maxChars = 92) => {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines;
};

const pdfTextEncoder = new TextEncoder();
const encodePdfString = (value) => pdfTextEncoder.encode(value);

const concatPdfBytes = (...chunks) => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged;
};

const base64ToUint8Array = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const canvasToPdfImage = (canvas) => {
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const [, base64Data = ""] = jpegDataUrl.split(",");

  return {
    width: canvas.width,
    height: canvas.height,
    bytes: base64ToUint8Array(base64Data),
  };
};

const buildFallbackCompanyLogo = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 220;

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.beginPath();
  context.arc(110, 110, 96, 0, Math.PI * 2);
  context.fillStyle = "#2563eb";
  context.fill();

  context.beginPath();
  context.arc(110, 110, 90, 0, Math.PI * 2);
  context.strokeStyle = "#1d4ed8";
  context.lineWidth = 4;
  context.stroke();

  context.font = "bold 92px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillStyle = "#ffffff";
  context.fillText("B", 88, 114);

  context.fillStyle = "#facc15";
  context.fillText("S", 136, 114);

  return canvasToPdfImage(canvas);
};

const loadPdfLogoImage = async () => {
  if (typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const targetHeight = 170;
      const ratio = image.width / image.height || 1;
      const canvas = document.createElement("canvas");
      canvas.height = targetHeight;
      canvas.width = Math.max(1, Math.round(targetHeight * ratio));

      const context = canvas.getContext("2d");
      if (!context) {
        resolve(buildFallbackCompanyLogo());
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvasToPdfImage(canvas));
    };
    image.onerror = () => resolve(buildFallbackCompanyLogo());
    image.src = buyAndSellLogo;
  });
};

const estimatePdfTextWidth = (text, fontSize) => {
  const value = String(text || "");
  let units = 0;

  for (const char of value) {
    if (char === " ") {
      units += 0.28;
    } else if ("ilIjtfr".includes(char)) {
      units += 0.22;
    } else if ("mwMW@#%&".includes(char)) {
      units += 0.9;
    } else if (/[A-Z0-9]/.test(char)) {
      units += 0.62;
    } else if (/[.,:;|]/.test(char)) {
      units += 0.2;
    } else if (/[-_'`]/.test(char)) {
      units += 0.26;
    } else {
      units += 0.5;
    }
  }

  return units * fontSize;
};

const buildPdfTextLine = (line, pageWidth, margin) => {
  const fontKey = line.bold ? "F2" : "F1";
  const fontSize = line.fontSize || 12;
  const textWidth = estimatePdfTextWidth(line.text, fontSize);
  let x = margin;

  if (line.align === "center") {
    x = Math.max(margin, (pageWidth - textWidth) / 2);
  } else if (line.align === "right") {
    x = Math.max(margin, pageWidth - margin - textWidth);
  }

  const colorCmd = line.color
    ? `${line.color} rg\n`
    : "0 0 0 rg\n";

  return `BT\n${colorCmd}/${fontKey} ${fontSize} Tf\n1 0 0 1 ${x.toFixed(2)} ${line.y.toFixed(2)} Tm\n(${escapePdfText(
    line.text
  )}) Tj\nET`;
};

const buildPdfDrawCommands = (drawOps) => {
  return drawOps
    .map((op) => {
      if (op.type === "rect") {
        return `${op.color} rg\n${op.x.toFixed(2)} ${op.y.toFixed(2)} ${op.w.toFixed(2)} ${op.h.toFixed(2)} re\nf`;
      }
      if (op.type === "line") {
        return `${op.color} RG\n${op.lineWidth || 1} w\n${op.x1.toFixed(2)} ${op.y1.toFixed(2)} m\n${op.x2.toFixed(2)} ${op.y2.toFixed(2)} l\nS`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
};

const createPdfBlob = (title, blocks, logoImage = null) => {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 55;
  const bottomMargin = 60;
  const logoRenderWidth = 130;
  const pages = [];
  let currentPage = [];
  let currentPageDrawOps = [];
  const allDrawOps = [];
  const firstPageTopOffset = logoImage ? 175 : 88;
  const regularPageTopOffset = 72;
  let y = pageHeight - firstPageTopOffset;

  const pushPage = () => {
    if (currentPage.length > 0 || currentPageDrawOps.length > 0) {
      pages.push(currentPage);
      allDrawOps.push(currentPageDrawOps);
      currentPage = [];
      currentPageDrawOps = [];
    }
    y = pageHeight - regularPageTopOffset;
  };

  // First page: decorative header bar
  if (logoImage) {
    currentPageDrawOps.push(
      { type: "rect", x: 0, y: pageHeight - 8, w: pageWidth, h: 8, color: "0.145 0.388 0.922" }
    );
  }

  blocks.forEach((block, blockIndex) => {
    const lines = wrapPdfText(block.text, block.maxChars || 92);
    const lineHeight = block.lineHeight || Math.round((block.fontSize || 12) * 1.4);
    const spaceBefore = block.spaceBefore || 0;
    const spaceAfter = block.spaceAfter || 0;
    let requiredHeight = spaceBefore + lines.length * lineHeight + spaceAfter;

    // Keep section headers with at least some of their following content
    if (block.highlightBand && blockIndex < blocks.length - 1) {
      const nextBlock = blocks[blockIndex + 1];
      const nextLineHeight = nextBlock.lineHeight || Math.round((nextBlock.fontSize || 12) * 1.4);
      const nextLines = wrapPdfText(nextBlock.text, nextBlock.maxChars || 92);
      const minFollowingLines = Math.min(3, nextLines.length);
      requiredHeight += (nextBlock.spaceBefore || 0) + minFollowingLines * nextLineHeight;
    }

    if (y - requiredHeight < bottomMargin) {
      pushPage();
    }

    // Horizontal rule before block (drawn before spaceBefore gap)
    if (block.hrBefore) {
      currentPageDrawOps.push({
        type: "line",
        x1: margin,
        y1: y - 2,
        x2: pageWidth - margin,
        y2: y - 2,
        color: "0.82 0.82 0.82",
        lineWidth: 0.5,
      });
    }

    y -= spaceBefore;

    // Section header highlight band
    if (block.highlightBand) {
      const bandHeight = lines.length * lineHeight + 6;
      currentPageDrawOps.push({
        type: "rect",
        x: margin - 6,
        y: y - bandHeight + lineHeight - 1,
        w: pageWidth - 2 * margin + 12,
        h: bandHeight + 2,
        color: "0.941 0.945 0.973",
      });
    }

    lines.forEach((line) => {
      if (y - lineHeight < bottomMargin) {
        pushPage();
      }

      currentPage.push({
        text: line,
        y,
        fontSize: block.fontSize || 12,
        bold: !!block.bold,
        align: block.align || "left",
        color: block.color || null,
      });
      y -= lineHeight;
    });

    // Horizontal rule after block
    if (block.hrAfter) {
      currentPageDrawOps.push({
        type: "line",
        x1: margin,
        y1: y + 2,
        x2: pageWidth - margin,
        y2: y + 2,
        color: block.hrColor || "0.82 0.82 0.82",
        lineWidth: block.hrWidth || 0.5,
      });
    }

    y -= spaceAfter;
  });

  pushPage();

  const totalPageCount = pages.length;
  const objects = [];
  const addObject = (content) => {
    objects.push(content instanceof Uint8Array ? content : encodePdfString(content));
    return objects.length;
  };

  const fontObjectId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>");
  const fontBoldObjectId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>");
  const fontHelveticaId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const imageObjectId = logoImage
    ? addObject(
      concatPdfBytes(
        encodePdfString(
          `<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoImage.bytes.length} >>\nstream\n`
        ),
        logoImage.bytes,
        encodePdfString("\nendstream")
      )
    )
    : null;
  const pagesKids = [];

  pages.forEach((pageLines, currentPageIndex) => {
    const drawOps = allDrawOps[currentPageIndex] || [];

    // Top accent bar on every page
    if (currentPageIndex > 0) {
      drawOps.unshift(
        { type: "rect", x: 0, y: pageHeight - 5, w: pageWidth, h: 5, color: "0.145 0.388 0.922" }
      );
    }

    // Page footer line and page number
    drawOps.push({
      type: "line",
      x1: margin,
      y1: 38,
      x2: pageWidth - margin,
      y2: 38,
      color: "0.82 0.82 0.82",
      lineWidth: 0.5,
    });

    const drawStream = buildPdfDrawCommands(drawOps);

    // Diagonal watermark to prevent document piracy
    const wmText = "ANNOUNCEMENT AFRICA LTD";
    const wmAngle = 35 * (Math.PI / 180);
    const wmCos = Math.cos(wmAngle).toFixed(4);
    const wmSin = Math.sin(wmAngle).toFixed(4);
    const wmStream = [
      "q",
      "BT",
      "0.93 0.93 0.93 rg",
      `/F2 36 Tf`,
      `${wmCos} ${wmSin} -${wmSin} ${wmCos} 80.00 280.00 Tm`,
      `(${escapePdfText(wmText)}) Tj`,
      "ET",
      "BT",
      "0.94 0.94 0.94 rg",
      `/F2 18 Tf`,
      `${wmCos} ${wmSin} -${wmSin} ${wmCos} 130.00 220.00 Tm`,
      `(${escapePdfText("Inyandiko y'ubucuruzi - Ntiyemerewe gukoporwa")}) Tj`,
      "ET",
      "Q",
    ].join("\n");

    const headerStream =
      logoImage && currentPageIndex === 0
        ? `q\n${logoRenderWidth} 0 0 ${(logoRenderWidth * logoImage.height) / logoImage.width} ${(pageWidth - logoRenderWidth) / 2} ${pageHeight - 150
        } cm\n/Im1 Do\nQ\n`
        : "";

    const footerText = `Page ${currentPageIndex + 1} of ${totalPageCount}`;
    const footerX = (pageWidth - estimatePdfTextWidth(footerText, 9)) / 2;
    const footerStream = `BT\n0.5 0.5 0.5 rg\n/F3 9 Tf\n1 0 0 1 ${footerX.toFixed(2)} 24.00 Tm\n(${escapePdfText(footerText)}) Tj\nET`;

    const contentStream = `${wmStream}\n${drawStream}\n${headerStream}${pageLines
      .map((line) => buildPdfTextLine(line, pageWidth, margin))
      .join("\n")}\n${footerStream}`;

    const contentObjectId = addObject(
      `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`
    );
    const imageResource = imageObjectId ? ` /XObject << /Im1 ${imageObjectId} 0 R >>` : "";
    const pageObjectId = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjectId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R /F2 ${fontBoldObjectId} 0 R /F3 ${fontHelveticaId} 0 R >>${imageResource} >> >>`
    );
    pagesKids.push(pageObjectId);
  });

  const pagesObjectId = addObject(
    `<< /Type /Pages /Kids [${pagesKids.map((id) => `${id} 0 R`).join(" ")}] /Count ${pagesKids.length} >>`
  );

  objects.forEach((object, index) => {
    if (object.includes("/Parent 0 0 R")) {
      objects[index] = object.replace("/Parent 0 0 R", `/Parent ${pagesObjectId} 0 R`);
    }
  });

  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

  const pdfChunks = [encodePdfString("%PDF-1.4\n")];
  const offsets = [0];
  let currentLength = pdfChunks[0].length;

  objects.forEach((object, index) => {
    const prefix = encodePdfString(`${index + 1} 0 obj\n`);
    const suffix = encodePdfString("\nendobj\n");
    offsets.push(currentLength);
    pdfChunks.push(prefix, object, suffix);
    currentLength += prefix.length + object.length + suffix.length;
  });

  const xrefOffset = currentLength;
  const xrefHeader = encodePdfString(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  pdfChunks.push(xrefHeader);
  currentLength += xrefHeader.length;

  for (let i = 1; i <= objects.length; i += 1) {
    const line = encodePdfString(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
    pdfChunks.push(line);
    currentLength += line.length;
  }

  pdfChunks.push(
    encodePdfString(
      `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    )
  );

  return new Blob(pdfChunks, { type: "application/pdf" });
};

const shouldAutoDownloadPdf = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || "";
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  const isSmallTouchDevice =
    window.innerWidth <= 768 && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0;

  return isMobileUserAgent || isSmallTouchDevice;
};

const createPdfParagraphBlocks = (contract, getAssetTypeLabel) => {
  const formData = contract.formData || {};
  const assetType = getAssetTypeLabel(contract);
  const assetDescription = formData.assetDescription || "N/A";
  const agreedPrice = formData.agreedPrice || "N/A";
  const contractPartyRole = formData.contractPartyRole || "";
  const isBuyerContract = contractPartyRole === "buyer";
  const agreementDuration = formData.agreementDuration?.trim() || "";
  const agreementDurationText = agreementDuration
    ? `Aya masezerano azarangira: ${agreementDuration}. Ashobora kongerwa igihe impande zombi zibyumvikanyeho mu nyandiko.`
    : "Aya masezerano nta tariki y'iherezo afite. Ashobora kongerwa igihe impande zombi zibyumvikanyeho mu nyandiko.";
  const sellerName = formData.sellerName || "N/A";
  const sellerPhone = formData.sellerPhone || "N/A";
  const sellerEmail = formData.sellerEmail || "Nta email";
  const sellerAddress = formData.sellerAddress || "N/A";
  const sellerNationalId = formData.sellerNationalId || "";
  const buyerName = formData.buyerName || "N/A";
  const buyerPhone = formData.buyerPhone || "N/A";
  const buyerEmail = formData.buyerEmail || "Nta email";
  const buyerAddress = formData.buyerAddress || "N/A";
  const buyerNationalId = formData.buyerNationalId || "";
  const buyerAgents = Array.isArray(formData.buyerAgents)
    ? formData.buyerAgents.filter((agent) => agent?.fullName || agent?.phone)
    : [];
  const contractDate = contract.createdAt
    ? new Date(contract.createdAt).toLocaleDateString("en-CA")
    : "N/A";
  const contractReference = (contract._id || contract.id || "N/A")
    .toString()
    .slice(-8)
    .toUpperCase();
  const contractSideLabel = isBuyerContract
    ? "Amasezerano y'Umuguzi"
    : "Amasezerano y'Umugurisha";
  const signingPartyLabel = isBuyerContract ? "Umuguzi" : "Umugurisha";
  const signingPartyName = isBuyerContract ? buyerName : sellerName;
  const signingDate = isBuyerContract
    ? formData.buyerSignatureDate || ""
    : formData.sellerSignatureDate || "";

  // Colors for PDF text (R G B values 0-1)
  const INDIGO = "0.188 0.247 0.624";
  const DARK_GRAY = "0.2 0.2 0.2";
  const MED_GRAY = "0.35 0.35 0.35";
  const GOLD = "0.596 0.502 0.102";

  const blocks = [
    {
      text: "ANNOUNCEMENT AFRICA LTD",
      fontSize: 22,
      bold: true,
      align: "center",
      spaceAfter: 5,
      maxChars: 120,
      color: INDIGO,
    },
    {
      text: "Urubuga ruhuza Umugurisha n'Umuguzi kandi rukoroshya ubucuruzi",
      fontSize: 10,
      align: "center",
      spaceAfter: 3,
      maxChars: 140,
      color: MED_GRAY,
    },
    {
      text: "Email: announcementafricaltd@gmail.com  |  Tel: (+250) 788 820 543  |  Kigali - Rwanda",
      fontSize: 10,
      align: "center",
      spaceAfter: 14,
      maxChars: 160,
      color: MED_GRAY,
      hrAfter: true,
      hrColor: "0.796 0.651 0.169",
      hrWidth: 1.2,
    },
    {
      text: "AMASEZERANO Y'UBUCURUZI",
      fontSize: 18,
      bold: true,
      align: "center",
      spaceBefore: 10,
      spaceAfter: 3,
      maxChars: 120,
      color: INDIGO,
    },
    {
      text: "(SALES & PURCHASE AGREEMENT)",
      fontSize: 12,
      bold: true,
      align: "center",
      spaceAfter: 8,
      maxChars: 120,
      color: GOLD,
    },
    {
      text: contractSideLabel,
      fontSize: 11,
      bold: true,
      align: "center",
      spaceAfter: 6,
      maxChars: 140,
      color: DARK_GRAY,
    },
    {
      text: `Umutwe w'Amasezerano: ${contract.itemName}`,
      fontSize: 10,
      bold: true,
      align: "center",
      spaceAfter: 4,
      maxChars: 80,
      color: DARK_GRAY,
    },
    {
      text: `Nimero y'Inyandiko: AAC-${contractReference}       Itariki: ${contractDate}`,
      fontSize: 10,
      align: "center",
      spaceAfter: 18,
      maxChars: 160,
      color: MED_GRAY,
      hrAfter: true,
    },
    {
      text: "1. ABO AMASEZERANO AGENDA",
      fontSize: 13,
      bold: true,
      spaceAfter: 8,
      color: INDIGO,
      highlightBand: true,
    },
    {
      text: "Company / Platform: Announcement Africa Ltd.",
      fontSize: 12,
      spaceAfter: 4,
      maxChars: 95,
    },
    {
      text: "Inshingano: Guhuza Umugurisha n'Umuguzi, no koroshya itumanaho n'ubucuruzi.",
      fontSize: 12,
      spaceAfter: 10,
      maxChars: 95,
      lineHeight: 17,
    },
    ...(isBuyerContract
      ? [
          {
            text: "Umuguzi",
            fontSize: 12,
            bold: true,
            spaceAfter: 4,
          },
          {
            text: `Amazina: ${buyerName}`,
            fontSize: 12,
            spaceAfter: 3,
            maxChars: 95,
          },
          {
            text: `Telefoni: ${buyerPhone}`,
            fontSize: 12,
            spaceAfter: 3,
            maxChars: 95,
          },
          {
            text: `Email: ${buyerEmail}`,
            fontSize: 12,
            spaceAfter: 3,
            maxChars: 95,
          },
          {
            text: `Aderesi: ${buyerAddress}`,
            fontSize: 12,
            spaceAfter: buyerNationalId ? 3 : 16,
            maxChars: 95,
          },
          ...(buyerNationalId
            ? [
                {
                  text: `Nomero y'indangamuntu: ${buyerNationalId}`,
                  fontSize: 12,
                  spaceAfter: 16,
                  maxChars: 95,
                },
              ]
            : []),
        ]
      : [
          {
            text: "Umugurisha",
            fontSize: 12,
            bold: true,
            spaceAfter: 4,
          },
          {
            text: `Amazina: ${sellerName}`,
            fontSize: 12,
            spaceAfter: 3,
            maxChars: 95,
          },
          {
            text: `Telefoni: ${sellerPhone}`,
            fontSize: 12,
            spaceAfter: 3,
            maxChars: 95,
          },
          {
            text: `Email: ${sellerEmail}`,
            fontSize: 12,
            spaceAfter: 3,
            maxChars: 95,
          },
          {
            text: `Aderesi: ${sellerAddress}`,
            fontSize: 12,
            spaceAfter: sellerNationalId ? 3 : 16,
            maxChars: 95,
          },
          ...(sellerNationalId
            ? [
                {
                  text: `Nomero y'indangamuntu: ${sellerNationalId}`,
                  fontSize: 12,
                  spaceAfter: 16,
                  maxChars: 95,
                },
              ]
            : []),
        ]),
    {
      text: isBuyerContract
        ? "2. UMUTUNGO/IGICURUZWA USHAKA KUGURA"
        : "2. UMUTUNGO/IGICURUZWA USHAKA KUGURISHA",
      fontSize: 13,
      bold: true,
      spaceBefore: 10,
      spaceAfter: 8,
      color: INDIGO,
      highlightBand: true,
      hrBefore: true,
    },
    {
      text: `Ubwoko: ${assetType}`,
      fontSize: 12,
      spaceAfter: 6,
      maxChars: 95,
    },
    {
      text: `Ibisobanuro by'umutungo/igicuruzwa naho giherereye: ${assetDescription}`,
      fontSize: 12,
      spaceAfter: 18,
      maxChars: 95,
      lineHeight: 18,
    },
  ];

  if (isBuyerContract) {
    blocks.push(
      {
        text: "3. INTEGO Y'AYA MASEZERANO",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Aya masezerano agamije kwemeza ko Announcement Africa Ltd izafasha umuguzi mu bikorwa bikurikira: kumushakira umutungo akeneye; kumwereka imitungo iri kugurishwa; kumuhuza na nyir'umutungo; no koroshya ibiganiro by'ubucuruzi hagati y'umuguzi na nyir'umutungo. Announcement Africa Ltd ikora nk'umuhuza hagati y'umuguzi na nyir'umutungo.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "4. IGICIRO CY'UMUTUNGO/IGICURUZWA",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: `Igiciro cyanditswe: ${agreedPrice} RWF. Nyirubwite yakongera cyangwa akagabanya igiciro.`,
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "5. IGIHEMBO CYA SOSIYETE",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Umuguzi yemera ko mu gihe aguze umutungo yeretswe, yamenyeshejwe cyangwa yahujweho na Announcement Africa Ltd, sosiyete ifite uburenganzira bwo kubona commission cyangwa service fee nk'uko byumvikanyweho hagati yayo n'umuguzi cyangwa hakurikijwe imikoranire y'ubucuruzi yarebaga uwo mutungo.",
        fontSize: 12,
        spaceAfter: 8,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "Umuguzi ntiyemerewe kugura umutungo yeretswe na sosiyete ayirenze cyangwa ayihishe agamije kwirinda kwishyura igihembo cya sosiyete.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "6. UBURENGANZIRA BWA SOSIYETE KU GIHEMBO CYAYO",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Mu gihe umuguzi aguze umutungo yeretswe, yamenyeshejwe cyangwa yahujweho na Announcement Africa Ltd mu gihe aya masezerano akiriho cyangwa nyuma yayo, kandi bikagaragara ko uwo mutungo yawumenye binyuze kuri iyo sosiyete, Announcement Africa Ltd izakomeza kugira uburenganzira ku gihembo cyayo.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "7. INSHINGANO Z'UMUGUZI",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Umuguzi yemera gukoresha amakuru yahawe na sosiyete mu buryo bwemewe; kutarenga sosiyete mu kuvugana na nyir'umutungo agamije kuyikwepa; gutanga amakuru y'ukuri ku bushobozi bwe bwo kugura; no gukorana na sosiyete mu mucyo no mu bwubahane.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "8. IGENZURA RY'UMUTUNGO",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Umuguzi yemera ko afite inshingano zo gukora igenzura ryuzuye ku mutungo mbere yo kuwugura. Iryo genzura ririmo ariko ntirigarukira ku gusuzuma ibyangombwa by'umutungo; kugenzura niba nta bibazo by'amategeko cyangwa amakimbirane uwuriho; no gusuzuma imiterere, agaciro n'ubwizerwe bw'uyu mutungo.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "9. GUSESA AMASEZERANO",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Buri ruhande rushobora gusesa aya masezerano rubimenyesheje urundi mu nyandiko mbere y'igihe cyumvikanyweho cyangwa hakurikijwe ibiteganywa n'andi masezerano hagati y'impande zombi. Gusesa aya masezerano ntibikuraho uburenganzira bwa sosiyete ku gihembo cyayo niba yarabonye cyangwa yaramenyekanishije umuguzi mbere y'iseswa ryayo.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "10. AMATEGEKO AZAKURIKIZWA",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Aya masezerano azubahirizwa kandi asobanurwe hakurikijwe amategeko agenga ubucuruzi n'imitungo itimukanwa mu Repubulika y'u Rwanda.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "11. GUKEMURA AMAKIMBIRANE",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Impande zombi zizabanza gushaka gukemura amakimbirane mu bwumvikane. Mu gihe bidashobotse, amakimbirane azashyikirizwa inzego zibifitiye ububasha mu Rwanda.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "12. ABA AGENTS BAFASHIJE KUBONA UMUTUNGO",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Abantu bakurikira ni aba agents cyangwa abafatanyabikorwa bafashije Announcement Africa Ltd kubona cyangwa kumenyekanisha uyu mutungo. Aba agent bemera ko bakoranye na Announcement Africa Ltd mu kumenyekanisha cyangwa kubona uyu mutungo. Announcement Africa Ltd ni yo yonyine ifite uburenganzira bwo kugena uburyo igihembo cyangwa inyungu ishobora kugabanwa hagati yayo n'aba agent, hashingiwe ku mategeko no ku mabwiriza y'imbere muri sosiyete. Kugaragaza aba agent muri aya masezerano ntibibaha uburenganzira bwo gusinyira sosiyete cyangwa gufata ibyemezo mu izina rya Announcement Africa Ltd, keretse babiherewe ububasha bwanditse.",
        fontSize: 12,
        spaceAfter: buyerAgents.length ? 10 : 18,
        maxChars: 95,
        lineHeight: 18,
      },
      ...buyerAgents.flatMap((agent, index) => [
        {
          text: `Agent ${index + 1}`,
          fontSize: 12,
          bold: true,
          spaceAfter: 4,
          maxChars: 40,
        },
        {
          text: `Amazina: ${agent.fullName || "N/A"}`,
          fontSize: 12,
          spaceAfter: 3,
          maxChars: 95,
        },
        {
          text: `Telefoni: ${agent.phone || "N/A"}`,
          fontSize: 12,
          spaceAfter: 3,
          maxChars: 95,
        },
        {
          text: "Umukono: ________________________________",
          fontSize: 12,
          spaceAfter: 10,
          maxChars: 95,
        },
      ])
    );
  } else {
    blocks.push(
      {
        text: "3. UBURENGANZIRA BWA SOSIYETE",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Nyir'umutungo aha Announcement Africa Ltd uburenganzira bwo kwamamaza umutungo, kuwumurikira abaguzi, gushakira umutungo umuguzi no koroshya ibiganiro by'ubucuruzi. Sosiyete ifite uburenganzira bwo gushakira umutungo umuguzi ku giciro kirenze icyo nyir'umutungo yagaragaje.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "4. IGICIRO CY'UMUTUNGO/IGICURUZWA",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: `Nyir'umutungo yemera ko igiciro cy'umutungo we atifuza ko kijya munsi ya ${agreedPrice} RWF. Aya mafaranga ni yo nyir'umutungo azahabwa nyuma y'igurishwa ry'umutungo, atabariwemo amafaranga y'igihembo cya sosiyete.`,
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "5. AMAFARANGA Y'IGIHEMBO CYA SOSIYETE",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Nyir'umutungo yemera ko amafaranga yose azarenga ku giciro cyavuzwe haruguru (Owner Net Price) azaba ari igihembo cya Announcement Africa Ltd. Aya mafaranga y'inyongera azagenwa na sosiyete hashingiwe ku buryo bwo kwamamaza, gushaka umuguzi no ku mbaraga zakoreshejwe mu buhuza. Nyir'umutungo ntazabaza, ntazavuguruza kandi nta burenganzira azagira ku mafaranga yose azarenga ku giciro yashyizeho.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "6. KUTAVANGIRA IGIHEMBO CYA SOSIYETE",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Nyir'umutungo yemera ko amafaranga ye azaba ari ayo yashyizeho gusa; amafaranga yose azarenga kuri ayo azaba ari uburenganzira bwa sosiyete; kandi nyir'umutungo atazabaza cyangwa ngo agene igihembo cya sosiyete.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "7. UKURI KW'AMAKURU N'UBURENGANZIRA KU MUTUNGO",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Nyir'umutungo yemera ko ari we nyir'umutungo wemewe n'amategeko cyangwa afite uburenganzira bwo kuwugurisha; ko amakuru yose yatanze kuri uwo mutungo ari ukuri; kandi ko azatanga ibyangombwa byose bisabwa igihe bikenewe. Announcement Africa Ltd ntizaryozwa ibibazo by'amategeko cyangwa amakimbirane ajyanye n'uburenganzira kuri uwo mutungo mu gihe byaturutse ku makuru cyangwa ibyangombwa byatanzwe na nyir'umutungo.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "8. IGIHE AYA MASEZERANO AZAMARA",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: agreementDurationText,
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "9. GUSESA AMASEZERANO",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Buri ruhande rushobora gusesa aya masezerano rubimenyesheje urundi mu nyandiko mbere y'igihe cyumvikanyweho cyangwa hakurikijwe ibiteganywa n'andi masezerano hagati y'impande zombi. Gusesa aya masezerano ntibikuraho uburenganzira bwa sosiyete ku gihembo cyayo niba yarabonye cyangwa yaramenyekanishije umuguzi mbere y'iseswa ryayo.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "10. AMATEGEKO AZAKURIKIZWA",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Aya masezerano azubahirizwa kandi asobanurwe hakurikijwe amategeko agenga ubucuruzi n'imitungo itimukanwa mu Repubulika y'u Rwanda.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "11. GUKEMURA AMAKIMBIRANE",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Impande zombi zizabanza gushaka gukemura amakimbirane mu bwumvikane. Mu gihe bidashobotse, amakimbirane azashyikirizwa inzego zibifitiye ububasha mu Rwanda.",
        fontSize: 12,
        spaceAfter: 18,
        maxChars: 95,
        lineHeight: 18,
      },
      {
        text: "12. ABA AGENTS BAFASHIJE KUBONA UMUTUNGO",
        fontSize: 13,
        bold: true,
        spaceBefore: 10,
        spaceAfter: 8,
        color: INDIGO,
        highlightBand: true,
        hrBefore: true,
      },
      {
        text: "Abantu bakurikira ni aba agents cyangwa abafatanyabikorwa bafashije Announcement Africa Ltd kubona cyangwa kumenyekanisha uyu mutungo.",
        fontSize: 12,
        spaceAfter: buyerAgents.length ? 10 : 18,
        maxChars: 95,
        lineHeight: 18,
      },
      ...buyerAgents.flatMap((agent, index) => [
        {
          text: `Agent ${index + 1}`,
          fontSize: 12,
          bold: true,
          spaceAfter: 4,
          maxChars: 40,
        },
        {
          text: `Amazina: ${agent.fullName || "N/A"}`,
          fontSize: 12,
          spaceAfter: 3,
          maxChars: 95,
        },
        {
          text: `Telefoni: ${agent.phone || "N/A"}`,
          fontSize: 12,
          spaceAfter: 3,
          maxChars: 95,
        },
        {
          text: "Umukono: ________________________________",
          fontSize: 12,
          spaceAfter: 10,
          maxChars: 95,
        },
      ])
    );
  }

  blocks.push(
    {
      text: "AMAKURU Y'INYANDIKO MURI SISITEMU",
      fontSize: 11,
      bold: true,
      spaceAfter: 6,
      color: INDIGO,
      hrBefore: true,
      spaceBefore: 14,
    },
    {
      text: "Aya masezerano yabitswe mu buryo bw'ikoranabuhanga muri sisitemu ya Announcement Africa Ltd nk'inyandiko y'ubucuruzi bwatanzwe binyuze kuri website.",
      fontSize: 11,
      spaceAfter: 20,
      maxChars: 96,
      lineHeight: 16,
    },
    {
      text: "UMUKONO",
      fontSize: 13,
      bold: true,
      spaceBefore: 12,
      spaceAfter: 10,
      color: INDIGO,
      highlightBand: true,
      hrBefore: true,
    },
    {
      text: `${signingPartyLabel}: ${signingPartyName}`,
      fontSize: 12,
      bold: true,
      spaceAfter: 6,
      maxChars: 96,
    },
    {
      text: "Umukono: ________________________________",
      fontSize: 12,
      spaceAfter: 6,
      maxChars: 96,
    },
    {
      text: `Itariki: ${signingDate || "________________"}`,
      fontSize: 12,
      spaceAfter: 14,
      maxChars: 96,
    },
    {
      text: "Uhagarariye Announcement Africa Ltd",
      fontSize: 12,
      bold: true,
      spaceAfter: 6,
      maxChars: 96,
    },
    {
      text: "Amazina: ________________________________",
      fontSize: 12,
      spaceAfter: 6,
      maxChars: 96,
    },
    {
      text: "Umukono: ________________________________",
      fontSize: 12,
      spaceAfter: 6,
      maxChars: 96,
    },
    {
      text: "Itariki: ________________",
      fontSize: 12,
      spaceAfter: 8,
      maxChars: 96,
    }
  );

  return blocks;
};

const SignedContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [editingContract, setEditingContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [filters, setFilters] = useState({
    signedDate: "",
    assetType: "all",
  });

  const loadContracts = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setContracts([]);
      setError("Nta token ya admin yabonetse.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${apiBaseUrl}/api/signed-contracts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Could not load signed contracts");
      }
      setContracts(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.warn("Could not read signed contracts", error);
      setContracts([]);
      setError(error.message || "Ntibyakunze kuzana amasezerano.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleDelete = async (contractId) => {
    const confirmed = window.confirm(
      "Urashaka koko gusiba aya masezerano?"
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBaseUrl}/api/signed-contracts/${contractId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Could not delete contract");
      }
      setContracts((prev) =>
        prev.filter((contract) => (contract._id || contract.id) !== contractId)
      );
    } catch (error) {
      console.warn("Delete contract failed", error);
      setError(error.message || "Ntibyakunze gusiba amasezerano.");
    }
  };

  const handleEditOpen = (contract) => {
    setEditingContract(contract);
  };

  const handleEditSave = async (updatedRecord) => {
    try {
      const token = localStorage.getItem("token");
      const contractId = editingContract?._id || editingContract?.id;
      const payload = {
        ...updatedRecord,
        itemId: editingContract?.itemId || null,
        itemName: buildContractTitle(
          updatedRecord.formData,
          updatedRecord.formData?.assetDescription || editingContract?.itemName
        ),
        itemType: updatedRecord.itemType || editingContract?.itemType,
        price: updatedRecord.price || editingContract?.price,
      };

      const response = await fetch(`${apiBaseUrl}/api/signed-contracts/${contractId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Could not update contract");
      }

      setContracts((prev) =>
        prev.map((contract) =>
          (contract._id || contract.id) === contractId ? result.data : contract
        )
      );
      setEditingContract(null);
    } catch (error) {
      console.warn("Update contract failed", error);
      setError(error.message || "Ntibyakunze guhindura amasezerano.");
      throw error;
    }
  };

  const handleEditClose = () => {
    setEditingContract(null);
  };

  const getAssetTypeLabel = (contract) => {
    return contract.formData?.assetType === "Ibindi"
      ? contract.formData?.otherAssetType || "Ibindi"
      : contract.formData?.assetType || contract.itemType || "N/A";
  };

  const getPaymentMethodLabel = (contract) => {
    return contract.formData?.paymentMethod === "Ubundi"
      ? contract.formData?.otherPaymentMethod || "Ubundi"
      : contract.formData?.paymentMethod || "N/A";
  };

  const getContractRoleLabel = (contract) =>
    contract.formData?.contractPartyRole === "buyer"
      ? "Umuguzi"
      : contract.formData?.contractPartyRole === "seller"
        ? "Umugurisha"
        : "N/A";

  const handleDownloadPdf = async (contract) => {
    const pdfBlocks = createPdfParagraphBlocks(
      contract,
      getAssetTypeLabel,
      getPaymentMethodLabel
    );
    const logoImage = await loadPdfLogoImage();
    const pdfBlob = createPdfBlob(contract.itemName, pdfBlocks, logoImage);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const filename = `${contract.itemName.replace(/[^a-z0-9]+/gi, "_")}.pdf`;
    const link = document.createElement("a");

    link.href = pdfUrl;
    document.body.appendChild(link);

    if (shouldAutoDownloadPdf()) {
      link.download = filename;
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      return;
    }

    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  const filteredContracts = contracts.filter((contract) => {
    const contractAssetType =
      contract.formData?.assetType === "Ibindi"
        ? contract.formData?.otherAssetType || "Ibindi"
        : contract.formData?.assetType || contract.itemType || "";

    const contractSignedDate = contract.formData?.buyerSignatureDate || "";

    const matchesAssetType =
      filters.assetType === "all" || contractAssetType === filters.assetType;
    const matchesSignedDate =
      !filters.signedDate || contractSignedDate === filters.signedDate;

    return matchesAssetType && matchesSignedDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize));
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Signed Contracts</h1>
            <p className="text-sm text-gray-500 mt-1">
              Amasezerano yoherejwe abikwa hano avuye kuri form ya website.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold">
            <FileText className="h-4 w-4" />
            {contracts.length} total
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signed Date
            </label>
            <input
              type="date"
              value={filters.signedDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, signedDate: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Type
            </label>
            <select
              value={filters.assetType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, assetType: e.target.value }))
              }
              className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
            >
              <option value="all">All Asset Types</option>
              <option value="Inzu">Inzu</option>
              <option value="Ikibanza">Ikibanza</option>
              <option value="Imodoka">Imodoka</option>
              <option value="Ibindi">Ibindi</option>
            </select>
            <div className="absolute inset-y-0 right-0 top-7 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Size
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <div className="absolute inset-y-0 right-0 top-7 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFilters({ signedDate: "", assetType: "all" })}
            className="bg-gray-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-gray-700 text-sm md:text-base whitespace-nowrap"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-10 text-center text-gray-500">
          Birimo kuzana amasezerano...
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">
            Nta masezerano arinjira hano
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Amasezerano yose yoherejwe azahita agaragara hano.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden">
          <div className="block lg:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {paginatedContracts.map((contract) => (
                <div
                  key={contract._id || contract.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {contract.itemName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {getAssetTypeLabel(contract)}
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                        {contract.status === "submitted" ? "Yoherejwe" : contract.status}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">
                          Uruhande
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getContractRoleLabel(contract)}
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                          Seller
                        </div>
                        <div className="text-gray-900">{contract.formData?.sellerName || "N/A"}</div>
                        <div className="text-gray-500">{contract.formData?.sellerPhone || "N/A"}</div>
                        <div className="text-xs text-gray-500">
                          {contract.formData?.sellerAddress || "N/A"}
                        </div>
                        {contract.formData?.sellerNationalId && (
                          <div className="text-xs text-gray-500">
                            ID: {contract.formData.sellerNationalId}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 break-all">
                          {contract.formData?.sellerEmail || "Nta email"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                          Buyer
                        </div>
                        <div className="text-gray-900">{contract.formData?.buyerName || "N/A"}</div>
                        <div className="text-gray-500">{contract.formData?.buyerPhone || "N/A"}</div>
                        <div className="text-xs text-gray-500">
                          {contract.formData?.buyerAddress || "N/A"}
                        </div>
                        {contract.formData?.buyerNationalId && (
                          <div className="text-xs text-gray-500">
                            ID: {contract.formData.buyerNationalId}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 break-all">
                          {contract.formData?.buyerEmail || "Nta email"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                          Ibisobanuro by'umutungo
                        </div>
                        <div className="text-gray-700 text-sm">
                          {contract.formData?.assetDescription || "N/A"}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-1 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-700">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="truncate">
                            {contract.formData?.agreedPrice || contract.price || "Nta giciro"}
                          </span>
                        </div>
                        {contract.formData?.agreementDuration && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{contract.formData.agreementDuration}</span>
                          </div>
                        )}
                        {Array.isArray(contract.formData?.buyerAgents) &&
                          contract.formData.buyerAgents.some(
                            (agent) => agent?.fullName || agent?.phone
                          ) && (
                            <div className="text-xs text-gray-500">
                              Agents:{" "}
                              {contract.formData.buyerAgents
                                .filter((agent) => agent?.fullName || agent?.phone)
                                .map((agent) => agent.fullName || agent.phone)
                                .join(", ")}
                            </div>
                          )}
                        <div className="text-xs text-gray-500">
                          Posted: {new Date(contract.createdAt).toLocaleDateString()} {new Date(contract.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleDownloadPdf(contract)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditOpen(contract)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contract._id || contract.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    CONTRACT
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    SELLER
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    BUYER
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    PAYMENT
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    STATUS
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    POSTED
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-500">No contracts found</div>
                    </td>
                  </tr>
                ) : paginatedContracts.map((contract) => (
                  <tr key={contract._id || contract.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[220px]">
                            {contract.itemName}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-[220px]">
                            {getAssetTypeLabel(contract)}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-[220px]">
                            {getContractRoleLabel(contract)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contract.formData?.sellerName || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.formData?.sellerPhone || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[180px]">
                        {contract.formData?.sellerAddress || "N/A"}
                      </div>
                      {contract.formData?.sellerNationalId && (
                        <div className="text-xs text-gray-400 truncate max-w-[180px]">
                          ID: {contract.formData.sellerNationalId}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 truncate max-w-[160px]">
                        {contract.formData?.sellerEmail || "Nta email"}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contract.formData?.buyerName || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.formData?.buyerPhone || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[180px]">
                        {contract.formData?.buyerAddress || "N/A"}
                      </div>
                      {contract.formData?.buyerNationalId && (
                        <div className="text-xs text-gray-400 truncate max-w-[180px]">
                          ID: {contract.formData.buyerNationalId}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 truncate max-w-[160px]">
                        {contract.formData?.buyerEmail || "Nta email"}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contract.formData?.agreedPrice || contract.price || "Nta giciro"}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[180px]">
                        {contract.formData?.assetDescription || "N/A"}
                      </div>
                      {contract.formData?.agreementDuration && (
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {contract.formData.agreementDuration}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {contract.status === "submitted" ? "Yoherejwe" : contract.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(contract.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDownloadPdf(contract)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditOpen(contract)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contract._id || contract.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {filteredContracts.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex justify-center sm:justify-end space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ContractModal
        isOpen={Boolean(editingContract)}
        onClose={handleEditClose}
        item={null}
        itemType={editingContract?.itemType || "General"}
        initialData={
          editingContract
            ? {
                ...editingContract,
                ...emptyContractForm,
                ...editingContract.formData,
                agreeToTerms: editingContract.formData?.agreeToTerms ?? true,
              }
            : emptyContractForm
        }
        onSubmitContract={handleEditSave}
        submitLabel="Save Changes"
        title="Edit Contract"
      />
    </div>
  );
};

export default SignedContracts;
