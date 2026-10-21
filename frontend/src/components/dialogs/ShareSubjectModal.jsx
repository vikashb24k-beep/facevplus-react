import React, { useEffect, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Download } from 'lucide-react'
import { subjectService } from '../../services/subjectService'

export const ShareSubjectModal = ({ isOpen, onClose, subject }) => {
  const [shareData, setShareData] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!isOpen || !subject?.subject_id) return
    setShareData(null)
    setError('')
    subjectService.getShareDetails(subject.subject_id)
      .then(setShareData)
      .catch(() => setError('Unable to create the invitation link.'))
  }, [isOpen, subject?.subject_id])

  const subjectCode = shareData?.subject_code || subject?.subject_code || ''
  const joinUrl = shareData?.join_url || ''

  const copyValue = async (value, label) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleDownload = () => {
    if (!shareData?.qr_data_url) return
    const link = document.createElement('a')
    link.href = shareData.qr_data_url
    link.download = `${subjectCode}-join-qr.png`
    link.click()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share ${subject?.name || 'Class'}`}
      subtitle={`Code: ${subjectCode} | Section: ${subject?.section || ''}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!shareData && !error && <p className="text-sm text-slate-400">Generating secure invitation...</p>}
        {shareData && (
          <>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center shadow-inner">
              <div className="rounded-xl bg-white p-3 shadow-md">
                <QRCodeSVG value={joinUrl} size={180} level="M" />
              </div>
              <Button size="sm" variant="tertiary" onClick={handleDownload} icon={Download}>
                Download QR Code
              </Button>
              <p className="mt-3 text-xs font-medium text-slate-400">Scan with camera to enroll instantly</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Class Invite Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 truncate rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-slate-300">{joinUrl}</div>
                <Button size="sm" variant={copied === 'link' ? 'secondary' : 'primary'} onClick={() => copyValue(joinUrl, 'link')}>
                  {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied === 'link' ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Subject Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm font-mono font-bold tracking-wider text-indigo-400">{subjectCode}</div>
            <Button size="sm" variant="tertiary" onClick={() => copyValue(subjectCode, 'code')}>
              {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied === 'code' ? 'Copied' : 'Copy Code'}</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
