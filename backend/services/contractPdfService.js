/**
 * Backend PDF generator — produces the EXACT same contract PDF as the
 * admin‑panel download in SignedContracts.js (frontend).
 *
 * No logo image is embedded on the server side (no canvas/DOM), but every
 * other visual element is identical: colored section headers, highlight
 * bands, horizontal rules, watermark, page footers, orphan‑heading prevention.
 */

const escapePdfText = (text = '') =>
  String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const wrapPdfText = (text, maxChars = 92) => {
  const words = String(text || '')
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let current = '';

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

const estimatePdfTextWidth = (text, fontSize) => {
  const value = String(text || '');
  let units = 0;

  for (const char of value) {
    if (char === ' ') {
      units += 0.28;
    } else if ('ilIjtfr'.includes(char)) {
      units += 0.22;
    } else if ('mwMW@#%&'.includes(char)) {
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
  const fontKey = line.bold ? 'F2' : 'F1';
  const fontSize = line.fontSize || 12;
  const textWidth = estimatePdfTextWidth(line.text, fontSize);
  let x = margin;

  if (line.align === 'center') {
    x = Math.max(margin, (pageWidth - textWidth) / 2);
  } else if (line.align === 'right') {
    x = Math.max(margin, pageWidth - margin - textWidth);
  }

  const colorCmd = line.color ? `${line.color} rg\n` : '0 0 0 rg\n';

  return `BT\n${colorCmd}/${fontKey} ${fontSize} Tf\n1 0 0 1 ${x.toFixed(2)} ${line.y.toFixed(
    2
  )} Tm\n(${escapePdfText(line.text)}) Tj\nET`;
};

const buildPdfDrawCommands = (drawOps) => {
  return drawOps
    .map((op) => {
      if (op.type === 'rect') {
        return `${op.color} rg\n${op.x.toFixed(2)} ${op.y.toFixed(2)} ${op.w.toFixed(2)} ${op.h.toFixed(2)} re\nf`;
      }
      if (op.type === 'line') {
        return `${op.color} RG\n${op.lineWidth || 1} w\n${op.x1.toFixed(2)} ${op.y1.toFixed(
          2
        )} m\n${op.x2.toFixed(2)} ${op.y2.toFixed(2)} l\nS`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
};

/* ─── Content blocks (identical to frontend createPdfParagraphBlocks) ─── */

const createPdfParagraphBlocks = (contract) => {
  const formData = contract.formData || {};

  const getAssetTypeLabel = () =>
    formData.assetType === 'Ibindi'
      ? formData.otherAssetType || 'Ibindi'
      : formData.assetType || contract.itemType || 'N/A';

  const assetType = getAssetTypeLabel();
  const assetDescription = formData.assetDescription || 'N/A';
  const agreedPrice = formData.agreedPrice || 'N/A';
  const contractPartyRole = formData.contractPartyRole || '';
  const isBuyerContract = contractPartyRole === 'buyer';
  const agreementDuration = (formData.agreementDuration || '').trim();
  const agreementDurationText = agreementDuration
    ? `Aya masezerano azarangira: ${agreementDuration}. Ashobora kongerwa igihe impande zombi zibyumvikanyeho mu nyandiko.`
    : "Aya masezerano nta tariki y'iherezo afite. Ashobora kongerwa igihe impande zombi zibyumvikanyeho mu nyandiko.";
  const sellerName = formData.sellerName || 'N/A';
  const sellerPhone = formData.sellerPhone || 'N/A';
  const sellerEmail = formData.sellerEmail || 'Nta email';
  const sellerAddress = formData.sellerAddress || 'N/A';
  const sellerNationalId = formData.sellerNationalId || '';
  const buyerName = formData.buyerName || 'N/A';
  const buyerPhone = formData.buyerPhone || 'N/A';
  const buyerEmail = formData.buyerEmail || 'Nta email';
  const buyerAddress = formData.buyerAddress || 'N/A';
  const buyerNationalId = formData.buyerNationalId || '';
  const buyerAgents = Array.isArray(formData.buyerAgents)
    ? formData.buyerAgents.filter((agent) => agent?.fullName || agent?.phone)
    : [];
  const contractDate = contract.createdAt
    ? new Date(contract.createdAt).toLocaleDateString('en-CA')
    : 'N/A';
  const contractReference = (contract._id || contract.id || 'N/A')
    .toString()
    .slice(-8)
    .toUpperCase();
  const contractSideLabel = isBuyerContract
    ? "Amasezerano y'Umuguzi"
    : "Amasezerano y'Umugurisha";
  const signingPartyLabel = isBuyerContract ? 'Umuguzi' : 'Umugurisha';
  const signingPartyName = isBuyerContract ? buyerName : sellerName;
  const signingDate = isBuyerContract
    ? formData.buyerSignatureDate || ''
    : formData.sellerSignatureDate || '';

  // Colors for PDF text (R G B values 0-1)
  const INDIGO = '0.188 0.247 0.624';
  const DARK_GRAY = '0.2 0.2 0.2';
  const MED_GRAY = '0.35 0.35 0.35';
  const GOLD = '0.596 0.502 0.102';

  const blocks = [
    { text: 'ANNOUNCEMENT AFRICA LTD', fontSize: 22, bold: true, align: 'center', spaceAfter: 5, maxChars: 120, color: INDIGO },
    { text: "Urubuga ruhuza Umugurisha n'Umuguzi kandi rukoroshya ubucuruzi", fontSize: 10, align: 'center', spaceAfter: 3, maxChars: 140, color: MED_GRAY },
    { text: 'Email: announcementafricaltd@gmail.com  |  Tel: (+250) 788 820 543  |  Kigali - Rwanda', fontSize: 10, align: 'center', spaceAfter: 14, maxChars: 160, color: MED_GRAY, hrAfter: true, hrColor: '0.796 0.651 0.169', hrWidth: 1.2 },
    { text: "AMASEZERANO Y'UBUCURUZI", fontSize: 18, bold: true, align: 'center', spaceBefore: 10, spaceAfter: 3, maxChars: 120, color: INDIGO },
    { text: '(SALES & PURCHASE AGREEMENT)', fontSize: 12, bold: true, align: 'center', spaceAfter: 8, maxChars: 120, color: GOLD },
    { text: contractSideLabel, fontSize: 11, bold: true, align: 'center', spaceAfter: 6, maxChars: 140, color: DARK_GRAY },
    { text: `Umutwe w'Amasezerano: ${contract.itemName}`, fontSize: 10, bold: true, align: 'center', spaceAfter: 4, maxChars: 80, color: DARK_GRAY },
    { text: `Nimero y'Inyandiko: AAC-${contractReference}       Itariki: ${contractDate}`, fontSize: 10, align: 'center', spaceAfter: 18, maxChars: 160, color: MED_GRAY, hrAfter: true },
    { text: '1. ABO AMASEZERANO AGENDA', fontSize: 13, bold: true, spaceAfter: 8, color: INDIGO, highlightBand: true },
    { text: 'Company / Platform: Announcement Africa Ltd.', fontSize: 12, spaceAfter: 4, maxChars: 95 },
    { text: "Inshingano: Guhuza Umugurisha n'Umuguzi, no koroshya itumanaho n'ubucuruzi.", fontSize: 12, spaceAfter: 10, maxChars: 95, lineHeight: 17 },
    ...(isBuyerContract
      ? [
          { text: 'Umuguzi', fontSize: 12, bold: true, spaceAfter: 4 },
          { text: `Amazina: ${buyerName}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
          { text: `Telefoni: ${buyerPhone}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
          { text: `Email: ${buyerEmail}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
          { text: `Aderesi: ${buyerAddress}`, fontSize: 12, spaceAfter: buyerNationalId ? 3 : 16, maxChars: 95 },
          ...(buyerNationalId ? [{ text: `Nomero y'indangamuntu: ${buyerNationalId}`, fontSize: 12, spaceAfter: 16, maxChars: 95 }] : []),
        ]
      : [
          { text: 'Umugurisha', fontSize: 12, bold: true, spaceAfter: 4 },
          { text: `Amazina: ${sellerName}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
          { text: `Telefoni: ${sellerPhone}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
          { text: `Email: ${sellerEmail}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
          { text: `Aderesi: ${sellerAddress}`, fontSize: 12, spaceAfter: sellerNationalId ? 3 : 16, maxChars: 95 },
          ...(sellerNationalId ? [{ text: `Nomero y'indangamuntu: ${sellerNationalId}`, fontSize: 12, spaceAfter: 16, maxChars: 95 }] : []),
        ]),
    { text: isBuyerContract ? '2. UMUTUNGO/IGICURUZWA USHAKA KUGURA' : '2. UMUTUNGO/IGICURUZWA USHAKA KUGURISHA', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
    { text: `Ubwoko: ${assetType}`, fontSize: 12, spaceAfter: 6, maxChars: 95 },
    { text: `Ibisobanuro by'umutungo/igicuruzwa naho giherereye: ${assetDescription}`, fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
  ];

  if (isBuyerContract) {
    blocks.push(
      { text: "3. INTEGO Y'AYA MASEZERANO", fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Aya masezerano agamije kwemeza ko Announcement Africa Ltd izafasha umuguzi mu bikorwa bikurikira: kumushakira umutungo akeneye; kumwereka imitungo iri kugurishwa; kumuhuza na nyir'umutungo; no koroshya ibiganiro by'ubucuruzi hagati y'umuguzi na nyir'umutungo. Announcement Africa Ltd ikora nk'umuhuza hagati y'umuguzi na nyir'umutungo.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: "4. IGICIRO CY'UMUTUNGO/IGICURUZWA", fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: `Igiciro cyanditswe: ${agreedPrice} RWF. Nyirubwite yakongera cyangwa akagabanya igiciro.`, fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '5. IGIHEMBO CYA SOSIYETE', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Umuguzi yemera ko mu gihe aguze umutungo yeretswe, yamenyeshejwe cyangwa yahujweho na Announcement Africa Ltd, sosiyete ifite uburenganzira bwo kubona commission cyangwa service fee nk'uko byumvikanyweho hagati yayo n'umuguzi cyangwa hakurikijwe imikoranire y'ubucuruzi yarebaga uwo mutungo.", fontSize: 12, spaceAfter: 8, maxChars: 95, lineHeight: 18 },
      { text: "Umuguzi ntiyemerewe kugura umutungo yeretswe na sosiyete ayirenze cyangwa ayihishe agamije kwirinda kwishyura igihembo cya sosiyete.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '6. UBURENGANZIRA BWA SOSIYETE KU GIHEMBO CYAYO', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Mu gihe umuguzi aguze umutungo yeretswe, yamenyeshejwe cyangwa yahujweho na Announcement Africa Ltd mu gihe aya masezerano akiriho cyangwa nyuma yayo, kandi bikagaragara ko uwo mutungo yawumenye binyuze kuri iyo sosiyete, Announcement Africa Ltd izakomeza kugira uburenganzira ku gihembo cyayo.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: "7. INSHINGANO Z'UMUGUZI", fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Umuguzi yemera gukoresha amakuru yahawe na sosiyete mu buryo bwemewe; kutarenga sosiyete mu kuvugana na nyir'umutungo agamije kuyikwepa; gutanga amakuru y'ukuri ku bushobozi bwe bwo kugura; no gukorana na sosiyete mu mucyo no mu bwubahane.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: "8. IGENZURA RY'UMUTUNGO", fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Umuguzi yemera ko afite inshingano zo gukora igenzura ryuzuye ku mutungo mbere yo kuwugura. Iryo genzura ririmo ariko ntirigarukira ku gusuzuma ibyangombwa by'umutungo; kugenzura niba nta bibazo by'amategeko cyangwa amakimbirane uwuriho; no gusuzuma imiterere, agaciro n'ubwizerwe bw'uyu mutungo.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '9. GUSESA AMASEZERANO', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Buri ruhande rushobora gusesa aya masezerano rubimenyesheje urundi mu nyandiko mbere y'igihe cyumvikanyweho cyangwa hakurikijwe ibiteganywa n'andi masezerano hagati y'impande zombi. Gusesa aya masezerano ntibikuraho uburenganzira bwa sosiyete ku gihembo cyayo niba yarabonye cyangwa yaramenyekanishije umuguzi mbere y'iseswa ryayo.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '10. AMATEGEKO AZAKURIKIZWA', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Aya masezerano azubahirizwa kandi asobanurwe hakurikijwe amategeko agenga ubucuruzi n'imitungo itimukanwa mu Repubulika y'u Rwanda.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '11. GUKEMURA AMAKIMBIRANE', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Impande zombi zizabanza gushaka gukemura amakimbirane mu bwumvikane. Mu gihe bidashobotse, amakimbirane azashyikirizwa inzego zibifitiye ububasha mu Rwanda.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '12. ABA AGENTS BAFASHIJE KUBONA UMUTUNGO', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Abantu bakurikira ni aba agents cyangwa abafatanyabikorwa bafashije Announcement Africa Ltd kubona cyangwa kumenyekanisha uyu mutungo. Aba agent bemera ko bakoranye na Announcement Africa Ltd mu kumenyekanisha cyangwa kubona uyu mutungo. Announcement Africa Ltd ni yo yonyine ifite uburenganzira bwo kugena uburyo igihembo cyangwa inyungu ishobora kugabanwa hagati yayo n'aba agent, hashingiwe ku mategeko no ku mabwiriza y'imbere muri sosiyete. Kugaragaza aba agent muri aya masezerano ntibibaha uburenganzira bwo gusinyira sosiyete cyangwa gufata ibyemezo mu izina rya Announcement Africa Ltd, keretse babiherewe ububasha bwanditse.", fontSize: 12, spaceAfter: buyerAgents.length ? 10 : 18, maxChars: 95, lineHeight: 18 },
      ...buyerAgents.flatMap((agent, index) => [
        { text: `Agent ${index + 1}`, fontSize: 12, bold: true, spaceAfter: 4, maxChars: 40 },
        { text: `Amazina: ${agent.fullName || 'N/A'}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
        { text: `Telefoni: ${agent.phone || 'N/A'}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
        { text: 'Umukono: ________________________________', fontSize: 12, spaceAfter: 10, maxChars: 95 },
      ])
    );
  } else {
    blocks.push(
      { text: '3. UBURENGANZIRA BWA SOSIYETE', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Nyir'umutungo aha Announcement Africa Ltd uburenganzira bwo kwamamaza umutungo, kuwumurikira abaguzi, gushakira umutungo umuguzi no koroshya ibiganiro by'ubucuruzi. Sosiyete ifite uburenganzira bwo gushakira umutungo umuguzi ku giciro kirenze icyo nyir'umutungo yagaragaje.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: "4. IGICIRO CY'UMUTUNGO/IGICURUZWA", fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: `Nyir'umutungo yemera ko igiciro cy'umutungo we atifuza ko kijya munsi ya ${agreedPrice} RWF. Aya mafaranga ni yo nyir'umutungo azahabwa nyuma y'igurishwa ry'umutungo, atabariwemo amafaranga y'igihembo cya sosiyete.`, fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: "5. AMAFARANGA Y'IGIHEMBO CYA SOSIYETE", fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Nyir'umutungo yemera ko amafaranga yose azarenga ku giciro cyavuzwe haruguru (Owner Net Price) azaba ari igihembo cya Announcement Africa Ltd. Aya mafaranga y'inyongera azagenwa na sosiyete hashingiwe ku buryo bwo kwamamaza, gushaka umuguzi no ku mbaraga zakoreshejwe mu buhuza. Nyir'umutungo ntazabaza, ntazavuguruza kandi nta burenganzira azagira ku mafaranga yose azarenga ku giciro yashyizeho.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '6. KUTAVANGIRA IGIHEMBO CYA SOSIYETE', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Nyir'umutungo yemera ko amafaranga ye azaba ari ayo yashyizeho gusa; amafaranga yose azarenga kuri ayo azaba ari uburenganzira bwa sosiyete; kandi nyir'umutungo atazabaza cyangwa ngo agene igihembo cya sosiyete.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: "7. UKURI KW'AMAKURU N'UBURENGANZIRA KU MUTUNGO", fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Nyir'umutungo yemera ko ari we nyir'umutungo wemewe n'amategeko cyangwa afite uburenganzira bwo kuwugurisha; ko amakuru yose yatanze kuri uwo mutungo ari ukuri; kandi ko azatanga ibyangombwa byose bisabwa igihe bikenewe. Announcement Africa Ltd ntizaryozwa ibibazo by'amategeko cyangwa amakimbirane ajyanye n'uburenganzira kuri uwo mutungo mu gihe byaturutse ku makuru cyangwa ibyangombwa byatanzwe na nyir'umutungo.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '8. IGIHE AYA MASEZERANO AZAMARA', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: agreementDurationText, fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '9. GUSESA AMASEZERANO', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Buri ruhande rushobora gusesa aya masezerano rubimenyesheje urundi mu nyandiko mbere y'igihe cyumvikanyweho cyangwa hakurikijwe ibiteganywa n'andi masezerano hagati y'impande zombi. Gusesa aya masezerano ntibikuraho uburenganzira bwa sosiyete ku gihembo cyayo niba yarabonye cyangwa yaramenyekanishije umuguzi mbere y'iseswa ryayo.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '10. AMATEGEKO AZAKURIKIZWA', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Aya masezerano azubahirizwa kandi asobanurwe hakurikijwe amategeko agenga ubucuruzi n'imitungo itimukanwa mu Repubulika y'u Rwanda.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '11. GUKEMURA AMAKIMBIRANE', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Impande zombi zizabanza gushaka gukemura amakimbirane mu bwumvikane. Mu gihe bidashobotse, amakimbirane azashyikirizwa inzego zibifitiye ububasha mu Rwanda.", fontSize: 12, spaceAfter: 18, maxChars: 95, lineHeight: 18 },
      { text: '12. ABA AGENTS BAFASHIJE KUBONA UMUTUNGO', fontSize: 13, bold: true, spaceBefore: 10, spaceAfter: 8, color: INDIGO, highlightBand: true, hrBefore: true },
      { text: "Abantu bakurikira ni aba agents cyangwa abafatanyabikorwa bafashije Announcement Africa Ltd kubona cyangwa kumenyekanisha uyu mutungo.", fontSize: 12, spaceAfter: buyerAgents.length ? 10 : 18, maxChars: 95, lineHeight: 18 },
      ...buyerAgents.flatMap((agent, index) => [
        { text: `Agent ${index + 1}`, fontSize: 12, bold: true, spaceAfter: 4, maxChars: 40 },
        { text: `Amazina: ${agent.fullName || 'N/A'}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
        { text: `Telefoni: ${agent.phone || 'N/A'}`, fontSize: 12, spaceAfter: 3, maxChars: 95 },
        { text: 'Umukono: ________________________________', fontSize: 12, spaceAfter: 10, maxChars: 95 },
      ])
    );
  }

  blocks.push(
    { text: "AMAKURU Y'INYANDIKO MURI SISITEMU", fontSize: 11, bold: true, spaceAfter: 6, color: INDIGO, hrBefore: true, spaceBefore: 14 },
    { text: "Aya masezerano yabitswe mu buryo bw'ikoranabuhanga muri sisitemu ya Announcement Africa Ltd nk'inyandiko y'ubucuruzi bwatanzwe binyuze kuri website.", fontSize: 11, spaceAfter: 20, maxChars: 96, lineHeight: 16 },
    { text: 'UMUKONO', fontSize: 13, bold: true, spaceBefore: 12, spaceAfter: 10, color: INDIGO, highlightBand: true, hrBefore: true },
    { text: `${signingPartyLabel}: ${signingPartyName}`, fontSize: 12, bold: true, spaceAfter: 6, maxChars: 96 },
    { text: 'Umukono: ________________________________', fontSize: 12, spaceAfter: 6, maxChars: 96 },
    { text: `Itariki: ${signingDate || '________________'}`, fontSize: 12, spaceAfter: 14, maxChars: 96 },
    { text: 'Uhagarariye Announcement Africa Ltd', fontSize: 12, bold: true, spaceAfter: 6, maxChars: 96 },
    { text: 'Amazina: ________________________________', fontSize: 12, spaceAfter: 6, maxChars: 96 },
    { text: 'Umukono: ________________________________', fontSize: 12, spaceAfter: 6, maxChars: 96 },
    { text: 'Itariki: ________________', fontSize: 12, spaceAfter: 8, maxChars: 96 }
  );

  return blocks;
};

/* ─── PDF buffer builder (matches frontend createPdfBlob, no logo) ─── */

const createPdfBufferFromBlocks = (title, blocks) => {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 55;
  const bottomMargin = 60;
  const pages = [];
  let currentPage = [];
  let currentPageDrawOps = [];
  const allDrawOps = [];
  const topOffset = 88; // no logo on server
  let y = pageHeight - topOffset;

  const pushPage = () => {
    if (currentPage.length > 0 || currentPageDrawOps.length > 0) {
      pages.push(currentPage);
      allDrawOps.push(currentPageDrawOps);
      currentPage = [];
      currentPageDrawOps = [];
    }
    y = pageHeight - 72;
  };

  // Blue top bar on first page
  currentPageDrawOps.push(
    { type: 'rect', x: 0, y: pageHeight - 8, w: pageWidth, h: 8, color: '0.145 0.388 0.922' }
  );

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
        type: 'line', x1: margin, y1: y - 2, x2: pageWidth - margin, y2: y - 2,
        color: '0.82 0.82 0.82', lineWidth: 0.5,
      });
    }

    y -= spaceBefore;

    // Section header highlight band
    if (block.highlightBand) {
      const bandHeight = lines.length * lineHeight + 6;
      currentPageDrawOps.push({
        type: 'rect', x: margin - 6, y: y - bandHeight + lineHeight - 1,
        w: pageWidth - 2 * margin + 12, h: bandHeight + 2, color: '0.941 0.945 0.973',
      });
    }

    lines.forEach((line) => {
      if (y - lineHeight < bottomMargin) {
        pushPage();
      }

      currentPage.push({
        text: line, y, fontSize: block.fontSize || 12,
        bold: !!block.bold, align: block.align || 'left', color: block.color || null,
      });
      y -= lineHeight;
    });

    // Horizontal rule after block
    if (block.hrAfter) {
      currentPageDrawOps.push({
        type: 'line', x1: margin, y1: y + 2, x2: pageWidth - margin, y2: y + 2,
        color: block.hrColor || '0.82 0.82 0.82', lineWidth: block.hrWidth || 0.5,
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

  const fontObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
  const fontBoldObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>');
  const fontHelveticaId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pagesKids = [];

  pages.forEach((pageLines, currentPageIndex) => {
    const drawOps = allDrawOps[currentPageIndex] || [];

    // Top accent bar on subsequent pages
    if (currentPageIndex > 0) {
      drawOps.unshift(
        { type: 'rect', x: 0, y: pageHeight - 5, w: pageWidth, h: 5, color: '0.145 0.388 0.922' }
      );
    }

    // Page footer line
    drawOps.push({
      type: 'line', x1: margin, y1: 38, x2: pageWidth - margin, y2: 38,
      color: '0.82 0.82 0.82', lineWidth: 0.5,
    });

    const drawStream = buildPdfDrawCommands(drawOps);

    // Diagonal watermark
    const wmText = 'ANNOUNCEMENT AFRICA LTD';
    const wmAngle = 35 * (Math.PI / 180);
    const wmCos = Math.cos(wmAngle).toFixed(4);
    const wmSin = Math.sin(wmAngle).toFixed(4);
    const wmStream = [
      'q', 'BT', '0.93 0.93 0.93 rg', `/F2 36 Tf`,
      `${wmCos} ${wmSin} -${wmSin} ${wmCos} 80.00 280.00 Tm`,
      `(${escapePdfText(wmText)}) Tj`, 'ET',
      'BT', '0.94 0.94 0.94 rg', `/F2 18 Tf`,
      `${wmCos} ${wmSin} -${wmSin} ${wmCos} 130.00 220.00 Tm`,
      `(${escapePdfText("Inyandiko y'ubucuruzi - Ntiyemerewe gukoporwa")}) Tj`, 'ET', 'Q',
    ].join('\n');

    const footerText = `Page ${currentPageIndex + 1} of ${totalPageCount}`;
    const footerX = (pageWidth - estimatePdfTextWidth(footerText, 9)) / 2;
    const footerStream = `BT\n0.5 0.5 0.5 rg\n/F3 9 Tf\n1 0 0 1 ${footerX.toFixed(2)} 24.00 Tm\n(${escapePdfText(footerText)}) Tj\nET`;

    const contentStream = `${wmStream}\n${drawStream}\n${pageLines
      .map((line) => buildPdfTextLine(line, pageWidth, margin))
      .join('\n')}\n${footerStream}`;

    const contentObjectId = addObject(
      `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`
    );
    const pageObjectId = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjectId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R /F2 ${fontBoldObjectId} 0 R /F3 ${fontHelveticaId} 0 R >> >> >>`
    );
    pagesKids.push(pageObjectId);
  });

  const pagesObjectId = addObject(
    `<< /Type /Pages /Kids [${pagesKids.map((id) => `${id} 0 R`).join(' ')}] /Count ${pagesKids.length} >>`
  );

  objects.forEach((object, index) => {
    const decodedObject = new TextDecoder().decode(object);
    if (decodedObject.includes('/Parent 0 0 R')) {
      objects[index] = encodePdfString(
        decodedObject.replace('/Parent 0 0 R', `/Parent ${pagesObjectId} 0 R`)
      );
    }
  });

  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

  const pdfChunks = [encodePdfString('%PDF-1.4\n')];
  const offsets = [0];
  let currentLength = pdfChunks[0].length;

  objects.forEach((object, index) => {
    const prefix = encodePdfString(`${index + 1} 0 obj\n`);
    const suffix = encodePdfString('\nendobj\n');
    offsets.push(currentLength);
    pdfChunks.push(prefix, object, suffix);
    currentLength += prefix.length + object.length + suffix.length;
  });

  const xrefOffset = currentLength;
  const xrefHeader = encodePdfString(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  pdfChunks.push(xrefHeader);

  for (let i = 1; i <= objects.length; i += 1) {
    pdfChunks.push(encodePdfString(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`));
  }

  pdfChunks.push(
    encodePdfString(
      `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    )
  );

  return Buffer.from(Buffer.concat(pdfChunks.map((chunk) => Buffer.from(chunk))));
};


const generateContractPdfBuffer = async (contract = {}) => {
  const title = String(contract.itemName || 'Signed Contract').trim() || 'Signed Contract';
  const blocks = createPdfParagraphBlocks(contract);
  return createPdfBufferFromBlocks(title, blocks);
};

module.exports = {
  generateContractPdfBuffer,
};
