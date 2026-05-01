import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import apiBaseUrl from '../config';

export const SIGNED_CONTRACTS_STORAGE_KEY = 'signedContracts';

export const emptyContractForm = {
  contractPartyRole: '',
  buyerAgents: [{ fullName: '', phone: '' }],
  sellerName: '',
  sellerPhone: '',
  sellerEmail: '',
  sellerAddress: '',
  sellerNationalId: '',
  buyerName: '',
  buyerPhone: '',
  buyerEmail: '',
  buyerAddress: '',
  buyerNationalId: '',
  assetType: '',
  otherAssetType: '',
  assetDescription: '',
  agreedPrice: '',
  agreementDuration: '',
  paymentMethod: '',
  otherPaymentMethod: '',
  paymentDate: '',
  sellerSignatureName: '',
  sellerSignatureDate: '',
  buyerSignatureName: '',
  buyerSignatureDate: '',
  agreeToTerms: false
};

const defaultBuyerAgent = { fullName: '', phone: '' };
const agreementMonthOptions = [
  { value: '01', label: 'Mutarama' },
  { value: '02', label: 'Gashyantare' },
  { value: '03', label: 'Werurwe' },
  { value: '04', label: 'Mata' },
  { value: '05', label: 'Gicurasi' },
  { value: '06', label: 'Kamena' },
  { value: '07', label: 'Nyakanga' },
  { value: '08', label: 'Kanama' },
  { value: '09', label: 'Nzeri' },
  { value: '10', label: 'Ukwakira' },
  { value: '11', label: 'Ugushyingo' },
  { value: '12', label: 'Ukuboza' },
];
const agreementYearOptions = Array.from(
  { length: 31 },
  (_, index) => String(new Date().getFullYear() + index)
);

const ensureBuyerAgents = (data = {}) => ({
  ...data,
  buyerAgents:
    Array.isArray(data.buyerAgents) && data.buyerAgents.length > 0
      ? data.buyerAgents
      : [{ ...defaultBuyerAgent }],
});

export const buildContractTitle = (formData, fallbackName = 'Amasezerano') => {
  const buyerName = (formData?.buyerName || '').trim();
  const sellerName = (formData?.sellerName || '').trim();
  const buyerFirstName = buyerName.split(/\s+/)[0] || 'Buyer';
  const sellerParts = sellerName.split(/\s+/).filter(Boolean);
  const sellerLastName = sellerParts[sellerParts.length - 1] || 'Seller';
  const contractPartyRole = formData?.contractPartyRole;
  const assetName = (formData?.assetDescription || fallbackName).trim();
  if (contractPartyRole === 'seller') {
    return `Seller - ${sellerLastName} - ${assetName} Contract`;
  }

  if (contractPartyRole === 'buyer') {
    return `Buyer - ${buyerFirstName} - ${assetName} Contract`;
  }

  return `${buyerFirstName} - ${sellerLastName} - ${assetName} Contract`;
};

