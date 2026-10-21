import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { subjectService } from '../../services/subjectService'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, QrCode, Link as LinkIcon, Share2 } from 'lucide-react'

export const ShareSubjectModal = ({ isOpen, onClose, subject }) => {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [loading, setLoading] = useState(false)

  const frontendBase = window.location.origin
  const subjectCode = subject?.subject_code || ''
  const joinUrl = `${frontendBase}/student/enroll?code=${subjectCode}`

  useEffect(() => {
    if (isOpen && subject?.subject_id) {
      setLoading(true)
      subjectService
        .getShareDetails(subject.subject_id)
        .then((data) => setShareData(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, subject])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(subjectCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
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
        {/* QR Code Card */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-inner text-center">
          <div className="rounded-xl bg-white p-3 shadow-md">
            <QRCodeSVG value={joinUrl} size={180} level="M" />
          </div>
          <p className="mt-3 text-xs text-slate-400 font-medium">Scan with camera to enroll instantly</p>
        </div>

        {/* Copy Link Section */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Class Invite Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-slate-300">
              {joinUrl}
            </div>
            <Button size="sm" variant={copiedLink ? 'secondary' : 'primary'} onClick={handleCopyLink}>
              {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* Subject Code Section */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Subject Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm font-mono font-bold tracking-wider text-indigo-400">
              {subjectCode}
            </div>
            <Button size="sm" variant="tertiary" onClick={handleCopyCode}>
              {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

