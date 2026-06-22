import { useState } from "react";
import { Store, Save, Upload } from "lucide-react";
import { useSettings } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { settings, setSettings } = useSettings();
  const { toast } = useToast();

  const [formData, setFormData] = useState(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoDataUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    await setSettings(formData);
    toast({
      title: "บันทึกการตั้งค่าแล้ว",
      description: "ข้อมูลร้านค้าถูกอัปเดตเรียบร้อย",
    });
  };

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto bg-muted/10 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าร้านค้า</h1>
          <p className="text-muted-foreground">ข้อมูลที่จะแสดงบนใบคิวและใบเสร็จ</p>
        </div>

        <div className="bg-card rounded-3xl border shadow-sm p-6 space-y-8">

          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="relative group">
              <div className="size-32 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden">
                {formData.logoDataUrl ? (
                  <img src={formData.logoDataUrl} alt="Logo" className="w-full h-full object-contain bg-white" />
                ) : (
                  <Store className="size-10 text-muted-foreground opacity-30" />
                )}
              </div>
              <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                <Upload className="size-6 mb-1" />
                <span className="text-xs font-medium">เปลี่ยนโลโก้</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold">โลโก้ร้าน</h3>
              <p className="text-sm text-muted-foreground">จะปรากฏบนใบเสร็จลูกค้า แนะนำเป็นรูปขาวดำ อัตราส่วน 1:1</p>
              {formData.logoDataUrl && (
                <Button variant="link" size="sm" className="text-destructive h-auto p-0 mt-2"
                  onClick={() => setFormData(p => ({ ...p, logoDataUrl: undefined }))}>
                  ลบรูปโลโก้
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <Label>ชื่อร้าน</Label>
              <Input name="name" value={formData.name} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>ข้อความท้ายใบเสร็จ</Label>
              <Input name="footerMessage" value={formData.footerMessage} onChange={handleChange} />
              <p className="text-xs text-muted-foreground">เช่น "ขอบคุณที่ใช้บริการ"</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t">
            <Button size="lg" onClick={handleSave} className="w-full sm:w-auto font-bold px-8 active-elevate shadow-md">
              <Save className="mr-2 size-5" /> บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
