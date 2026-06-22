import { useState } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, Tag, X } from "lucide-react";
import { useMenu, useCategories, MenuItem, Category, formatCurrency } from "@/lib/store";
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
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [available, setAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");

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

  const handleSave = async () => {
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
      await updateMenuItem(payload);
      toast({ title: "บันทึกการแก้ไขแล้ว" });
    } else {
      await addMenuItem(payload);
      toast({ title: "เพิ่มเมนูใหม่แล้ว" });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันการลบเมนูนี้?")) {
      await deleteMenuItem(id);
      toast({ title: "ลบเมนูแล้ว" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 600;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      setImageUrl(canvas.toDataURL("image/jpeg", 0.75));
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const openNewCat = () => {
    setEditingCat(null);
    setCatName("");
    setIsCatDialogOpen(true);
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setIsCatDialogOpen(true);
  };

  const handleSaveCat = async () => {
    const trimmed = catName.trim();
    if (!trimmed) {
      toast({ variant: "destructive", title: "กรุณากรอกชื่อหมวดหมู่" });
      return;
    }

    if (editingCat) {
      await updateCategory({ ...editingCat, name: trimmed });
      toast({ title: "แก้ไขหมวดหมู่แล้ว" });
    } else {
      const maxSort = categories.reduce((m, c) => Math.max(m, c.sortOrder), 0);
      await addCategory({
        id: `cat-${Date.now()}`,
        name: trimmed,
        sortOrder: maxSort + 1,
      });
      toast({ title: "เพิ่มหมวดหมู่ใหม่แล้ว" });
    }
    setIsCatDialogOpen(false);
  };

  const handleDeleteCat = async (cat: Category) => {
    const itemsInCat = menuItems.filter(m => m.categoryId === cat.id).length;
    const msg = itemsInCat > 0
      ? `หมวดนี้มี ${itemsInCat} เมนู หากลบ เมนูเหล่านั้นจะถูกลบไปด้วย ยืนยันลบ?`
      : `ยืนยันการลบหมวด "${cat.name}"?`;
    if (confirm(msg)) {
      await Promise.all(menuItems.filter(m => m.categoryId === cat.id).map(m => deleteMenuItem(m.id)));
      await deleteCategory(cat.id);
      toast({ title: "ลบหมวดหมู่แล้ว" });
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto bg-muted/10 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">จัดการเมนู</h1>
            <p className="text-muted-foreground">เพิ่ม/ลด แก้ไขหมวดหมู่และรายการอาหาร</p>
          </div>
          <Button onClick={openNew} className="rounded-full shadow-md active-elevate" disabled={categories.length === 0}>
            <Plus className="mr-2 size-4" /> เพิ่มเมนู
          </Button>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Tag className="size-4 text-primary" />
              หมวดหมู่
              <Badge variant="secondary" className="ml-1 font-normal">{categories.length}</Badge>
            </h2>
            <Button variant="outline" size="sm" onClick={openNewCat} className="rounded-full">
              <Plus className="mr-1 size-3.5" /> เพิ่มหมวด
            </Button>
          </div>
          {categories.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">ยังไม่มีหมวดหมู่ — กดเพิ่มหมวดเพื่อเริ่มต้น</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(cat => {
                  const count = menuItems.filter(m => m.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="group inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-muted rounded-full border"
                    >
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">({count})</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1"
                        onClick={() => openEditCat(cat)}
                        title="แก้ไข"
                      >
                        <Edit2 className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteCat(cat)}
                        title="ลบ"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {menuItems.length === 0 ? (
          <div className="bg-card rounded-2xl border shadow-sm py-16 text-center">
            <ImageIcon className="size-10 text-muted-foreground opacity-30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {categories.length === 0
                ? "เพิ่มหมวดหมู่ก่อน แล้วจึงเพิ่มเมนู"
                : "ยังไม่มีเมนู กดปุ่ม \"เพิ่มเมนู\" เพื่อเริ่มต้น"}
            </p>
          </div>
        ) : (
          categories
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(cat => {
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
            })
        )}
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

      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent className="max-w-sm sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>ชื่อหมวดหมู่</Label>
            <Input
              value={catName}
              onChange={e => setCatName(e.target.value)}
              placeholder="เช่น เครื่องดื่ม, ของหวาน"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveCat(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCatDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSaveCat}>
              <Check className="mr-2 size-4" /> บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
