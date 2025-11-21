"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ToolShell } from "@/components/tools/tool-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, RefreshCw, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import type { ConsoleVendor, ConversionResult } from "@/lib/console-translator/types";
import { ConversionService } from "@/lib/console-translator/conversion-service";
import { MappingTable } from "./mapping-table";
import { ConflictsPanel } from "./conflicts-panel";

export default function ConsoleTranslator() {
  const { user } = useAuth();

  const [sourceVendor, setSourceVendor] = useState<ConsoleVendor>('grandma2');
  const [targetVendor, setTargetVendor] = useState<ConsoleVendor>('eos');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [exportedContent, setExportedContent] = useState<string>('');

  const [activeTab, setActiveTab] = useState('upload');

  const conversionService = new ConversionService();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    try {
      const content = await file.text();
      setFileContent(content);

      const detectedVendor = detectVendor(file.name, content);
      if (detectedVendor !== 'unknown') {
        setSourceVendor(detectedVendor);
      }

      toast({
        title: "File Uploaded",
        description: `${file.name} loaded successfully (${detectedVendor} detected)`
      });

      setActiveTab('configure');
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const detectVendor = (filename: string, content: string): ConsoleVendor => {
    const lower = filename.toLowerCase();

    if (lower.includes('grandma') || lower.includes('.ma2') || content.includes('grandMA')) {
      return 'grandma2';
    }
    if (lower.includes('.hog') || content.includes('Hog')) {
      return 'hog4';
    }
    if (lower.includes('.esf') || content.includes('Eos')) {
      return 'eos';
    }
    if (lower.includes('.cit') || content.includes('Titan')) {
      return 'avolites';
    }

    return 'unknown';
  };

  const handleConvert = async () => {
    if (!fileContent) {
      toast({
        title: "No File",
        description: "Please upload a showfile first",
        variant: "destructive"
      });
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);

    try {
      setConversionProgress(20);

      const { result, exported } = await conversionService.fullConversion(
        fileContent,
        sourceVendor,
        targetVendor,
        { startUniverse: 1 }
      );

      setConversionProgress(100);
      setConversionResult(result);
      setExportedContent(exported);

      toast({
        title: "Conversion Complete",
        description: `Mapped ${result.stats.fixturesMapped} fixtures with ${result.stats.averageConfidence.toFixed(0)}% avg confidence`
      });

      setActiveTab('results');
    } catch (error: any) {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedContent) return;

    const blob = new Blob([exportedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${targetVendor}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Converted showfile saved successfully"
    });
  };

  const handleReset = () => {
    setUploadedFile(null);
    setFileContent('');
    setConversionResult(null);
    setExportedContent('');
    setConversionProgress(0);
    setActiveTab('upload');
  };

  return (
    <ToolShell
      title="Multi-Console Translator"
      description="Convert showfiles between lighting console formats with intelligent fixture mapping and validation"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">1. Upload</TabsTrigger>
            <TabsTrigger value="configure" disabled={!fileContent}>2. Configure</TabsTrigger>
            <TabsTrigger value="preview" disabled={!fileContent}>3. Preview</TabsTrigger>
            <TabsTrigger value="results" disabled={!conversionResult}>4. Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card className="p-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-cyan-400" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Upload Showfile</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Supported formats: grandMA2, Hog4, ETC Eos, Avolites Titan
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    id="showfile-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".txt,.ma2,.hog,.show,.esf,.cit"
                  />
                  <label htmlFor="showfile-upload">
                    <Button asChild className="cursor-pointer">
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                </div>

                {uploadedFile && (
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      <span>{uploadedFile.name}</span>
                      <span className="text-gray-500">
                        ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="configure" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conversion Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Source Console</Label>
                  <Select value={sourceVendor} onValueChange={(v) => setSourceVendor(v as ConsoleVendor)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grandma2">grandMA2</SelectItem>
                      <SelectItem value="grandma3">grandMA3</SelectItem>
                      <SelectItem value="hog4">Hog4</SelectItem>
                      <SelectItem value="eos">ETC Eos</SelectItem>
                      <SelectItem value="avolites">Avolites Titan</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="chamsys">ChamSys MagicQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target Console</Label>
                  <Select value={targetVendor} onValueChange={(v) => setTargetVendor(v as ConsoleVendor)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grandma2">grandMA2</SelectItem>
                      <SelectItem value="grandma3">grandMA3</SelectItem>
                      <SelectItem value="hog4">Hog4</SelectItem>
                      <SelectItem value="eos">ETC Eos</SelectItem>
                      <SelectItem value="avolites">Avolites Titan</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="chamsys">ChamSys MagicQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button onClick={handleConvert} disabled={isConverting} className="flex-1">
                  {isConverting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Convert
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Reset
                </Button>
              </div>

              {isConverting && (
                <div className="mt-4">
                  <Progress value={conversionProgress} />
                  <p className="text-sm text-center text-gray-400 mt-2">
                    {conversionProgress}% complete
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Source File Preview</h3>
              <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {fileContent.substring(0, 2000)}
                  {fileContent.length > 2000 && '\n\n... (truncated)'}
                </pre>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {conversionResult && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Fixtures Mapped</p>
                        <p className="text-2xl font-bold text-cyan-400">
                          {conversionResult.stats.fixturesMapped}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-cyan-400" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Avg Confidence</p>
                        <p className="text-2xl font-bold text-violet-400">
                          {conversionResult.stats.averageConfidence.toFixed(0)}%
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-violet-400" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Universes Used</p>
                        <p className="text-2xl font-bold text-magenta-400">
                          {conversionResult.stats.universesUsed}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-magenta-400" />
                    </div>
                  </Card>
                </div>

                {conversionResult.conflicts.length > 0 && (
                  <ConflictsPanel conflicts={conversionResult.conflicts} />
                )}

                {conversionResult.mappings.length > 0 && (
                  <MappingTable mappings={conversionResult.mappings} />
                )}

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Exported Showfile</h3>
                    <Button onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-auto">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {exportedContent}
                    </pre>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ToolShell>
  );
}
