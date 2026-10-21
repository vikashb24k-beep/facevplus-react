import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { subjectService } from '../../services/subjectService'
import { BookOpen, Hash, Layers } from 'lucide-react'

export const CreateSubjectModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    subject_code: '',
    name: '',
    section: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.subject_code || !formData.name || !formData.section) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const newSubject = await subjectService.createSubject(formData)
      onCreated(newSubject)
      setFormData({ subject_code: '', name: '', section: '' })
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create subject.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Subject"
      subtitle="Enter details for the new course and section"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Subject Code"
          id="subject_code"
          placeholder="e.g. CS101, MATH202"
          icon={Hash}
          value={formData.subject_code}
          onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
        />

        <Input
          label="Subject Name"
          id="name"
          placeholder="e.g. Operating Systems"
          icon={BookOpen}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <Input
          label="Section"
          id="section"
          placeholder="e.g. A, B, Morning"
          icon={Layers}
          value={formData.section}
          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
        />

        <div className="mt-6 flex items-center justify-end gap-3 pt-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create Subject
          </Button>
        </div>
      </form>
    </Modal>
  )
}

