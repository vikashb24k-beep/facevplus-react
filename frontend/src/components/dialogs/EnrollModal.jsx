import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { subjectService } from '../../services/subjectService'
import { Hash, CheckCircle } from 'lucide-react'

export const EnrollModal = ({ isOpen, onClose, onEnrolled }) => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter a subject code.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await subjectService.enrollStudent(code.trim().toUpperCase())
      setSuccess(res.message || 'Successfully enrolled!')
      setTimeout(() => {
        onEnrolled()
        onClose()
      }, 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to enroll. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll in Subject"
      subtitle="Enter the subject code provided by your teacher"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <Input
          label="Subject Code"
          id="enroll_code"
          placeholder="e.g. CS101, PHY201"
          icon={Hash}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoFocus
        />

        <div className="mt-6 flex items-center justify-end gap-3 pt-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={Boolean(success)}>
            Enroll Now
          </Button>
        </div>
      </form>
    </Modal>
  )
}

