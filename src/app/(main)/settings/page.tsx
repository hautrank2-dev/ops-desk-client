"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LOCAL_KEYS } from "@/constants/local";
import { httpClient } from "@/lib/httpClient";
import { PageHeader } from "@/components/layout/PageHeader";

export default function Page() {
  const [apiUrl, setApiUrl] = useState("");

  useEffect(() => {
    setApiUrl(localStorage.getItem(LOCAL_KEYS.API_BASE_URL) || "");
  }, []);

  const handleSave = () => {
    localStorage.setItem(LOCAL_KEYS.API_BASE_URL, apiUrl);
    httpClient.defaults.baseURL = apiUrl || process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    alert("API URL saved successfully!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Configure your application settings." />
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Set the base URL for the OpsDesk API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="api-url">API Base URL</Label>
            <Input
              id="api-url"
              placeholder="https://api.example.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Default: {process.env.NEXT_PUBLIC_API_BASE_URL || "/api"}
            </p>
          </div>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
