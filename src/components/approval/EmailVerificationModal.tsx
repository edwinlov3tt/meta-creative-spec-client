import React, { useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';
import { Mail, AlertCircle } from 'lucide-react';

interface EmailVerificationModalProps {
  onVerify: (email: string) => Promise<boolean>;
  isVerifying: boolean;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  onVerify,
  isVerifying,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const isValid = await onVerify(email.trim().toLowerCase());

    if (!isValid) {
      setError('This email is not authorized to access this approval request');
    }
  };

  return (
    <>
      {/* Backdrop with blur - prevents viewing content */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-meta-blue bg-opacity-10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-meta-blue" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-22 font-semibold text-text-primary text-center mb-2">
            Verify Your Email
          </h2>
          <p className="text-14 text-text-muted text-center mb-6">
            Enter your email address to access this approval request
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-13 font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(''); // Clear error on input change
                }}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-meta-blue focus:border-transparent text-15"
                placeholder="your.email@company.com"
                required
                autoFocus
                disabled={isVerifying}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-13 text-red-700">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              variant="default"
              className="w-full min-h-[48px] text-15 font-semibold"
              disabled={isVerifying || !email}
            >
              {isVerifying ? (
                <>
                  <Spinner className="w-5 h-5 mr-2" />
                  Verifying...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>

          {/* Info text */}
          <div className="mt-6 pt-6 border-t border-divider">
            <p className="text-12 text-text-muted text-center">
              Only participants included in the approval request can access this page.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