const ContractModal = ({
  isOpen,
  onClose,
  item,
  itemType,
  initialData = null,
  onSubmitContract = null,
  submitLabel = 'Ohereza',
  title = "Amasezerano y'Ubucuruzi",
}) => {
  const [formData, setFormData] = useState(ensureBuyerAgents(initialData || emptyContractForm));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedAgreementMonth, setSelectedAgreementMonth] = useState('');
  const [selectedAgreementYear, setSelectedAgreementYear] = useState('');
  const initialRecordKey = initialData?._id || initialData?.id || 'new-contract';

  React.useEffect(() => {
    if (!isOpen) return;
    const nextFormData = ensureBuyerAgents(initialData || emptyContractForm);
    const [nextAgreementYear = '', nextAgreementMonth = ''] = (
      nextFormData.agreementDuration || ''
    ).split('-');
    setFormData(nextFormData);
    setSelectedAgreementYear(nextAgreementYear);
    setSelectedAgreementMonth(nextAgreementMonth);
    setSubmitError('');
    setIsSubmitting(false);
  }, [initialRecordKey, isOpen]);

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateBuyerAgent = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      buyerAgents: (prev.buyerAgents || []).map((agent, agentIndex) =>
        agentIndex === index ? { ...agent, [field]: value } : agent
      ),
    }));
  };

  const addBuyerAgent = () => {
    setFormData((prev) => ({
      ...prev,
      buyerAgents: [...(prev.buyerAgents || []), { ...defaultBuyerAgent }],
    }));
  };

  const removeBuyerAgent = (index) => {
    setFormData((prev) => {
      const nextAgents = (prev.buyerAgents || []).filter((_, agentIndex) => agentIndex !== index);
      return {
        ...prev,
        buyerAgents: nextAgents.length > 0 ? nextAgents : [{ ...defaultBuyerAgent }],
      };
    });
  };

  const selectedPartyRole = formData.contractPartyRole;

  const updateAgreementDuration = (field, value) => {
    const nextYear = field === 'year' ? value : selectedAgreementYear;
    const nextMonth = field === 'month' ? value : selectedAgreementMonth;
    if (field === 'year') setSelectedAgreementYear(value);
    if (field === 'month') setSelectedAgreementMonth(value);
    setFormData((prev) => ({
      ...prev,
      agreementDuration:
        nextYear && nextMonth ? `${nextYear}-${nextMonth}` : '',
    }));
  };

  const handlePriceInputChange = (value) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setFormData((prev) => ({ ...prev, agreedPrice: numericValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditMode = Boolean(onSubmitContract);
    if (!isEditMode && !formData.agreeToTerms) {
      alert('Emeza aya masezerano mbere yo kohereza form');
      return;
    }

    const resolvedAssetType =
      formData.assetType === 'Ibindi' ? formData.otherAssetType : formData.assetType;

    const contractRecord = {
      id: `${Date.now()}-${item?._id || item?.id || item?.name || item?.title || 'contract'}`,
      createdAt: new Date().toISOString(),
      itemId: item?._id || item?.id || null,
      itemName: buildContractTitle(formData, item?.name || item?.title || 'Amasezerano'),
      itemType: resolvedAssetType || itemType || 'General',
      price: formData.agreedPrice || item?.priceDisplay || item?.price || '',
      status: 'submitted',
      formData,
    };

    if (isEditMode && initialData) {
      contractRecord.id = initialData.id;
      contractRecord.createdAt = initialData.createdAt;
      contractRecord.status = initialData.status || contractRecord.status;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (onSubmitContract) {
        await onSubmitContract(contractRecord);
        onClose();
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/signed-contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractRecord),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Could not save signed contract data');
      }

      onClose();
    } catch (error) {
      console.warn('Could not persist signed contract data', error);
      setSubmitError(error.message || 'Ntibyakunze kubika amasezerano.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-1">
              <h3 className="text-sm font-bold text-gray-900">
                AMASEZERANO Y'UBUCURUZI (SALES & PURCHASE AGREEMENT)
              </h3>
              <p className="text-sm text-gray-700">
                Aya masezerano akorwa hagati ya Company, Umugurisha n'Umuguzi.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-3">
              <div className="text-xs font-semibold text-gray-700 uppercase">
                1. Abo amasezerano agenga
              </div>
              <div className="space-y-1">
                <p><strong>Company / Platform:</strong> Announcement Africa Ltd</p>
                <p><strong>Inshingano:</strong> Guhuza Umugurisha n'Umuguzi, no koroshya itumanaho n'ubucuruzi.</p>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">Hitamo uruhande rw'amasezerano</div>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="contractPartyRole"
                    value="buyer"
                    checked={selectedPartyRole === 'buyer'}
                    onChange={(e) => updateFormField('contractPartyRole', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                    required
                  />
                  <span>Amasezerano y'Umuguzi</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="contractPartyRole"
                    value="seller"
                    checked={selectedPartyRole === 'seller'}
                    onChange={(e) => updateFormField('contractPartyRole', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                    required
                  />
                  <span>Amasezerano y'Umugurisha</span>
                </label>
              </div>

              {selectedPartyRole === 'seller' && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Umugurisha</div>
                  <input type="text" required value={formData.sellerName} onChange={(e) => updateFormField('sellerName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Amazina *" />
                  <input type="tel" required value={formData.sellerPhone} onChange={(e) => updateFormField('sellerPhone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Telefoni *" />
                  <input type="email" value={formData.sellerEmail} onChange={(e) => updateFormField('sellerEmail', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Email (niba ihari)" />
                  <textarea required value={formData.sellerAddress} onChange={(e) => updateFormField('sellerAddress', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" placeholder="Aderesi *" />
                  <input type="text" value={formData.sellerNationalId} onChange={(e) => updateFormField('sellerNationalId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nomero y'indangamuntu (niba ihari)" />
                </div>
              )}

              {selectedPartyRole === 'buyer' && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Umuguzi</div>
                  <input type="text" required value={formData.buyerName} onChange={(e) => updateFormField('buyerName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Amazina *" />
                  <input type="tel" required value={formData.buyerPhone} onChange={(e) => updateFormField('buyerPhone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Telefoni *" />
                  <input type="email" value={formData.buyerEmail} onChange={(e) => updateFormField('buyerEmail', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Email (niba ihari)" />
                  <textarea required value={formData.buyerAddress} onChange={(e) => updateFormField('buyerAddress', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" placeholder="Aderesi *" />
                  <input type="text" value={formData.buyerNationalId} onChange={(e) => updateFormField('buyerNationalId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nomero y'indangamuntu (niba ihari)" />
                </div>
              )}
            </div>

            {selectedPartyRole && (
              <>
                <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-3">
                  <div className="text-xs font-semibold text-gray-700 uppercase">
                    {selectedPartyRole === 'buyer'
                      ? "2. Umutungo/igicuruzwa ushaka kugura"
                      : "2. Umutungo/igicuruzwa ushaka kugurisha"}
                  </div>
                  <div className="space-y-2">
                    {['Inzu', 'Ikibanza', 'Imodoka', 'Ibindi'].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="assetType"
                          value={option}
                          checked={formData.assetType === option}
                          onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  {formData.assetType === 'Ibindi' && (
                    <input
                      type="text"
                      required
                      value={formData.otherAssetType}
                      onChange={(e) => setFormData({ ...formData, otherAssetType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Andika ubwoko bw'ikigurishwa *"
                    />
                  )}
                  <textarea
                    required
                    value={formData.assetDescription}
                    onChange={(e) => setFormData({ ...formData, assetDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows="4"
                    placeholder="Ibisobanuro by'icyo kigurishwa: aho giherereye, ingano, nimero zacyo, uko gihagaze, n'ibindi *"
                  />
                </div>

                <>
                  <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
                    <div className="text-xs font-semibold text-gray-700 uppercase">
                      {selectedPartyRole === 'seller'
                        ? '3. Uburenganzira bwa sosiyete'
                        : "3. Intego y'aya masezerano"}
                    </div>
                    {selectedPartyRole === 'seller' ? (
                      <>
                        <p>Nyir&apos;umutungo aha Announcement Africa Ltd uburenganzira bwo:</p>
                        <p>1. Kwamamaza umutungo.</p>
                        <p>2. Kuwumurikira abaguzi.</p>
                        <p>3. Gushakira umutungo umuguzi.</p>
                        <p>4. Koroshya ibiganiro by&apos;ubucuruzi.</p>
                        <p>
                          Sosiyete ifite uburenganzira bwo gushakira umutungo
                          umuguzi ku giciro kirenze icyo nyir&apos;umutungo
                          yagaragaje.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Aya masezerano agamije kwemeza ko Announcement Africa Ltd izafasha umuguzi mu bikorwa bikurikira:</p>
                        <p>1. Kumushakira umutungo akeneye.</p>
                        <p>2. Kumwereka imitungo iri kugurishwa.</p>
                        <p>3. Kumuhuza na nyir'umutungo.</p>
                        <p>4. Koroshya ibiganiro by'ubucuruzi hagati y'umuguzi na nyir'umutungo.</p>
                        <p>Announcement Africa Ltd ikora nk'umuhuza hagati y'umuguzi na nyir'umutungo.</p>
                      </>
                    )}
                  </div>

                </>

                <div className="space-y-3">
                    <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase">
                        {selectedPartyRole === 'seller'
                          ? "4. Igiciro cy'umutungo/igicuruzwa"
                          : "4. Igiciro cy'umutungo/igicuruzwa"}
                      </div>
                    {selectedPartyRole === 'buyer' ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={formData.agreedPrice}
                          onChange={(e) => handlePriceInputChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Andika igiciro *"
                        />
                        <p className="text-xs text-gray-500">
                          Nyirubwite yakongera cyangwa akagabanya igiciro
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          Nyir&apos;umutungo yemera ko igiciro cy&apos;umutungo we atifuza
                          ko kijya munsi ya cyo ari:
                        </p>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={formData.agreedPrice}
                            onChange={(e) => handlePriceInputChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Andika amafaranga *"
                          />
                          <p className="mt-2 text-sm font-medium text-gray-700">RWF</p>
                        </div>
                        <p>
                          Aya mafaranga ni yo nyir&apos;umutungo azahabwa nyuma
                          y&apos;igurishwa ry&apos;umutungo, atabariwemo amafaranga
                          y&apos;igihembo cya sosiyete.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase">
                        {selectedPartyRole === 'seller'
                          ? "5. Amafaranga y'igihembo cya sosiyete"
                          : "5. Igihembo cya sosiyete"}
                      </div>
                      {selectedPartyRole === 'seller' ? (
                        <>
                          <p>
                            Nyir&apos;umutungo yemera ko amafaranga yose azarenga
                            ku giciro cyavuzwe haruguru (Owner Net Price)
                            azaba ari igihembo cya Announcement Africa Ltd.
                          </p>
                          <p>
                            Aya mafaranga y&apos;inyongera azagenwa na sosiyete
                            hashingiwe ku buryo bwo kwamamaza, gushaka umuguzi
                            no ku mbaraga zakoreshejwe mu buhuza.
                          </p>
                          <p>
                            Nyir&apos;umutungo ntazabaza, ntazavuguruza kandi nta
                            burenganzira azagira ku mafaranga yose azarenga ku
                            giciro yashyizeho.
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            Umuguzi yemera ko mu gihe aguze umutungo yeretswe,
                            yamenyeshejwe cyangwa yahujweho na Announcement
                            Africa Ltd, sosiyete ifite uburenganzira bwo kubona
                            commission cyangwa service fee nk&apos;uko
                            byumvikanyweho hagati yayo n&apos;umuguzi cyangwa
                            hakurikijwe imikoranire y&apos;ubucuruzi yarebaga uwo
                            mutungo.
                          </p>
                          <p>
                            Umuguzi ntiyemerewe kugura umutungo yeretswe na
                            sosiyete ayirenze cyangwa ayihishe agamije kwirinda
                            kwishyura igihembo cya sosiyete.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase">
                        {selectedPartyRole === 'seller'
                          ? '6. Kutavangira igihembo cya sosiyete'
                          : "6. Uburenganzira bwa sosiyete ku gihembo cyayo"}
                      </div>
                      {selectedPartyRole === 'seller' ? (
                        <>
                          <p>Nyir&apos;umutungo yemera ko:</p>
                          <p>1. Amafaranga ye azaba ari ayo yashyizeho gusa.</p>
                          <p>2. Amafaranga yose azarenga kuri ayo azaba ari uburenganzira bwa sosiyete.</p>
                          <p>3. Nyir&apos;umutungo atazabaza cyangwa ngo agene igihembo cya sosiyete.</p>
                        </>
                      ) : (
                        <>
                          <p>
                            Mu gihe umuguzi aguze umutungo yeretswe,
                            yamenyeshejwe cyangwa yahujweho na Announcement
                            Africa Ltd mu gihe aya masezerano akiriho cyangwa
                            nyuma yayo, kandi bikagaragara ko uwo mutungo
                            yawumenye binyuze kuri iyo sosiyete, Announcement
                            Africa Ltd izakomeza kugira uburenganzira ku
                            gihembo cyayo.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase">
                        {selectedPartyRole === 'seller'
                          ? "7. Ukuri kw'amakuru n'uburenganzira ku mutungo"
                          : "7. Inshingano z'umuguzi"}
                      </div>
                      {selectedPartyRole === 'seller' ? (
                        <>
                          <p>Nyir'umutungo yemera ko:</p>
                          <p>1. Ari we nyir'umutungo wemewe n'amategeko cyangwa afite uburenganzira bwo kuwugurisha.</p>
                          <p>2. Amakuru yose yatanze kuri uwo mutungo ari ukuri.</p>
                          <p>3. Azatanga ibyangombwa byose bisabwa igihe bikenewe.</p>
                          <p>Announcement Africa Ltd ntizaryozwa ibibazo by'amategeko cyangwa amakimbirane ajyanye n'uburenganzira kuri uwo mutungo mu gihe byaturutse ku makuru cyangwa ibyangombwa byatanzwe na nyir'umutungo.</p>
                        </>
                      ) : (
                        <>
                          <p>Umuguzi yemera:</p>
                          <p>1. Gukoresha amakuru yahawe na sosiyete mu buryo bwemewe.</p>
                          <p>2. Kutarenga sosiyete mu kuvugana na nyir'umutungo agamije kuyikwepa.</p>
                          <p>3. Gutanga amakuru y'ukuri ku bushobozi bwe bwo kugura.</p>
                          <p>4. Gukorana na sosiyete mu mucyo no mu bwubahane.</p>
                          <div className="pt-2 space-y-2">
                            <p className="font-semibold text-gray-900">
                              8. Igenzura ry'umutungo
                            </p>
                            <p>
                              Umuguzi yemera ko afite inshingano zo gukora
                              igenzura ryuzuye ku mutungo mbere yo kuwugura.
                            </p>
                            <p>Iryo genzura ririmo ariko ntirigarukira ku:</p>
                            <p>1. Gusuzuma ibyangombwa by'umutungo.</p>
                            <p>2. Kugenzura niba nta bibazo by'amategeko cyangwa amakimbirane uwuriho.</p>
                            <p>3. Gusuzuma imiterere, agaciro n'ubwizerwe bw'uyu mutungo.</p>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedPartyRole === 'seller' && (
                      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
                        <div className="text-xs font-semibold text-gray-700 uppercase">8. Igihe aya masezerano azamara</div>
                        <p>Aya masezerano azamara igihe kingana na:</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            value={selectedAgreementMonth}
                            onChange={(e) => updateAgreementDuration('month', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Hitamo ukwezi</option>
                            {agreementMonthOptions.map((month) => (
                              <option key={month.value} value={month.value}>
                                {month.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={selectedAgreementYear}
                            onChange={(e) => updateAgreementDuration('year', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Hitamo umwaka</option>
                            {agreementYearOptions.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p>uhereye ku itariki yasinyiweho.</p>
                        <p>
                          Ashobora kongerwa igihe impande zombi zibyumvikanyeho
                          mu nyandiko.
                        </p>
                      </div>
                    )}
                  </div>
                </>

                <>
                    <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase">
                        {selectedPartyRole === 'seller' ? '9. Gusesa amasezerano' : '9. Gusesa amasezerano'}
                      </div>
                      <p>Buri ruhande rushobora gusesa aya masezerano rubimenyesheje urundi mu nyandiko mbere y'igihe cyumvikanyweho cyangwa hakurikijwe ibiteganywa n'andi masezerano hagati y'impande zombi.</p>
                      <p>Gusesa aya masezerano ntibikuraho uburenganzira bwa sosiyete ku gihembo cyayo niba yarabonye cyangwa yaramenyekanishije umuguzi mbere y'iseswa ryayo.</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase">
                        {selectedPartyRole === 'seller' ? '10. Amategeko azakurikizwa' : '10. Amategeko azakurikizwa'}
                      </div>
                      <p>Aya masezerano azubahirizwa kandi asobanurwe hakurikijwe amategeko agenga ubucuruzi n'imitungo itimukanwa mu Repubulika y'u Rwanda.</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase">
                        {selectedPartyRole === 'seller' ? '11. Gukemura amakimbirane' : '11. Gukemura amakimbirane'}
                      </div>
                      <p>Impande zombi zizabanza gushaka gukemura amakimbirane mu bwumvikane.</p>
                      <p>Mu gihe bidashobotse, amakimbirane azashyikirizwa inzego zibifitiye ububasha mu Rwanda.</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-4">
                      <div className="text-xs font-semibold text-gray-700 uppercase">
                        {selectedPartyRole === 'seller'
                          ? '12. Aba agents bafashije kubona umutungo'
                          : '12. Aba agents bafashije kubona umutungo'}
                      </div>
                      <p>
                        Abantu bakurikira ni aba agents cyangwa abafatanyabikorwa bafashije Announcement Africa Ltd
                        kubona cyangwa kumenyekanisha uyu mutungo.
                      </p>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>Aba agent bemera ko bakoranye na Announcement Africa Ltd mu kumenyekanisha cyangwa kubona uyu mutungo.</p>
                        <p>Announcement Africa Ltd ni yo yonyine ifite uburenganzira bwo kugena uburyo igihembo cyangwa inyungu ishobora kugabanwa hagati yayo n'aba agent, hashingiwe ku mategeko no ku mabwiriza y'imbere muri sosiyete.</p>
                        <p>Kugaragaza aba agent muri aya masezerano ntibibaha uburenganzira bwo gusinyira sosiyete cyangwa gufata ibyemezo mu izina rya Announcement Africa Ltd, keretse babiherewe ububasha bwanditse.</p>
                      </div>
                      {(formData.buyerAgents || []).map((agent, index) => (
                        <div key={`buyer-agent-${index}`} className="rounded-lg border border-gray-200 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-gray-900">Agent {index + 1}</div>
                            {(formData.buyerAgents || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBuyerAgent(index)}
                                className="text-xs font-medium text-red-600 hover:text-red-700"
                              >
                                Kuraho
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={agent.fullName}
                            onChange={(e) => updateBuyerAgent(index, 'fullName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Amazina"
                          />
                          <input
                            type="tel"
                            value={agent.phone}
                            onChange={(e) => updateBuyerAgent(index, 'phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Telefoni"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addBuyerAgent}
                        className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        + Ongeraho agent
                      </button>
                    </div>
                </>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-gray-700 space-y-2">
                  <div className="text-xs font-semibold text-gray-700 uppercase">
                    {selectedPartyRole === 'buyer' ? '13. Icyitonderwa' : '13. Icyitonderwa'}
                  </div>
                  <p>Aya masezerano ashobora kwemezwa hifashishijwe button iri kuri website.</p>
                  <p>Ashobora koherezwa kuri email y'impande zombi.</p>
                  <p>Ashobora guhindurwa bitewe n'ubwoko bw'umutungo.</p>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    required={!onSubmitContract}
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="agreeToTerms" className="text-xs text-gray-600">
                    Nemeye aya masezerano yose nta gahato mbere yo kohereza form.
                  </label>
                </div>

                {submitError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-60">Funga</button>
              <button type="submit" disabled={isSubmitting || !selectedPartyRole} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-60">
                {isSubmitting ? 'Birimo kubikwa...' : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContractModal;
