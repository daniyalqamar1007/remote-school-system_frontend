// app/parent/components/StudentSelector.tsx
"use client";

import { Check, ChevronDown, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
} from '@/components/ui/command';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useStudent } from '../context/StudentContext';
import { useState } from 'react';

export default function StudentSelector({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const { students, selectedStudent, setSelectedStudent, isLoading } = useStudent();

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full justify-between bg-muted/50 border-dashed">
        Loading students...
      </Button>
    );
  }

  if (!selectedStudent) {
    return (
      <Button variant="outline" className="w-full justify-between bg-muted/50 border-dashed">
        No students found
      </Button>
    );
  }

  return (
    <div className={`w-full ${mobile ? 'pb-2' : ''}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-muted/50 border-dashed"
          >
            <div className="flex items-center gap-2 truncate">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedStudent.profilePhoto} alt={selectedStudent.firstName} />
                <AvatarFallback>
                  <GraduationCap className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-xs">
                <span className="font-medium truncate">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                <span className="text-muted-foreground truncate">
                  {selectedStudent.class}-{selectedStudent.section}
                </span>
              </div>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search student..." />
            <CommandEmpty>No student found.</CommandEmpty>
            <CommandGroup>
              {students.map((student) => (
                <CommandItem
                  key={student._id}
                  value={student._id}
                  onSelect={() => {
                    setSelectedStudent(student);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 py-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={student.profilePhoto} alt={student.firstName} />
                    <AvatarFallback>
                      <GraduationCap className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{student.firstName} {student.lastName}</span>
                    <span className="text-xs text-muted-foreground">
                      {student.class}-{student.section}
                    </span>
                  </div>
                  <Check
                    className={`ml-auto h-4 w-4 ${
                      selectedStudent._id === student._id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {!mobile && (
        <div className="flex justify-center mt-3">
          <Badge variant="outline" className="text-xs bg-muted/30">
            Viewing information for {selectedStudent.firstName} {selectedStudent.lastName}
          </Badge>
        </div>
      )}
    </div>
  );
}