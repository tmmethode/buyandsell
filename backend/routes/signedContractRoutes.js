const express = require('express');
const SignedContract = require('../models/SignedContract');
const { protect, authorize } = require('../middleware/auth');
const { generateContractPdfBuffer } = require('../services/contractPdfService');
const { sendContractSubmissionEmails } = require('../services/emailService');

const router = express.Router();

const buildContractTitle = (formData = {}, fallbackName = 'Amasezerano') => {
  const buyerName = (formData.buyerName || '').trim();
  const sellerName = (formData.sellerName || '').trim();
  const buyerFirstName = buyerName.split(/\s+/)[0] || 'Buyer';
  const sellerParts = sellerName.split(/\s+/).filter(Boolean);
  const sellerLastName = sellerParts[sellerParts.length - 1] || 'Seller';
  const contractPartyRole = formData.contractPartyRole;
  const assetName = (formData.assetDescription || fallbackName).trim() || fallbackName;
  if (contractPartyRole === 'seller') {
    return `Seller - ${sellerLastName} - ${assetName} Contract`;
  }

  if (contractPartyRole === 'buyer') {
    return `Buyer - ${buyerFirstName} - ${assetName} Contract`;
  }

  return `${buyerFirstName} - ${sellerLastName} - ${assetName} Contract`;
};


const resolveIndividualEmail = (formData = {}) => {
  if (formData.contractPartyRole === 'buyer') {
    return formData.buyerEmail || formData.sellerEmail || '';
  }

  if (formData.contractPartyRole === 'seller') {
    return formData.sellerEmail || formData.buyerEmail || '';
  }

  return formData.buyerEmail || formData.sellerEmail || '';
};

const resolveCompanyOwnerEmail = () => {
  return process.env.CONTRACT_OWNER_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || '';
};

const normalizeContractPayload = (payload = {}) => {
  const formData = payload.formData || {};
  const normalizedBuyerAgents = Array.isArray(formData.buyerAgents)
    ? formData.buyerAgents.map((agent = {}) => ({
        fullName: agent.fullName || '',
        phone: agent.phone || '',
      }))
    : [];
  const resolvedItemType =
    formData.assetType === 'Ibindi'
      ? formData.otherAssetType || 'Ibindi'
      : formData.assetType || payload.itemType || 'General';

  return {
    itemId: payload.itemId || null,
    itemName: buildContractTitle(
      formData,
      payload.itemName || formData.assetDescription || 'Amasezerano'
    ),
    itemType: resolvedItemType,
    price: formData.agreedPrice || payload.price || '',
    status: payload.status || 'submitted',
    formData: {
      contractPartyRole: formData.contractPartyRole || '',
      buyerAgents: normalizedBuyerAgents,
      sellerName: formData.sellerName || '',
      sellerPhone: formData.sellerPhone || '',
      sellerEmail: formData.sellerEmail || '',
      sellerAddress: formData.sellerAddress || '',
      sellerNationalId: formData.sellerNationalId || '',
      buyerName: formData.buyerName || '',
      buyerPhone: formData.buyerPhone || '',
      buyerEmail: formData.buyerEmail || '',
      buyerAddress: formData.buyerAddress || '',
      buyerNationalId: formData.buyerNationalId || '',
      assetType: formData.assetType || '',
      otherAssetType: formData.otherAssetType || '',
      assetDescription: formData.assetDescription || '',
      agreedPrice: formData.agreedPrice || '',
      agreementDuration: formData.agreementDuration || '',
      paymentMethod: formData.paymentMethod || '',
      otherPaymentMethod: formData.otherPaymentMethod || '',
      paymentDate: formData.paymentDate || '',
      sellerSignatureName: formData.sellerSignatureName || '',
      sellerSignatureDate: formData.sellerSignatureDate || '',
      buyerSignatureName: formData.buyerSignatureName || '',
      buyerSignatureDate: formData.buyerSignatureDate || '',
      agreeToTerms: Boolean(formData.agreeToTerms),
    },
  };
};

router.post('/', async (req, res) => {
  try {
    const payload = normalizeContractPayload(req.body);
    const hasSellerDetails = Boolean(
      payload.formData.sellerName &&
        payload.formData.sellerPhone &&
        payload.formData.sellerAddress
    );
    const hasBuyerDetails = Boolean(
      payload.formData.buyerName &&
        payload.formData.buyerPhone &&
        payload.formData.buyerAddress
    );

    if (!payload.formData.contractPartyRole) {
      return res.status(400).json({
        success: false,
        message: 'Buyer or seller contract selection is required',
      });
    }

    if (!hasBuyerDetails && !hasSellerDetails) {
      return res.status(400).json({
        success: false,
        message: 'Buyer or seller details are required',
      });
    }

    if (!payload.formData.agreeToTerms) {
      return res.status(400).json({
        success: false,
        message: 'Agreement to terms is required',
      });
    }

    const createdContract = await SignedContract.create(payload);

    const companyOwnerEmail = resolveCompanyOwnerEmail();
    const individualEmail = resolveIndividualEmail(createdContract.formData || {});
    const recipients = [companyOwnerEmail, individualEmail].filter(Boolean);

    let emailDelivery = { skipped: true, reason: 'Email was not attempted' };

    try {
      const pdfBuffer = await generateContractPdfBuffer(createdContract);
      emailDelivery = await sendContractSubmissionEmails({
        contract: createdContract,
        recipients,
        pdfBuffer,
      });
    } catch (emailError) {
      emailDelivery = {
        skipped: true,
        reason: 'Failed to send contract email',
        error: emailError.message,
      };
      console.error('Contract email delivery error:', emailError);
    }

    return res.status(201).json({
      success: true,
      data: createdContract,
      emailDelivery,
    });
  } catch (error) {
    console.error('Create signed contract error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save contract' });
  }
});

router.use(protect);
router.use(authorize('admin'));

router.get('/', async (req, res) => {
  try {
    const contracts = await SignedContract.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: contracts });
  } catch (error) {
    console.error('Fetch signed contracts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch contracts' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = normalizeContractPayload(req.body);
    const updatedContract = await SignedContract.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updatedContract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    return res.json({ success: true, data: updatedContract });
  } catch (error) {
    console.error('Update signed contract error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update contract' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedContract = await SignedContract.findByIdAndDelete(req.params.id);

    if (!deletedContract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    return res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Delete signed contract error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete contract' });
  }
});

module.exports = router;
