import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, MapPin, Tag, Info } from "lucide-react";
import type { Trip } from "@/lib/types/planner";
import { useTripPlanner } from "@/hooks/useTripPlanner";

interface TripEditModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

export default function TripEditModal({ trip, isOpen, onClose }: TripEditModalProps) {
  const { updateTrip } = useTripPlanner();
  const [formData, setFormData] = useState({
    title: trip.title,
    destination: trip.destination,
    startDate: trip.startDate ? trip.startDate.split('T')[0] : "",
    endDate: trip.endDate ? trip.endDate.split('T')[0] : "",
    travelerCount: trip.travelerCount,
    theme: trip.theme || "",
    summary: trip.summary || "",
  });

  useEffect(() => {
    setFormData({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate ? trip.startDate.split('T')[0] : "",
      endDate: trip.endDate ? trip.endDate.split('T')[0] : "",
      travelerCount: trip.travelerCount,
      theme: trip.theme || "",
      summary: trip.summary || "",
    });
  }, [trip]);

  const handleSave = async () => {
    await updateTrip(trip.id, {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>여행 계획 수정</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">여행 제목</Label>
            <div className="relative">
              <Input 
                id="title" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="예: 오사카 먹방 여행"
                className="pl-9"
              />
              <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destination">목적지</Label>
              <div className="relative">
                <Input 
                  id="destination" 
                  value={formData.destination} 
                  onChange={e => setFormData({...formData, destination: e.target.value})}
                  placeholder="예: 일본 오사카"
                  className="pl-9"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="travelers">인원</Label>
              <div className="relative">
                <Input 
                  id="travelers" 
                  type="number"
                  value={formData.travelerCount} 
                  onChange={e => setFormData({...formData, travelerCount: parseInt(e.target.value) || 1})}
                  className="pl-9"
                />
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <div className="relative">
                <Input 
                  id="startDate" 
                  type="date"
                  value={formData.startDate} 
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="pl-9"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <div className="relative">
                <Input 
                  id="endDate" 
                  type="date"
                  value={formData.endDate} 
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  className="pl-9"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">테마</Label>
            <div className="relative">
              <Input 
                id="theme" 
                value={formData.theme} 
                onChange={e => setFormData({...formData, theme: e.target.value})}
                placeholder="예: 힐링, 맛집탐방"
                className="pl-9"
              />
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">한 줄 요약</Label>
            <Textarea 
              id="summary" 
              value={formData.summary} 
              onChange={e => setFormData({...formData, summary: e.target.value})}
              placeholder="여행에 대해 간단히 설명해주세요"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave}>저장하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
