import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Spinner } from '../UI/Spinner';
import { Mail, Link2, Plus, X, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type {
  ShareMethod,
  StakeholderRole,
  ApprovalShareFormData,
} from '@/types/approval';

interface ParticipantInput {
  email: string;
  name: string;
  role: StakeholderRole;
}

interface ApprovalShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: number;
  advertiserId: number;
  onSubmit: (data: ApprovalShareFormData) => Promise<void>;
}

export const ApprovalShareModal: React.FC<ApprovalShareModalProps> = ({
  isOpen,
  onClose,
  advertiserId,
  onSubmit,
}) => {
  const [shareMethod, setShareMethod] = useState<ShareMethod>('email');
  const [emailRestrictions, setEmailRestrictions] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [initiatedByEmail, setInitiatedByEmail] = useState<string>('');

  const [tier1Participants, setTier1Participants] = useState<ParticipantInput[]>([]);
  const [tier2Participants, setTier2Participants] = useState<ParticipantInput[]>([]);
  const [tier3Participants, setTier3Participants] = useState<ParticipantInput[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && advertiserId) {
      loadStakeholders();
    }
  }, [isOpen, advertiserId]);

  const loadStakeholders = async () => {
    // Placeholder for loading stakeholders from advertiser
    // In Phase 2, we'll populate participant fields from saved stakeholders
    console.log('Load stakeholders for advertiser:', advertiserId);
  };

  const addParticipant = (tier: 1 | 2 | 3) => {
    const emptyParticipant: ParticipantInput = { email: '', name: '', role: 'client' };

    switch (tier) {
      case 1:
        setTier1Participants([...tier1Participants, emptyParticipant]);
        break;
      case 2:
        setTier2Participants([...tier2Participants, emptyParticipant]);
        break;
      case 3:
        setTier3Participants([...tier3Participants, emptyParticipant]);
        break;
    }
  };

  const removeParticipant = (tier: 1 | 2 | 3, index: number) => {
    switch (tier) {
      case 1:
        setTier1Participants(tier1Participants.filter((_, i) => i !== index));
        break;
      case 2:
        setTier2Participants(tier2Participants.filter((_, i) => i !== index));
        break;
      case 3:
        setTier3Participants(tier3Participants.filter((_, i) => i !== index));
        break;
    }
  };

  const updateParticipant = (
    tier: 1 | 2 | 3,
    index: number,
    field: keyof ParticipantInput,
    value: string
  ) => {
    const update = (participants: ParticipantInput[]) => {
      const updated = [...participants];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    };

    switch (tier) {
      case 1:
        setTier1Participants(update(tier1Participants));
        break;
      case 2:
        setTier2Participants(update(tier2Participants));
        break;
      case 3:
        setTier3Participants(update(tier3Participants));
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!initiatedByEmail) {
      setError('Please enter your email address');
      return;
    }

    if (tier1Participants.length === 0) {
      setError('At least one Tier 1 (Client) participant is required');
      return;
    }

    // Check all participants have email
    const allParticipants = [
      ...tier1Participants,
      ...tier2Participants,
      ...tier3Participants,
    ];
    const invalidParticipant = allParticipants.find((p) => !p.email);
    if (invalidParticipant) {
      setError('All participants must have an email address');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData: ApprovalShareFormData = {
        share_method: shareMethod,
        email_restrictions: emailRestrictions
          ? emailRestrictions.split(',').map((s) => s.trim())
          : [],
        expires_in_days: expiresInDays,
        participants: {
          tier_1: tier1Participants,
          tier_2: tier2Participants,
          tier_3: tier3Participants,
        },
        initiated_by_email: initiatedByEmail,
      };

      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderParticipantInputs = (
    tier: 1 | 2 | 3,
    participants: ParticipantInput[],
    tierName: string,
    tierDescription: string
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-13 sm:text-14 font-semibold text-text-primary">
            Tier {tier}: {tierName}
          </h3>
          <p className="text-11 sm:text-12 text-text-muted">{tierDescription}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addParticipant(tier)}
          className="min-h-[44px] ml-3"
        >
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-4 text-11 sm:text-12 text-text-muted">
          No participants added yet
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-2">
          {participants.map((participant, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={participant.email}
                  onChange={(e) =>
                    updateParticipant(tier, index, 'email', e.target.value)
                  }
                  className="form-input text-13 sm:text-12 min-h-[44px]"
                  required
                />
                <input
                  type="text"
                  placeholder="Name"
                  value={participant.name}
                  onChange={(e) =>
                    updateParticipant(tier, index, 'name', e.target.value)
                  }
                  className="form-input text-13 sm:text-12 min-h-[44px]"
                />
                <select
                  value={participant.role}
                  onChange={(e) =>
                    updateParticipant(
                      tier,
                      index,
                      'role',
                      e.target.value as StakeholderRole
                    )
                  }
                  className="form-select text-13 sm:text-12 min-h-[44px]"
                >
                  <option value="client">Client</option>
                  <option value="ae">AE</option>
                  <option value="dcm">DCM</option>
                  <option value="buyer">Buyer</option>
                </select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeParticipant(tier, index)}
                className="h-10 w-10 sm:h-8 sm:w-8 text-red-600 self-end sm:self-start"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share for Approval"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-12 text-red-600">{error}</p>
          </div>
        )}

        {/* Share Method */}
        <div className="space-y-2">
          <label className="text-12 font-medium text-text-primary">
            Share Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShareMethod('email')}
              className={cn(
                'flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg transition-colors min-h-[60px]',
                shareMethod === 'email'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-surface-200 bg-white hover:border-surface-300'
              )}
            >
              <Mail className="w-5 h-5 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="text-13 sm:text-14 font-medium">Email</div>
                <div className="text-11 sm:text-12 text-text-muted">
                  Send direct approval emails
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShareMethod('link')}
              className={cn(
                'flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg transition-colors min-h-[60px]',
                shareMethod === 'link'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-surface-200 bg-white hover:border-surface-300'
              )}
            >
              <Link2 className="w-5 h-5 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="text-13 sm:text-14 font-medium">Shareable Link</div>
                <div className="text-11 sm:text-12 text-text-muted">
                  Generate a secure link
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Email Restrictions (for link sharing) */}
        {shareMethod === 'link' && (
          <div className="space-y-2">
            <label className="text-12 font-medium text-text-primary">
              Email Restrictions (Optional)
            </label>
            <input
              type="text"
              placeholder="@clientdomain.com, user@example.com"
              value={emailRestrictions}
              onChange={(e) => setEmailRestrictions(e.target.value)}
              className="form-input text-13 sm:text-12 min-h-[48px]"
            />
            <p className="text-11 text-text-muted">
              Comma-separated domains or emails that can access this link
            </p>
          </div>
        )}

        {/* Expiration */}
        <div className="space-y-2">
          <label className="text-12 font-medium text-text-primary">
            Link Expires In
          </label>
          <select
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            className="form-select text-13 sm:text-12 min-h-[48px]"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>

        {/* Initiated By Email */}
        <div className="space-y-2">
          <label className="text-12 font-medium text-text-primary">
            Your Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            placeholder="your.email@example.com"
            value={initiatedByEmail}
            onChange={(e) => setInitiatedByEmail(e.target.value)}
            className="form-input text-13 sm:text-12 min-h-[48px]"
            required
          />
        </div>

        {/* Participants by Tier */}
        <div className="space-y-6 border-t border-surface-200 pt-6">
          <h3 className="text-14 font-semibold text-text-primary">
            Approval Participants
          </h3>

          {renderParticipantInputs(
            1,
            tier1Participants,
            'Client',
            'Initial client approval'
          )}

          {renderParticipantInputs(
            2,
            tier2Participants,
            'Account Executive',
            'AE review and approval'
          )}

          {renderParticipantInputs(
            3,
            tier3Participants,
            'Digital Campaign Manager',
            'Final DCM approval'
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-surface-200 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-[48px] order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[48px] order-1 sm:order-2"
          >
            {isSubmitting ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Initiating...
              </>
            ) : (
              `Initiate Approval`
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
