/**
 * Meeting Scheduler Component
 * Allows selecting tentative dates and sending meeting requests
 */

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  Send,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { messagingService } from '../services/messagingService';
import { sanitizeInput, validateUuid } from '../utils/security';

export function MeetingScheduler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('userId');
  const userName = searchParams.get('userName') || 'User';
  const company = searchParams.get('company') || '';
  const userRole = searchParams.get('userRole') || 'venture';

  const [tentativeDates, setTentativeDates] = useState<string[]>(['']);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDate = () => {
    if (tentativeDates.length < 5) {
      setTentativeDates([...tentativeDates, '']);
    } else {
      toast.info('Maximum 5 tentative dates allowed');
    }
  };

  const handleRemoveDate = (index: number) => {
    if (tentativeDates.length > 1) {
      setTentativeDates(tentativeDates.filter((_, i) => i !== index));
    }
  };

  const handleDateChange = (index: number, value: string) => {
    const newDates = [...tentativeDates];
    newDates[index] = value;
    setTentativeDates(newDates);
  };

  const handleSubmit = async () => {
    // Validation
    if (!userId || !validateUuid(userId)) {
      toast.error('Invalid user ID');
      return;
    }

    const validDates = tentativeDates.filter(date => date.trim() !== '');
    if (validDates.length === 0) {
      toast.error('Please select at least one tentative date');
      return;
    }

    // Validate dates are in the future
    const now = new Date();
    const invalidDates = validDates.filter(date => {
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) || dateObj <= now;
    });
    
    if (invalidDates.length > 0) {
      toast.error('All dates must be in the future');
      return;
    }

    // Sanitize inputs
    const sanitizedTitle = meetingTitle ? sanitizeInput(meetingTitle, 200) : '';
    const sanitizedDescription = meetingDescription ? sanitizeInput(meetingDescription, 1000) : '';

    setIsSubmitting(true);
    try {
      // Create or get conversation with the user
      let conversationId = 'new';
      try {
        const conversations = await messagingService.getConversations();
        const existingConv = conversations.find(c => c.other_participant?.id === userId);
        if (existingConv) {
          conversationId = existingConv.id;
        }
      } catch (error) {
        console.log('No existing conversation, will create new one');
      }

      // Format the meeting request message
      const datesList = validDates.map((date, idx) => {
        const dateObj = new Date(date);
        return `${idx + 1}. ${dateObj.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })} at ${dateObj.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }).join('\n');

      let messageBody = `Meeting Request${sanitizedTitle ? `: ${sanitizedTitle}` : ''}\n\n`;
      messageBody += `Tentative Dates:\n${datesList}\n\n`;
      
      if (sanitizedDescription) {
        messageBody += `Additional Notes:\n${sanitizedDescription}`;
      }

      // Send the meeting request as a message
      await messagingService.sendMessage(conversationId, messageBody, userId);

      toast.success('Meeting request sent successfully!');
      
      // Navigate back to portfolio or messages
      navigate('/dashboard/investor/portfolio');
    } catch (error: any) {
      console.error('Failed to send meeting request:', error);
      toast.error(error.message || 'Failed to send meeting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/investor/portfolio')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portfolio
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Schedule Meeting</h1>
            <p className="text-muted-foreground">
              {company ? `with ${company}` : `with ${userName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Meeting Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Meeting Request</span>
          </CardTitle>
          <CardDescription>
            Select tentative dates and provide meeting details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Quarterly Review, Product Demo, Strategy Discussion"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Tentative Dates */}
          <div className="space-y-2">
            <Label>Tentative Dates *</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select at least one date and time for the meeting. The recipient will be able to choose from these options.
            </p>
            <div className="space-y-3">
              {tentativeDates.map((date, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => handleDateChange(index, e.target.value)}
                    className="flex-1"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {tentativeDates.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDate(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {tentativeDates.length < 5 && (
                <Button
                  variant="outline"
                  onClick={handleAddDate}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Date
                </Button>
              )}
            </div>
          </div>

          {/* Meeting Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Notes (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional context, agenda items, or special requirements for the meeting..."
              value={meetingDescription}
              onChange={(e) => setMeetingDescription(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {meetingDescription.length}/1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/investor/portfolio')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || tentativeDates.filter(d => d.trim()).length === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Meeting Request
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start space-x-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Select multiple tentative dates and times for your meeting</span>
            </li>
            <li className="flex items-start space-x-2">
              <Send className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>The meeting request will be sent as a message to the recipient</span>
            </li>
            <li className="flex items-start space-x-2">
              <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>The recipient can review the dates and respond with their preferred option</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
