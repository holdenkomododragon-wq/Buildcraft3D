import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useBuilder } from '@/hooks/useBuilder';

export default function NewBuildDialog() {
  const { newPrompt, setNewPrompt, newBuild, save, user, dirty } = useBuilder();
  const nav = useNavigate();
  const go = () => { newBuild(); setNewPrompt(false); nav('/'); };
  return (
    <AlertDialog open={newPrompt} onOpenChange={setNewPrompt}>
      <AlertDialogContent className="border-[#27272f] bg-[#141418]">
        <AlertDialogHeader>
          <AlertDialogTitle>Start a new build?</AlertDialogTitle>
          <AlertDialogDescription>{dirty ? 'Your current build has unsaved changes.' : 'Your current build will be replaced.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => setNewPrompt(false)}>Keep current</Button>
          <Button variant="outline" onClick={go}>Discard</Button>
          {user && <Button onClick={async () => { await save(); go(); }}>Save &amp; new</Button>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}