'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export enum NotificationMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  LETTER = 'letter',
  IN_PERSON = 'in_person',
}

export const NotificationMethodLabels: Record<NotificationMethod, string> = {
  [NotificationMethod.EMAIL]: 'Email',
  [NotificationMethod.PHONE]: 'Phone',
  [NotificationMethod.LETTER]: 'Letter',
  [NotificationMethod.IN_PERSON]: 'In Person',
};

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (method: NotificationMethod, notes: string) => Promise<void>;
  title?: string;
  description?: string;
}

export function NotificationDialog({
  open,
  onOpenChange,
  onSubmit,
  title = 'Notify Parent',
  description = 'Select notification method and add any notes',
}: NotificationDialogProps) {
  const [method, setMethod] = useState<NotificationMethod>(NotificationMethod.EMAIL);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!method) return;
    setLoading(true);
    try {
      await onSubmit(method, notes);
      setMethod(NotificationMethod.EMAIL);
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting notification:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="method">
              Notification Method <span className="text-red-500">*</span>
            </Label>
            <Select value={method} onValueChange={(value) => setMethod(value as NotificationMethod)}>
              <SelectTrigger id="method" className="w-full">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NotificationMethodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setMethod(NotificationMethod.EMAIL);
              setNotes('');
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !method}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (notes: string) => Promise<void>;
}

export function CompletionDialog({ open, onOpenChange, onSubmit }: CompletionDialogProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      await onSubmit(notes);
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting completion:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Action</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">Add completion notes</p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="completion-notes">
              Completion Notes <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="completion-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter completion notes..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setNotes('');
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !notes.trim()}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Complete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

