const mongoose = require('mongoose');

const buyerAgentSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const signedContractFormSchema = new mongoose.Schema(
  {
    contractPartyRole: { type: String, trim: true, default: '' },
    buyerAgents: { type: [buyerAgentSchema], default: [] },
    sellerName: { type: String, trim: true, default: '' },
    sellerPhone: { type: String, trim: true, default: '' },
    sellerEmail: { type: String, trim: true, default: '' },
    sellerAddress: { type: String, trim: true, default: '' },
    sellerNationalId: { type: String, trim: true, default: '' },
    buyerName: { type: String, trim: true, default: '' },
    buyerPhone: { type: String, trim: true, default: '' },
    buyerEmail: { type: String, trim: true, default: '' },
    buyerAddress: { type: String, trim: true, default: '' },
    buyerNationalId: { type: String, trim: true, default: '' },
    assetType: { type: String, trim: true, default: '' },
    otherAssetType: { type: String, trim: true, default: '' },
    assetDescription: { type: String, trim: true, default: '' },
    agreedPrice: { type: String, trim: true, default: '' },
    agreementDuration: { type: String, trim: true, default: '' },
    paymentMethod: { type: String, trim: true, default: '' },
    otherPaymentMethod: { type: String, trim: true, default: '' },
    paymentDate: { type: String, trim: true, default: '' },
    sellerSignatureName: { type: String, trim: true, default: '' },
    sellerSignatureDate: { type: String, trim: true, default: '' },
    buyerSignatureName: { type: String, trim: true, default: '' },
    buyerSignatureDate: { type: String, trim: true, default: '' },
    agreeToTerms: { type: Boolean, default: false },
  },
  { _id: false }
);

const signedContractSchema = new mongoose.Schema(
  {
    itemId: { type: String, default: null },
    itemName: { type: String, trim: true, required: true },
    itemType: { type: String, trim: true, default: 'General' },
    price: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, default: 'submitted' },
    formData: { type: signedContractFormSchema, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('SignedContract', signedContractSchema);
