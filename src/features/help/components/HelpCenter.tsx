import { BookOpen, HelpCircle, Lightbulb, MessageSquare, Star } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPageHelp } from "@/features/help/registry";
import type { FeedbackModule } from "@/features/help/services/feedback";
import AboutThisPage from "./AboutThisPage";
import ContactSupportForm from "./ContactSupportForm";
import FaqList from "./FaqList";
import FeedbackForm from "./FeedbackForm";
import TipsList from "./TipsList";

interface HelpCenterProps {
  pageKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEEDBACK_MODULES: FeedbackModule[] = [
  "fitness",
  "productivity",
  "finance",
  "general",
];

function moduleFromPageKey(pageKey: string): FeedbackModule {
  const prefix = pageKey.split(".")[0] as FeedbackModule;
  return FEEDBACK_MODULES.includes(prefix) ? prefix : "general";
}

/**
 * The contextual Help Center — a bottom sheet with five sections. About/Tips/FAQ
 * come from the per-page registry entry (so they only describe real features);
 * Contact Support and Feedback are always available. Renders even when a page
 * has no registered entry, falling back to just the support + feedback forms.
 */
const HelpCenter = ({ pageKey, open, onOpenChange }: HelpCenterProps) => {
  const config = getPageHelp(pageKey);
  const defaultModule = moduleFromPageKey(pageKey);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <HelpCircle size={20} className="text-primary" />
            {config ? config.title : "Help & Support"}
          </DrawerTitle>
          <DrawerDescription>
            Guidance for this page, plus ways to reach us.
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          <Tabs defaultValue={config ? "about" : "support"} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-5">
              {config && (
                <>
                  <TabsTrigger value="about" className="flex-col gap-1 py-2 text-[11px] sm:flex-row sm:text-xs">
                    <BookOpen size={15} />
                    <span className="hidden sm:inline">About</span>
                  </TabsTrigger>
                  <TabsTrigger value="tips" className="flex-col gap-1 py-2 text-[11px] sm:flex-row sm:text-xs">
                    <Lightbulb size={15} />
                    <span className="hidden sm:inline">Tips</span>
                  </TabsTrigger>
                  <TabsTrigger value="faq" className="flex-col gap-1 py-2 text-[11px] sm:flex-row sm:text-xs">
                    <HelpCircle size={15} />
                    <span className="hidden sm:inline">FAQ</span>
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="support" className="flex-col gap-1 py-2 text-[11px] sm:flex-row sm:text-xs">
                <MessageSquare size={15} />
                <span className="hidden sm:inline">Support</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex-col gap-1 py-2 text-[11px] sm:flex-row sm:text-xs">
                <Star size={15} />
                <span className="hidden sm:inline">Feedback</span>
              </TabsTrigger>
            </TabsList>

            <div className="mx-auto max-w-xl">
              {config && (
                <>
                  <TabsContent value="about">
                    <AboutThisPage about={config.about} />
                  </TabsContent>
                  <TabsContent value="tips">
                    <TipsList tips={config.tips} />
                  </TabsContent>
                  <TabsContent value="faq">
                    <FaqList faq={config.faq} />
                  </TabsContent>
                </>
              )}
              <TabsContent value="support">
                <ContactSupportForm />
              </TabsContent>
              <TabsContent value="feedback">
                <FeedbackForm defaultModule={defaultModule} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default HelpCenter;
