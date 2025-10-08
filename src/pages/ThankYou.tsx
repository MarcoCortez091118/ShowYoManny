import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Upload } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const ThankYou = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Content Uploaded Successfully!
            </span>
          </CardTitle>
          <CardDescription className="text-lg">
            Your content has been uploaded and is now in the moderation queue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-3">What happens next?</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Your content will be reviewed by our AI moderation system</p>
              <p>2. Once approved, it will be added to the display queue</p>
              <p>3. Your content will be displayed on our digital billboard</p>
              <p>4. You'll receive updates about the display status</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              variant="electric"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
            <Button 
              onClick={() => navigate('/upload')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload More Content
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at support@showyo.app
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYou;