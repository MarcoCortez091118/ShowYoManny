import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Upload, Palette, Type } from "lucide-react";

interface CustomBorderEditorProps {
  border: {
    id: string;
    name: string;
    message: string;
  };
  onSave: (updatedBorder: { message: string; customData?: any }) => void;
}

export const CustomBorderEditor: React.FC<CustomBorderEditorProps> = ({ border, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState(border.message);
  const [eventName, setEventName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [brandName, setBrandName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [hashtag, setHashtag] = useState('');

  const handleSave = () => {
    let finalMessage = customText;
    let customData = {};

    switch (border.id) {
      case 'event-name':
        finalMessage = `${eventName} ✦ ${location} ✦ ${date}`;
        customData = { eventName, location, date };
        break;
      case 'scrolling-ticker':
        finalMessage = `${brandName} ✦ ${customMessage} ✦ ${hashtag}`;
        customData = { brandName, customMessage, hashtag };
        break;
      case 'color-gradient':
        finalMessage = customText;
        customData = { customText };
        break;
      case 'logo-corners':
        finalMessage = '[LOGO UPLOADED]';
        customData = { hasLogo: true };
        break;
    }

    onSave({ message: finalMessage, customData });
    setIsOpen(false);
  };

  const renderEditor = () => {
    switch (border.id) {
      case 'event-name':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Birthday Party, Wedding, etc."
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Manhattan, NYC"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Dec 25, 2024"
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-sm text-muted-foreground">
                {eventName || 'EVENT NAME'} ✦ {location || 'LOCATION'} ✦ {date || 'DATE'}
              </p>
            </div>
          </div>
        );

      case 'scrolling-ticker':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="ShowYo, Your Brand"
              />
            </div>
            <div>
              <Label htmlFor="customMessage">Custom Message</Label>
              <Input
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="SPECIAL OFFER, NEW ANNOUNCEMENT"
              />
            </div>
            <div>
              <Label htmlFor="hashtag">Hashtag</Label>
              <Input
                id="hashtag"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder="#ShowYo #Billboard"
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-sm text-muted-foreground">
                {brandName || 'YOUR BRAND'} ✦ {customMessage || 'CUSTOM MESSAGE'} ✦ {hashtag || '#HASHTAG'}
              </p>
            </div>
          </div>
        );

      case 'color-gradient':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="customText">Custom Text</Label>
              <Textarea
                id="customText"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Enter your custom message here..."
                rows={3}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-sm text-muted-foreground">
                {customText || 'EDITABLE TEXT HERE'}
              </p>
            </div>
          </div>
        );

      case 'logo-corners':
        return (
          <div className="space-y-4">
            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-2">Upload Your Logo</p>
              <p className="text-xs text-muted-foreground mb-4">
                Logo will appear in the corners of your content
              </p>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Edit3 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {border.id === 'event-name' && <Type className="h-5 w-5" />}
            {border.id === 'logo-corners' && <Upload className="h-5 w-5" />}
            {border.id === 'color-gradient' && <Palette className="h-5 w-5" />}
            {border.id === 'scrolling-ticker' && <Type className="h-5 w-5" />}
            Customize {border.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {renderEditor()}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};