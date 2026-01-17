import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Separator } from "./ui/separator";
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon,
  Clock,
  Video,
  Phone,
  MapPin,
  Users,
  FileText,
  Check,
  ArrowLeft,
  ArrowRight,
  Plus,
  CheckCircle2,
  Star
} from "lucide-react";

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentee: {
    id: string;
    name: string;
    company: string;
    avatar: string;
    expertise?: string;
    nextSession?: string;
  } | null;
  mentor: {
    name: string;
    avatar: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
  booked?: boolean;
}

interface MeetingDetails {
  date: Date | undefined;
  timeSlot: string;
  duration: string;
  type: 'video' | 'phone' | 'in-person';
  topic: string;
  agenda: string;
  location?: string;
}

export function SchedulingModal({ isOpen, onClose, mentee, mentor }: SchedulingModalProps) {
  const [step, setStep] = useState<'calendar' | 'details' | 'confirmation'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails>({
    date: undefined,
    timeSlot: '',
    duration: '60',
    type: 'video',
    topic: '',
    agenda: '',
    location: ''
  });

  // Early return if mentee is null or modal is not open
  if (!isOpen || !mentee) {
    return null;
  }

  // Generate time slots for the selected date
  const generateTimeSlots = (date: Date | undefined): TimeSlot[] => {
    if (!date) return [];
    
    const slots: TimeSlot[] = [];
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const currentHour = today.getHours();
    
    // Generate slots from 9 AM to 6 PM
    for (let hour = 9; hour <= 18; hour++) {
      const time12 = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
      const time24 = `${hour.toString().padStart(2, '0')}:00`;
      
      // Mark as unavailable if it's in the past (for today) or randomly for demo
      const isPast = isToday && hour <= currentHour;
      const isBooked = Math.random() < 0.2; // 20% chance of being booked
      
      slots.push({
        time: time12,
        available: !isPast && !isBooked,
        booked: isBooked
      });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots(selectedDate);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setMeetingDetails(prev => ({ ...prev, date }));
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setMeetingDetails(prev => ({ ...prev, timeSlot }));
  };

  const handleNext = () => {
    if (step === 'calendar' && selectedDate && meetingDetails.timeSlot) {
      setStep('details');
    } else if (step === 'details') {
      setStep('confirmation');
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('calendar');
    } else if (step === 'confirmation') {
      setStep('details');
    }
  };

  const handleSchedule = () => {
    if (!mentee) return;
    
    // Here you would typically save to backend
    toast.success(`Session scheduled with ${mentee.name} for ${selectedDate?.toLocaleDateString()} at ${meetingDetails.timeSlot}`);
    onClose();
    
    // Reset state
    setStep('calendar');
    setSelectedDate(undefined);
    setMeetingDetails({
      date: undefined,
      timeSlot: '',
      duration: '60',
      type: 'video',
      topic: '',
      agenda: '',
      location: ''
    });
  };

  const renderProgressIndicator = () => (
    <div className="flex items-center justify-center mb-16">
      <div className="flex items-center space-x-12">
        {/* Step 1 */}
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            step === 'calendar' 
              ? 'border-primary bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/30' 
              : selectedDate && meetingDetails.timeSlot
              ? 'border-success bg-success text-success-foreground shadow-lg'
              : 'border-muted-foreground/30 bg-background text-muted-foreground'
          }`}>
            {selectedDate && meetingDetails.timeSlot && step !== 'calendar' ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <CalendarIcon className="w-8 h-8" />
            )}
          </div>
          <div className="text-center">
            <p className={`font-bold text-base ${step === 'calendar' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Date & Time
            </p>
            <p className="text-sm text-muted-foreground">Select when to meet</p>
          </div>
        </div>
        
        {/* Connector */}
        <div className="w-24 h-px bg-border"></div>
        
        {/* Step 2 */}
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            step === 'details' 
              ? 'border-primary bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/30' 
              : step === 'confirmation'
              ? 'border-success bg-success text-success-foreground shadow-lg'
              : 'border-muted-foreground/30 bg-background text-muted-foreground'
          }`}>
            {step === 'confirmation' ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <FileText className="w-8 h-8" />
            )}
          </div>
          <div className="text-center">
            <p className={`font-bold text-base ${step === 'details' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Session Details
            </p>
            <p className="text-sm text-muted-foreground">Configure the meeting</p>
          </div>
        </div>
        
        {/* Connector */}
        <div className="w-24 h-px bg-border"></div>
        
        {/* Step 3 */}
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            step === 'confirmation' 
              ? 'border-primary bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/30' 
              : 'border-muted-foreground/30 bg-background text-muted-foreground'
          }`}>
            <Check className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className={`font-bold text-base ${step === 'confirmation' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Confirmation
            </p>
            <p className="text-sm text-muted-foreground">Review & confirm</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalendarStep = () => (
    <div className="space-y-10">
      {/* Mentee Info Card */}
      <Card className="shadow-medium border-0 bg-gradient-to-r from-background via-muted/30 to-background">
        <CardContent className="p-10">
          <div className="flex items-center space-x-8">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20 shadow-xl">
              <AvatarImage src={mentee?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-3xl font-bold">
                {mentee?.name?.[0] || 'M'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-foreground mb-3">{mentee?.name || 'Unknown'}</h3>
              <p className="text-xl text-muted-foreground mb-4">{mentee?.company || 'Unknown Company'}</p>
              <div className="flex items-center space-x-4">
                {mentee?.expertise && (
                  <Badge variant="secondary" className="px-4 py-2 text-base">
                    <Star className="w-4 h-4 mr-2" />
                    {mentee.expertise}
                  </Badge>
                )}
                <Badge variant="outline" className="px-4 py-2 text-base">
                  Mentee
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-12">
        {/* Calendar - Takes 2 columns on 2xl screens */}
        <div className="2xl:col-span-2">
          <Card className="shadow-medium h-full">
            <CardHeader className="pb-8">
              <CardTitle className="flex items-center space-x-4 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                </div>
                <span>Select Date</span>
              </CardTitle>
              <CardDescription className="text-lg">
                Choose an available date for your mentoring session
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-10">
              <div className="transform scale-125">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  className="rounded-lg border shadow-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Slots - Takes 1 column on 2xl screens */}
        <div className="2xl:col-span-1">
          <Card className="shadow-medium h-full">
            <CardHeader className="pb-8">
              <CardTitle className="flex items-center space-x-4 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <span>Available Times</span>
              </CardTitle>
              <CardDescription className="text-lg">
                {selectedDate 
                  ? `Available slots for ${selectedDate.toLocaleDateString()}`
                  : 'Select a date to see available times'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              {selectedDate ? (
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available ? handleTimeSlotSelect(slot.time) : null}
                      disabled={!slot.available}
                      className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                        meetingDetails.timeSlot === slot.time
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-lg'
                          : slot.available
                          ? 'border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-md'
                          : 'border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="font-bold text-xl">{slot.time}</div>
                      {slot.booked && (
                        <div className="text-sm text-destructive mt-1">Unavailable</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <Clock className="w-24 h-24 mx-auto mb-8 opacity-30" />
                  <p className="text-xl font-semibold mb-3">Select a date first</p>
                  <p className="text-base">Then choose your preferred time slot</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-10">
      {/* Selected Date & Time Summary */}
      <Card className="shadow-medium border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5">
        <CardContent className="p-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="w-10 h-10 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{selectedDate?.toLocaleDateString()}</p>
                <p className="text-xl text-muted-foreground">{meetingDetails.timeSlot}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 px-6 py-3 text-base">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Time Selected
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-12">
        {/* Meeting Configuration */}
        <Card className="shadow-medium">
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <span>Meeting Configuration</span>
            </CardTitle>
            <CardDescription className="text-lg">Configure your mentoring session settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-10 pb-10">
            {/* Duration */}
            <div className="space-y-4">
              <Label htmlFor="duration" className="text-lg font-bold">Session Duration</Label>
              <Select 
                value={meetingDetails.duration} 
                onValueChange={(value) => setMeetingDetails(prev => ({ ...prev, duration: value }))}
              >
                <SelectTrigger className="bg-input-background h-14 text-lg">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meeting Type */}
            <div className="space-y-4">
              <Label className="text-lg font-bold">Meeting Type</Label>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setMeetingDetails(prev => ({ ...prev, type: 'video' }))}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                    meetingDetails.type === 'video'
                      ? 'border-primary bg-primary/10 text-primary shadow-lg'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-6">
                    <Video className="w-10 h-10" />
                    <div className="text-left">
                      <div className="font-bold text-xl">Video Call</div>
                      <div className="text-base text-muted-foreground">Meet via video conference</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setMeetingDetails(prev => ({ ...prev, type: 'phone' }))}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                    meetingDetails.type === 'phone'
                      ? 'border-primary bg-primary/10 text-primary shadow-lg'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-6">
                    <Phone className="w-10 h-10" />
                    <div className="text-left">
                      <div className="font-bold text-xl">Phone Call</div>
                      <div className="text-base text-muted-foreground">Audio call only</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setMeetingDetails(prev => ({ ...prev, type: 'in-person' }))}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                    meetingDetails.type === 'in-person'
                      ? 'border-primary bg-primary/10 text-primary shadow-lg'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-6">
                    <MapPin className="w-10 h-10" />
                    <div className="text-left">
                      <div className="font-bold text-xl">In-Person</div>
                      <div className="text-base text-muted-foreground">Meet face to face</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Location (if in-person) */}
            {meetingDetails.type === 'in-person' && (
              <div className="space-y-4">
                <Label htmlFor="location" className="text-lg font-bold">Meeting Location</Label>
                <Input
                  id="location"
                  placeholder="Enter meeting location"
                  value={meetingDetails.location}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-input-background h-14 text-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Content */}
        <Card className="shadow-medium">
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <span>Session Content</span>
            </CardTitle>
            <CardDescription className="text-lg">What will you focus on in this session?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-10 pb-10">
            {/* Topic */}
            <div className="space-y-4">
              <Label htmlFor="topic" className="text-lg font-bold">Main Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Product Development Strategy"
                value={meetingDetails.topic}
                onChange={(e) => setMeetingDetails(prev => ({ ...prev, topic: e.target.value }))}
                className="bg-input-background h-14 text-lg"
              />
            </div>

            {/* Quick Topic Suggestions */}
            <div className="space-y-4">
              <Label className="text-lg font-bold">Quick Topics</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Fundraising Strategy',
                  'Product Development',
                  'Go-to-Market',
                  'Team Building',
                  'Financial Planning',
                  'Sales Strategy'
                ].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setMeetingDetails(prev => ({ ...prev, topic }))}
                    className="p-4 text-base border-2 rounded-xl hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 text-left"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Agenda */}
            <div className="space-y-4">
              <Label htmlFor="agenda" className="text-lg font-bold">Session Agenda</Label>
              <Textarea
                id="agenda"
                placeholder="Describe what you plan to cover and what goals you want to achieve in this session..."
                value={meetingDetails.agenda}
                onChange={(e) => setMeetingDetails(prev => ({ ...prev, agenda: e.target.value }))}
                rows={6}
                className="bg-input-background resize-none text-lg"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-10">
      {/* Success Header */}
      <div className="text-center py-12">
        <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-success" />
        </div>
        <h3 className="text-4xl font-bold mb-6">Almost Ready!</h3>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Please review your session details before confirming your mentoring appointment
        </p>
      </div>

      {/* Session Summary */}
      <Card className="shadow-strong">
        <CardHeader className="pb-8">
          <CardTitle className="text-3xl">Session Summary</CardTitle>
          <CardDescription className="text-lg">Review all the details before confirming</CardDescription>
        </CardHeader>
        <CardContent className="space-y-10 pb-10">
          {/* Participants */}
          <div className="flex items-center justify-center space-x-12 p-8 bg-muted/30 rounded-2xl">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-20 h-20 ring-2 ring-border">
                <AvatarImage src={mentor.avatar} />
                <AvatarFallback className="text-xl">{mentor.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-bold text-lg">{mentor.name}</p>
                <p className="text-base text-muted-foreground">Mentor</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <Users className="w-12 h-12 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Session</div>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-20 h-20 ring-2 ring-border">
                <AvatarImage src={mentee?.avatar} />
                <AvatarFallback className="text-xl">{mentee?.name?.[0] || 'M'}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-bold text-lg">{mentee?.name || 'Unknown'}</p>
                <p className="text-base text-muted-foreground">Mentee</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Session Details */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <CalendarIcon className="w-8 h-8 text-muted-foreground mt-1" />
                <div>
                  <p className="font-bold text-xl">Date & Time</p>
                  <p className="text-lg text-muted-foreground">
                    {selectedDate?.toLocaleDateString()} at {meetingDetails.timeSlot}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <Clock className="w-8 h-8 text-muted-foreground mt-1" />
                <div>
                  <p className="font-bold text-xl">Duration</p>
                  <p className="text-lg text-muted-foreground">{meetingDetails.duration} minutes</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                {meetingDetails.type === 'video' && <Video className="w-8 h-8 text-muted-foreground mt-1" />}
                {meetingDetails.type === 'phone' && <Phone className="w-8 h-8 text-muted-foreground mt-1" />}
                {meetingDetails.type === 'in-person' && <MapPin className="w-8 h-8 text-muted-foreground mt-1" />}
                <div>
                  <p className="font-bold text-xl">Meeting Type</p>
                  <p className="text-lg text-muted-foreground capitalize">
                    {meetingDetails.type === 'in-person' ? 'In-person' : meetingDetails.type}
                    {meetingDetails.type === 'in-person' && meetingDetails.location && (
                      <span> at {meetingDetails.location}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {meetingDetails.topic && (
                <div className="flex items-start space-x-6">
                  <FileText className="w-8 h-8 text-muted-foreground mt-1" />
                  <div>
                    <p className="font-bold text-xl">Topic</p>
                    <p className="text-lg text-muted-foreground">{meetingDetails.topic}</p>
                  </div>
                </div>
              )}

              {meetingDetails.agenda && (
                <div className="flex items-start space-x-6">
                  <div className="w-8 h-8 mt-1" />
                  <div>
                    <p className="font-bold text-xl">Agenda</p>
                    <p className="text-lg text-muted-foreground leading-relaxed">{meetingDetails.agenda}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What happens next */}
      <Card className="shadow-medium border-2 border-info/20 bg-gradient-to-r from-info/5 to-info/10">
        <CardHeader className="pb-8">
          <CardTitle className="text-2xl flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-info flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span>What happens next?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="space-y-6">
            {[
              `Both you and ${mentee?.name || 'your mentee'} will receive calendar invitations`,
              'A reminder will be sent 24 hours before the session',
              meetingDetails.type === 'video' 
                ? 'A video call link will be provided' 
                : meetingDetails.type === 'phone'
                ? 'Phone numbers will be shared privately'
                : 'Location details will be confirmed'
            ].map((text, index) => (
              <div key={index} className="flex items-start space-x-5">
                <div className="w-3 h-3 bg-info rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-lg text-muted-foreground leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full min-w-[90vw] 2xl:min-w-[85vw] max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-12 pb-8 border-b bg-gradient-to-r from-background via-muted/20 to-background">
          <DialogTitle className="text-4xl font-bold">
            {step === 'calendar' && 'Schedule Mentoring Session'}
            {step === 'details' && 'Configure Session Details'}
            {step === 'confirmation' && 'Confirm Your Session'}
          </DialogTitle>
          <DialogDescription className="text-xl mt-4">
            {step === 'calendar' && 'Choose a date and time for your mentoring session'}
            {step === 'details' && 'Configure your session details and agenda'}
            {step === 'confirmation' && 'Review and confirm your session details'}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="p-12 space-y-12">
          {/* Progress Indicator */}
          {renderProgressIndicator()}

          {/* Step Content */}
          <div className="min-h-[600px]">
            {step === 'calendar' && renderCalendarStep()}
            {step === 'details' && renderDetailsStep()}
            {step === 'confirmation' && renderConfirmationStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-12 border-t bg-muted/20">
          <div>
            {step !== 'calendar' && (
              <button
                onClick={handleBack}
                className="btn-chrome-secondary text-lg px-10 py-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
            )}
          </div>
          
          <div className="flex space-x-6">
            <button
              onClick={onClose}
              className="btn-chrome-secondary text-lg px-10 py-4"
            >
              Cancel
            </button>
            
            {step !== 'confirmation' ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 'calendar' && (!selectedDate || !meetingDetails.timeSlot)) ||
                  (step === 'details' && !meetingDetails.topic)
                }
                className="btn-chrome-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg px-10 py-4"
              >
                Next Step
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSchedule}
                className="btn-chrome-primary text-lg px-10 py-4"
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                Schedule Session
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}