import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { 
  Package, 
  User, 
  MapPin, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Copy,
  Download,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { ShipmentFormData, PackageCategory, Shipment } from '@/types/shipment';
import { createShipment } from '@/services/api';
import { getFormDraft, saveFormDraft, clearFormDraft } from '@/services/storage';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const steps = [
  { key: 'sender', icon: User, label: 'Sender Info' },
  { key: 'receiver', icon: MapPin, label: 'Receiver Info' },
  { key: 'package', icon: Package, label: 'Package Details' },
  { key: 'review', icon: Check, label: 'Review' },
];

const categories: { value: PackageCategory; label: string }[] = [
  { value: 'documents', label: 'Documents' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing & Apparel' },
  { value: 'fragile', label: 'Fragile Items' },
  { value: 'food', label: 'Food & Perishables' },
  { value: 'medical', label: 'Medical Supplies' },
  { value: 'other', label: 'Other' },
];

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 
  'Germany', 'France', 'Japan', 'China', 'India', 'Brazil',
  'Mexico', 'Spain', 'Italy', 'Netherlands', 'Singapore'
];

const initialFormData: ShipmentFormData = {
  senderName: '',
  senderPhone: '',
  pickupLocation: '',
  pickupCity: '',
  pickupCountry: '',
  receiverName: '',
  receiverPhone: '',
  deliveryLocation: '',
  deliveryCity: '',
  deliveryCountry: '',
  packageDescription: '',
  packageWeight: 0,
  packageCategory: 'other',
};

export default function RequestTracking() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ShipmentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdShipment, setCreatedShipment] = useState<Shipment | null>(null);
  const [copied, setCopied] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = getFormDraft();
    if (draft) {
      setFormData(prev => ({ ...prev, ...draft }));
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveFormDraft(formData);
    }, 500);
    return () => clearTimeout(timeout);
  }, [formData]);

  const updateField = (field: keyof ShipmentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!(formData.senderName && formData.senderPhone && formData.pickupLocation && formData.pickupCity && formData.pickupCountry);
      case 1:
        return !!(formData.receiverName && formData.receiverPhone && formData.deliveryLocation && formData.deliveryCity && formData.deliveryCountry);
      case 2:
        return !!(formData.packageDescription && formData.packageWeight > 0 && formData.packageCategory);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createShipment(formData);
      if (result.success && result.data) {
        setCreatedShipment(result.data);
        addRecentlyTracked({
          trackingId: result.data.trackingId,
          status: result.data.status,
          trackedAt: new Date().toISOString(),
        });
        clearFormDraft();
        toast({
          title: 'Success!',
          description: 'Your shipment has been created.',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create shipment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingId = () => {
    if (createdShipment) {
      navigator.clipboard.writeText(createdShipment.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied!', description: 'Tracking ID copied to clipboard.' });
    }
  };

  const downloadReceipt = () => {
    if (!createdShipment) return;

    // Always print the latest admin-edited delivery date & time
    const latest = getShipmentByTrackingId(createdShipment.trackingId) || createdShipment;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(33, 99, 232);
    doc.text('Movemate LogisticExpress', pageWidth / 2, 30, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('Shipment Receipt', pageWidth / 2, 40, { align: 'center' });
    
    // Line
    doc.setDrawColor(200);
    doc.line(20, 50, pageWidth - 20, 50);
    
    // Tracking ID
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Tracking ID:', 20, 65);
    doc.setFontSize(20);
    doc.setTextColor(33, 99, 232);
    doc.text(createdShipment.trackingId, 70, 65);
    
    // Details
    doc.setFontSize(12);
    doc.setTextColor(0);
    let y = 85;
    
    doc.text('Sender Information', 20, y);
    doc.setTextColor(100);
    doc.text(`Name: ${createdShipment.senderName}`, 20, y + 10);
    doc.text(`Phone: ${createdShipment.senderPhone}`, 20, y + 18);
    doc.text(`Location: ${createdShipment.pickupCity}, ${createdShipment.pickupCountry}`, 20, y + 26);
    
    y += 45;
    doc.setTextColor(0);
    doc.text('Receiver Information', 20, y);
    doc.setTextColor(100);
    doc.text(`Name: ${createdShipment.receiverName}`, 20, y + 10);
    doc.text(`Phone: ${createdShipment.receiverPhone}`, 20, y + 18);
    doc.text(`Location: ${createdShipment.deliveryCity}, ${createdShipment.deliveryCountry}`, 20, y + 26);
    
    y += 45;
    doc.setTextColor(0);
    doc.text('Package Information', 20, y);
    doc.setTextColor(100);
    doc.text(`Description: ${createdShipment.packageDescription}`, 20, y + 10);
    doc.text(`Weight: ${createdShipment.packageWeight} kg`, 20, y + 18);
    doc.text(`Category: ${createdShipment.packageCategory}`, 20, y + 26);
    
    y += 45;
    doc.setTextColor(0);
    doc.text(`Estimated Delivery: ${formatDateTime(latest.estimatedDelivery)}`, 20, y);
    doc.setFontSize(9);
    doc.text(`Last updated: ${formatDateTime(new Date().toISOString())}`, 20, y + 8);
    doc.setFontSize(12);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Thank you for choosing Movemate LogisticExpress!', pageWidth / 2, 280, { align: 'center' });
    
    doc.save(`shipment-${createdShipment.trackingId}.pdf`);
  };

  // Success Screen
  if (createdShipment) {
    return (
      <Layout>
        <div className="container-custom py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="h-20 w-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            
            <h1 className="text-2xl font-display font-bold mb-2">
              {t('request.success.title')}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t('request.success.subtitle')}
            </p>

            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">{t('request.success.trackingId')}</p>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="text-3xl font-display font-bold text-primary">
                    {createdShipment.trackingId}
                  </span>
                  <Button variant="outline" size="icon" onClick={copyTrackingId}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="bg-card p-4 rounded-lg inline-block mb-4">
                  <QRCodeSVG 
                    value={`${window.location.origin}/track?id=${createdShipment.trackingId}`}
                    size={150}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{t('request.success.scanQr')}</p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={downloadReceipt} className="gap-2">
                <Download className="h-4 w-4" />
                {t('request.success.downloadReceipt')}
              </Button>
              <Button onClick={() => navigate(`/track?id=${createdShipment.trackingId}`)} className="gap-2">
                {t('request.success.trackNow')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="link"
              onClick={() => {
                setCreatedShipment(null);
                setFormData(initialFormData);
                setCurrentStep(0);
              }}
              className="mt-4"
            >
              {t('request.success.newShipment')}
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-4">
            {t('request.title')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('request.subtitle')}
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    index <= currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted border-border text-muted-foreground"
                  )}>
                    {index < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-2 hidden sm:block",
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-12 sm:w-24 mx-2",
                    index < currentStep ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{steps[currentStep].label}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 0: Sender Info */}
            {currentStep === 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('request.sender.name')}</Label>
                    <Input
                      value={formData.senderName}
                      onChange={(e) => updateField('senderName', e.target.value)}
                      placeholder={t('request.sender.namePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('request.sender.phone')}</Label>
                    <Input
                      value={formData.senderPhone}
                      onChange={(e) => updateField('senderPhone', e.target.value)}
                      placeholder={t('request.sender.phonePlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <Label>{t('request.sender.location')}</Label>
                  <Input
                    value={formData.pickupLocation}
                    onChange={(e) => updateField('pickupLocation', e.target.value)}
                    placeholder={t('request.sender.locationPlaceholder')}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('request.sender.city')}</Label>
                    <Input
                      value={formData.pickupCity}
                      onChange={(e) => updateField('pickupCity', e.target.value)}
                      placeholder={t('request.sender.cityPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('request.sender.country')}</Label>
                    <Select
                      value={formData.pickupCountry}
                      onValueChange={(v) => updateField('pickupCountry', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('request.sender.countryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {countries.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Receiver Info */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('request.receiver.name')}</Label>
                    <Input
                      value={formData.receiverName}
                      onChange={(e) => updateField('receiverName', e.target.value)}
                      placeholder={t('request.receiver.namePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('request.receiver.phone')}</Label>
                    <Input
                      value={formData.receiverPhone}
                      onChange={(e) => updateField('receiverPhone', e.target.value)}
                      placeholder={t('request.receiver.phonePlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <Label>{t('request.receiver.location')}</Label>
                  <Input
                    value={formData.deliveryLocation}
                    onChange={(e) => updateField('deliveryLocation', e.target.value)}
                    placeholder={t('request.receiver.locationPlaceholder')}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('request.receiver.city')}</Label>
                    <Input
                      value={formData.deliveryCity}
                      onChange={(e) => updateField('deliveryCity', e.target.value)}
                      placeholder={t('request.receiver.cityPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('request.receiver.country')}</Label>
                    <Select
                      value={formData.deliveryCountry}
                      onValueChange={(v) => updateField('deliveryCountry', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('request.receiver.countryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {countries.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Package Details */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <Label>{t('request.package.description')}</Label>
                  <Textarea
                    value={formData.packageDescription}
                    onChange={(e) => updateField('packageDescription', e.target.value)}
                    placeholder={t('request.package.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('request.package.weight')}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.packageWeight || ''}
                      onChange={(e) => updateField('packageWeight', parseFloat(e.target.value) || 0)}
                      placeholder={t('request.package.weightPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('request.package.category')}</Label>
                    <Select
                      value={formData.packageCategory}
                      onValueChange={(v) => updateField('packageCategory', v as PackageCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('request.package.categoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {categories.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">{t('request.review.senderDetails')}</h4>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>{formData.senderName}</p>
                      <p>{formData.senderPhone}</p>
                      <p>{formData.pickupLocation}</p>
                      <p>{formData.pickupCity}, {formData.pickupCountry}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{t('request.review.receiverDetails')}</h4>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>{formData.receiverName}</p>
                      <p>{formData.receiverPhone}</p>
                      <p>{formData.deliveryLocation}</p>
                      <p>{formData.deliveryCity}, {formData.deliveryCountry}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t('request.review.packageDetails')}</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>{formData.packageDescription}</p>
                    <p>Weight: {formData.packageWeight} kg</p>
                    <p>Category: {categories.find(c => c.value === formData.packageCategory)?.label}</p>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">{t('request.review.estimatedDelivery')}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.pickupCountry === formData.deliveryCountry ? '3-5' : '5-10'} {t('request.review.days')}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common.previous')}
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} className="gap-2">
                  {t('common.next')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? t('common.loading') : t('common.submit')}
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              {t('request.autoSave')}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
