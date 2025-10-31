import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ApprovalRequestWithDetails } from '@/types/approval';

interface Revision {
  fieldPath: string;
  fieldLabel: string;
  originalValue: string;
  revisedValue: string;
}

interface ApprovalContextValue {
  approvalData: ApprovalRequestWithDetails | null;
  userEmail: string | null;
  isRevisionMode: boolean;
  revisions: Record<string, Revision>;
  revisionCount: number;
  addRevision: (fieldPath: string, fieldLabel: string, originalValue: string, revisedValue: string) => void;
  clearRevisions: () => void;
  setApprovalData: (data: ApprovalRequestWithDetails | null) => void;
  setUserEmail: (email: string | null) => void;
}

const ApprovalContext = createContext<ApprovalContextValue | undefined>(undefined);

export const useApproval = () => {
  const context = useContext(ApprovalContext);
  if (!context) {
    throw new Error('useApproval must be used within ApprovalProvider');
  }
  return context;
};

interface ApprovalProviderProps {
  children: ReactNode;
}

export const ApprovalProvider: React.FC<ApprovalProviderProps> = ({ children }) => {
  const [approvalData, setApprovalData] = useState<ApprovalRequestWithDetails | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<Record<string, Revision>>({});

  // Revision mode is active when current participant has rejected
  const currentParticipant = userEmail && approvalData
    ? approvalData.participants.find(p => p.email.toLowerCase() === userEmail.toLowerCase())
    : null;
  const isRevisionMode = currentParticipant?.status === 'rejected';

  // Debug logging
  React.useEffect(() => {
    console.log('[ApprovalContext] State update:', {
      userEmail,
      approvalDataExists: !!approvalData,
      currentParticipantStatus: currentParticipant?.status,
      isRevisionMode,
      participants: approvalData?.participants?.map(p => ({ email: p.email, status: p.status }))
    });
  }, [userEmail, approvalData, currentParticipant, isRevisionMode]);

  const addRevision = (fieldPath: string, fieldLabel: string, originalValue: string, revisedValue: string) => {
    setRevisions(prev => ({
      ...prev,
      [fieldPath]: {
        fieldPath,
        fieldLabel,
        originalValue,
        revisedValue,
      },
    }));
  };

  const clearRevisions = () => {
    setRevisions({});
  };

  const revisionCount = Object.keys(revisions).length;

  const value: ApprovalContextValue = {
    approvalData,
    userEmail,
    isRevisionMode,
    revisions,
    revisionCount,
    addRevision,
    clearRevisions,
    setApprovalData,
    setUserEmail,
  };

  return <ApprovalContext.Provider value={value}>{children}</ApprovalContext.Provider>;
};
