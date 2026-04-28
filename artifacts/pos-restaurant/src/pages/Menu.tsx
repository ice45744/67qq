import { useState } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon, Check } from "lucide-react";
import { useMenu, useCategories, MenuItem, formatCurrency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function MenuAdmin() {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu();
  const { categories } = useCategories();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [available, setAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  const openNew = () => {
    setEditingItem(null);
    setName("");
    setPrice("");
    setCategoryId(categories[0]?.id || "");
    setAvailable(true);
    setImageUrl("");
    setIsDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(item.price.toString());
    setCategoryId(item.categoryId);
    setAvailable(item.available);
    setImageUrl(item.imageUrl || "");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name || !price || !categoryId) {
      toast({ variant: "destructive", title: "กรุณากรอกข้อมูลให้ครบ" });
      return;
    }

    const payload: MenuItem = {
      id: editingItem ? editingItem.id : `menu-${Date.now()}`,
      name,
      price: Number(price),
      categoryId,
      available,
      imageUrl: imageUrl || undefined
    };

    if (editingItem) {
      updateMenuItem(payload);
      toast({ title: "บันทึกการแก้ไขแล้ว" });
    } else {
      addMenuItem(payload);
      toast({ title: "เพิ่มเมนูใหม่แล้ว" });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("ยืนยันการลบเมนูนี้?")) {
      deleteMenuItem(id);
      toast({ title: "ลบเมนูแล้ว" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto bg-muted/10 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">จัดการเมนู</h1>
            <p className="text-muted-foreground">เพิ่ม/ลด แก้ไขรายการอาหาร</p>
          </div>
          <Button onClick={openNew} className="rounded-full shadow-md active-elevate">
            <Plus className="mr-2 size-4" /> เพิ่มเมนู
          </Button>
        </div>

        {categories.map(cat => {
          const items = menuItems.filter(m => m.categoryId === cat.id);
          if (items.length === 0) return null;
          
          return (
            <div key={cat.id} className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                {cat.name}
                <Badge variant="secondary" className="ml-2 font-normal">{items.length} รายการ</Badge>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(item => (
                  <div key={item.id} className={`flex gap-4 p-3 bg-card rounded-2xl border shadow-sm transition-opacity ${!item.available ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <div className="size-24 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="size-8 text-muted-foreground opacity-30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold line-clamp-2 leading-tight">{item.name}</h3>
                      </div>
                      <div className="text-primary font-bold">{formatCurrency(item.price)}</div>
                      <div className="mt-auto flex justify-between items-center pt-2">
                        <Badge variant={item.available ? "outline" : "destructive"} className="text-[10px] px-1.5 h-5">
                          {item.available ? 'พร้อมขาย' : 'หมด'}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                            <Edit2 className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            
            <div className="flex justify-center mb-4">
              <label className="relative cursor-pointer group">
                <div className="size-32 rounded-2xl bg-muted border-2 border-dashed flex flex-col items-center justify-center overflow-hidden hover:bg-muted/80 transition-colors">
                  {imageUrl ? (
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="size-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">อัพโหลดรูป</span>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <div className="space-y-2">
              <Label>ชื่อเมนู</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น ข้าวกะเพราไก่ไข่ดาว" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ราคา (บาท)</Label>
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>หมวดหมู่</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl mt-4">
              <div className="space-y-0.5">
                <Label>สถานะพร้อมขาย</Label>
                <p className="text-xs text-muted-foreground">ปิดเมื่อวัตถุดิบหมด</p>
              </div>
              <Switch checked={available} onCheckedChange={setAvailable} />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>
              <Check className="mr-2 size-4" /> บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
