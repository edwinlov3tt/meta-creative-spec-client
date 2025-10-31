import React from 'react'
import { FormWizard } from './FormWizard'
import { AdvertiserInfoStep } from './steps/AdvertiserInfoStep'
import { AdCopyStep } from './steps/AdCopyStep'
import { useCreativeStore } from '@/stores/creativeStore'

export const FormBuilder: React.FC = () => {
  const isPreviewMode = useCreativeStore(state => state.isPreviewMode)

  return (
    <FormWizard>
      <AdvertiserInfoStep fullPage isPreview={isPreviewMode} />
      <AdCopyStep fullPage isPreview={isPreviewMode} />
    </FormWizard>
  )
}